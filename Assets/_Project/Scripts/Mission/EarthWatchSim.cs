using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace SpaceApps.Mission
{
    public enum ProblemKind { SolarStorm, GroundOutage, AttitudeFault }

    /// <summary>Forces a problem at the end of a week. Used by tests and by tuning; a normal run draws its own.</summary>
    public class ForcedProblem
    {
        public int week;
        public ProblemKind kind;
    }

    [Serializable] public class SimAlert { public string code, title; }
    [Serializable] public class SimCommand { public string name, label; public bool enabled, active; }
    [Serializable] public class SimFactor { public string label; public float value; }
    [Serializable] public class SimLogEntry { public int week; public string text, kind; }

    /// <summary>The report shown after week 52 or after a total failure.</summary>
    [Serializable]
    public class SimReport
    {
        public float successRate;
        public int imagesDelivered;
        /// <summary>Success, Too few images, Satellite lost, or Requirements not met (set by the session).</summary>
        public string outcome;
        public bool success;
        public List<SimFactor> factors = new List<SimFactor>();
        public string lostBecause, suggestion;
        public List<string> decisions = new List<string>();
        public string[] images = new string[EarthWatchSim.Weeks];
    }

    /// <summary>What the page needs to draw one simulated step. Mirrors SimFrame in docs/bridge.md.</summary>
    [Serializable]
    public class SimFrame
    {
        public int week, day;
        public string speed = "paused";
        public float battery, pointingError, cameraTemp, linkQuality, projectedSuccess;
        public int storageQueue, imagesDelivered, imagesLost;
        public string[] weeks = new string[EarthWatchSim.Weeks];
        public bool contact, capturing;
        public SimAlert alert;
        public List<SimCommand> commands = new List<SimCommand>();
        public List<SimLogEntry> log = new List<SimLogEntry>();
        public SimReport report;
    }

    /// <summary>
    /// The weekly Earth Watch simulation. Each week has three steps, one call to <see cref="Step"/> each:
    /// capture, downlink, then recharge and update (where a problem may start). Every starting value and rate
    /// comes from the player's design and the catalog; the same catalog, design and seed give the same run.
    /// Commands (<see cref="Command"/>) are accepted between steps.
    /// </summary>
    public class EarthWatchSim
    {
        public const int Weeks = 52;
        const string Paused = "camera paused", Safe = "safe mode", Power = "low power", Hot = "camera too hot",
                     Pointing = "pointing off target", Full = "storage full", NoCamera = "no camera";

        readonly MissionCatalog cat;
        readonly EarthWatchDesign design;
        readonly SimConstants s;
        readonly Random rng;

        // Parts and values derived from the design.
        readonly Instrument camera;
        readonly Radio radio;
        readonly GroundStation station;
        readonly AttitudeOption attitude;
        readonly StorageOption storage;
        readonly BackupStation backup;
        readonly Orbit orbit;
        readonly bool bandMatch;
        readonly float capWh, genW, baseLoadW, captureWh, downlinkWh, passMb, imageMb, baseTemp, basePointing, tol;
        readonly int queueCap, captureEvery, minImages;
        public readonly float PassMb;
        public readonly int StorageCapacity;
        public readonly float BatteryWh;

        // State.
        int week = 1, phase;
        float battery = 100f, pointing, temp, link = 100f, partialMb;
        readonly List<int> queue = new List<int>();
        readonly string[] wk = new string[Weeks];
        int delivered, lost, silence, passesUsed, weeksDone, pointOk, outageWeeksTotal;
        float powerSum, minBattery = 100f;
        readonly int[] deliveredPerWeek = new int[Weeks];
        int stormWeeksLeft, faultWeeksLeft, outageWeeksLeft, backupWeeksLeft, pausedWeeks, safeWeeks;
        bool prioritize, lastCapturing, lastContact, answered, launchFailed;
        int frameWeek = 1, framePhase;
        SimAlert alert;
        string alertKind;
        readonly Dictionary<string, int> causes = new Dictionary<string, int>();
        readonly List<SimLogEntry> log = new List<SimLogEntry>();
        readonly List<ForcedProblem> schedule = new List<ForcedProblem>();
        readonly HashSet<ProblemKind> seen = new HashSet<ProblemKind>();

        public bool Finished { get; private set; }
        public string Fatal { get; private set; }
        public SimReport Report { get; private set; }
        public int Week => week;
        public int ImagesDelivered => delivered;
        public int ImagesLost => lost;
        public float MinBattery => minBattery;
        public int QueueCount => queue.Count;
        public int OutageWeeksTotal => outageWeeksTotal;
        public IReadOnlyCollection<ProblemKind> ProblemsSeen => seen;
        /// <summary>True while a problem alert is showing and no command has answered it yet.</summary>
        public bool AwaitingDecision => alert != null && !answered;
        public IReadOnlyList<ForcedProblem> Schedule => schedule;

        public EarthWatchSim(MissionCatalog catalog, EarthWatchDesign d, int seed, IEnumerable<ForcedProblem> forced = null, string launchFailure = null)
        {
            cat = catalog; design = d; s = catalog.earthWatch.sim; rng = new Random(seed);
            var ew = catalog.earthWatch;
            camera = MissionCatalog.Find(catalog.instruments, d.instrument);
            radio = MissionCatalog.Find(catalog.radios, d.radio);
            station = MissionCatalog.Find(catalog.groundStations, d.groundStation);
            attitude = MissionCatalog.Find(ew.attitudes, d.attitude);
            storage = MissionCatalog.Find(ew.storages, d.storage);
            backup = MissionCatalog.Find(ew.backupStations, d.backupStation);
            orbit = MissionCatalog.Find(catalog.orbits, d.orbit);
            var power = MissionCatalog.Find(catalog.power, d.power);
            var revisit = MissionCatalog.Find(ew.revisits, d.revisit);
            bandMatch = radio != null && station != null && station.bands.Contains(radio.band);

            capWh = Math.Max(0.1f, power?.batteryWh.value ?? 0.1f);
            float sunlit = orbit?.sunlitFraction.value ?? 0.6f;
            genW = (power?.panelW.value ?? 0f) * sunlit;
            baseLoadW = catalog.constants.busPowerW + (attitude?.powerW.value ?? 0f);
            captureWh = (camera?.powerW.value ?? 0f) * s.captureHours;
            float passMinutes = (orbit?.contactMinutesPerDay.value ?? 25f) * (station?.stationCount.value ?? 0f);
            passMb = radio != null ? radio.rateKbps * passMinutes * 60f / 8f / 1000f : 0f;
            downlinkWh = (radio?.txPowerW.value ?? 0f) * passMinutes / 60f;
            imageMb = Math.Max(0.01f, camera?.imageMb.value ?? 0.01f);
            baseTemp = s.cameraBaseTempC + s.tempPerCameraW * (camera?.powerW.value ?? 0f);
            basePointing = attitude?.basePointingDeg.value ?? 3f;
            tol = s.pointingToleranceDeg;
            queueCap = (int)(storage?.capacityImages.value ?? 0f);
            captureEvery = Math.Max(1, (int)(revisit?.captureEveryWeeks.value ?? 1f));
            minImages = (int)s.minImages.value;
            PassMb = passMb; StorageCapacity = queueCap; BatteryWh = capWh;
            pointing = basePointing; temp = baseTemp;
            for (int i = 0; i < Weeks; i++) wk[i] = "";

            if (launchFailure != null)
            {
                launchFailed = true;
                Say(0, "The launch did not happen: " + launchFailure, "alert");
                Finish("The launch could not go ahead: " + launchFailure);
                return;
            }
            Plan(forced);
        }

        // ---- Problems: when they happen, and how likely they are for this design ----

        /// <summary>Chance per year of a problem, for this design.</summary>
        public float YearlyChance(ProblemKind kind)
        {
            switch (kind)
            {
                case ProblemKind.SolarStorm:
                    return s.stormYearlyChance + (capWh < s.stormTightBatteryWh ? s.stormTightBonus.value : 0f);
                case ProblemKind.GroundOutage:
                    return (station?.outageChancePerYear.value ?? 1f) * (backup?.chanceFactor.value ?? 1f);
                default:
                    return Math.Min(1f, (attitude?.faultChancePerYear.value ?? 1f) * (1f - Math.Max(0f, Reliability() - cat.constants.baseReliability.value)));
            }
        }

        /// <summary>Hardware reliability from the tests the player chose (the same figure the design check uses).</summary>
        public float Reliability() =>
            Math.Min(cat.constants.maxReliability.value, cat.constants.baseReliability + design.tests.Distinct()
                .Select(id => MissionCatalog.Find(cat.tests, id)).Where(t => t != null).Sum(t => t.reliabilityBonus.value));

        void Plan(IEnumerable<ForcedProblem> forced)
        {
            var draws = new List<ForcedProblem>();
            foreach (ProblemKind kind in Enum.GetValues(typeof(ProblemKind)))
            {
                bool happens = rng.NextDouble() < YearlyChance(kind);
                int w = 3 + rng.Next(0, Weeks - 5);
                if (happens) draws.Add(new ForcedProblem { week = w, kind = kind });
            }
            if (forced != null) { draws.Clear(); draws.AddRange(forced); }
            draws = draws.OrderBy(p => p.week).ToList();
            int spacing = (int)s.eventSpacingWeeks.value;
            for (int i = 1; i < draws.Count; i++)
                if (forced == null && draws[i].week - draws[i - 1].week < spacing) draws[i].week = draws[i - 1].week + spacing;
            schedule.AddRange(draws.Where(p => p.week < Weeks));
        }

        // ---- Stepping ----

        /// <summary>Advances one step (capture, downlink or update) and returns the frame after it.</summary>
        public SimFrame Step()
        {
            if (Finished) return Snapshot();
            frameWeek = week; framePhase = phase; lastCapturing = false; lastContact = false;
            if (phase == 0) { Capture(); phase = 1; }
            else if (phase == 1) { Downlink(); phase = 2; }
            else { Update(); phase = 0; weeksDone++; }
            minBattery = Math.Min(minBattery, battery);
            if (!Finished && Fatal == null) CheckFatal();
            if (!Finished && Fatal != null) Finish(Fatal);
            else if (!Finished && framePhase == 2)
            {
                if (week >= Weeks) Finish(null);
                else week++;
            }
            return Snapshot();
        }

        void Capture()
        {
            if ((week - 1) % captureEvery != 0) return;
            if (camera == null) { Lose(week, NoCamera); return; }
            if (safeWeeks > 0) { Lose(week, Safe); return; }
            if (pausedWeeks > 0) { Lose(week, Paused); return; }
            if (battery < s.minCaptureBatteryPct) { Lose(week, Power); return; }
            if (temp >= s.maxCameraTempC) { Lose(week, Hot); return; }
            if (pointing > tol) { Lose(week, Pointing); return; }
            if (queueCap <= 0) { Lose(week, Full); return; }
            if (queue.Count >= queueCap) { int old = queue[0]; queue.RemoveAt(0); Lose(old, Full); }
            queue.Add(week);
            wk[week - 1] = "held";
            battery -= captureWh / capWh * 100f;
            lastCapturing = true;
            Say(week, $"Image {week:00} captured, waiting for a ground pass", "info");
        }

        void Downlink()
        {
            bool equipped = radio != null && station != null && bandMatch;
            link = outageWeeksLeft > 0 || !equipped ? 0f : Math.Max(0f, 100f - 20f * Math.Max(0f, pointing - tol));
            if (equipped && outageWeeksLeft == 0 && battery < 10f) link = 0f;
            if (link <= 0f) { silence++; if (outageWeeksLeft > 0) outageWeeksTotal++; return; }
            lastContact = true;
            battery -= downlinkWh / capWh * 100f;
            if (link < s.minLinkPct) { silence++; Say(week, "Ground pass with a weak link, nothing could be sent", "alert"); return; }
            silence = 0; passesUsed++;
            float mb = passMb * link / 100f * (backupWeeksLeft > 0 ? backup.passFactor.value : 1f);
            if (prioritize && queue.Count > 0)
            {
                mb = float.MaxValue;
                battery -= s.prioritizeWh / capWh * 100f;
                Say(week, "Priority downlink: the whole queue goes down in this pass", "info");
            }
            prioritize = false;
            while (queue.Count > 0)
            {
                float need = imageMb - partialMb;
                if (mb < need) { partialMb += mb; break; }
                mb -= need; partialMb = 0f;
                int idx = queue[0]; queue.RemoveAt(0);
                wk[idx - 1] = "sent"; delivered++; deliveredPerWeek[week - 1]++;
                Say(week, $"Image {idx:00} delivered to the scientists", "good");
            }
        }

        void Update()
        {
            // Problems already running.
            if (stormWeeksLeft > 0)
            {
                battery -= s.stormDrainWh / capWh * 100f;
                if (--stormWeeksLeft == 0) { pointing = basePointing; Clear("storm", "The solar storm has passed"); }
            }
            if (faultWeeksLeft > 0)
            {
                pointing += attitude?.driftDegPerWeek.value ?? 0.5f;
                if (--faultWeeksLeft == 0) { pointing = basePointing; Clear("attitude", "The attitude controller reset itself"); }
            }
            if (outageWeeksLeft > 0 && --outageWeeksLeft == 0) Clear("ground", "The ground station is back online");

            // Recharge: panels against the always-on load. Bad pointing turns the panels away from the Sun.
            float gen = genW * (pointing > tol ? s.panelLossFactor : 1f);
            battery = Math.Min(100f, battery + (gen - baseLoadW) * s.chargeHours / capWh * 100f);
            if (stormWeeksLeft == 0) temp = baseTemp + (temp - baseTemp) * s.tempRelax;

            pausedWeeks = Math.Max(0, pausedWeeks - 1);
            safeWeeks = Math.Max(0, safeWeeks - 1);
            backupWeeksLeft = Math.Max(0, backupWeeksLeft - 1);
            powerSum += Math.Max(0f, battery);
            if (pointing <= tol) pointOk++;
            minBattery = Math.Min(minBattery, battery);

            foreach (var p in schedule.Where(p => p.week == week).ToList()) Start(p.kind);
            minBattery = Math.Min(minBattery, battery);
        }

        void Start(ProblemKind kind)
        {
            seen.Add(kind); answered = false;
            switch (kind)
            {
                case ProblemKind.SolarStorm:
                    battery -= s.stormEnergyWh / capWh * 100f;
                    pointing += s.stormPointingDeg; temp += s.stormHeatC;
                    stormWeeksLeft = (int)s.stormWeeks.value;
                    Raise("solar-storm", "SOLAR STORM · PROTON FLUX HIGH", "storm");
                    Say(week, $"Solar storm: the battery fell to {Math.Max(0f, battery):0}%", "alert");
                    break;
                case ProblemKind.GroundOutage:
                    outageWeeksLeft = Math.Max(1, (int)((station?.outageWeeks.value ?? 1f) - (backup?.weeksSaved.value ?? 0f)));
                    Raise("ground-station-offline", "GROUND STATION OFFLINE · PASS MISSED", "ground");
                    Say(week, $"Ground station offline for about {outageWeeksLeft} week{(outageWeeksLeft == 1 ? "" : "s")}", "alert");
                    break;
                default:
                    faultWeeksLeft = (int)s.attitudeFaultMaxWeeks.value;
                    pointing += attitude?.driftDegPerWeek.value ?? 0.5f;
                    Raise("attitude-fault", "ATTITUDE FAULT · POINTING DRIFT", "attitude");
                    Say(week, $"Attitude fault: pointing error {pointing:0.0} degrees and growing", "alert");
                    break;
            }
        }

        // ---- Commands ----

        /// <summary>Applies a flight command between steps. Returns false when it is unknown or not available now.</summary>
        public bool Command(string name)
        {
            if (Finished) return false;
            var cmd = Commands().FirstOrDefault(c => c.name == name);
            if (cmd == null || !cmd.enabled) return false;
            answered = true;
            switch (name)
            {
                case "pauseCamera":
                    if (stormWeeksLeft > 0)
                    {
                        stormWeeksLeft = 0;
                        battery = Math.Min(100f, battery + s.pauseRecoverWh / capWh * 100f);
                        temp -= s.pauseCoolC; pointing = Math.Min(pointing, tol * 0.9f);
                        Clear("storm", null);
                    }
                    pausedWeeks = outageWeeksLeft > 0 ? Math.Max(1, outageWeeksLeft) : 1;
                    Say(week, "Camera paused: no images while it is off", "info");
                    break;
                case "safeMode":
                    if (stormWeeksLeft > 0) { stormWeeksLeft = 0; temp = baseTemp; Clear("storm", null); }
                    if (faultWeeksLeft > 0) { faultWeeksLeft = 0; Clear("attitude", null); }
                    pointing = Math.Min(pointing, basePointing);
                    battery = Math.Max(battery, s.safeModeBatteryPct);
                    safeWeeks = (int)s.safeModeWeeks.value;
                    Say(week, $"Safe mode: the satellite recovers, no images for {safeWeeks} weeks", "info");
                    break;
                case "prioritizeDownlink":
                    prioritize = true;
                    Say(week, "Priority downlink armed for the next pass", "info");
                    break;
                case "useBackupStation":
                    outageWeeksLeft = 0; backupWeeksLeft = (int)s.backupWeeks.value;
                    Clear("ground", null);
                    Say(week, "Backup station: contact is back, but its passes carry less", "info");
                    break;
                case "recalibrate":
                    faultWeeksLeft = 0; pointing = basePointing;
                    pausedWeeks = Math.Max(pausedWeeks, (int)(attitude?.recalibrateWeeks.value ?? 1f));
                    battery -= s.recalibrateWh / capWh * 100f;
                    Clear("attitude", null);
                    Say(week, $"Recalibrating: no images for {pausedWeeks} week{(pausedWeeks == 1 ? "" : "s")}", "info");
                    break;
            }
            if (battery <= 0f) { Fatal = "The battery ran flat and the satellite was lost."; Finish(Fatal); }
            return true;
        }

        public List<SimCommand> Commands()
        {
            bool live = !Finished;
            bool hasBackup = backup != null && backup.weeksSaved.value > 0f;
            return new List<SimCommand>
            {
                new SimCommand { name = "pauseCamera", label = pausedWeeks > 0 ? "CAMERA PAUSED" : "PAUSE CAMERA", enabled = live && camera != null, active = pausedWeeks > 0 },
                new SimCommand { name = "safeMode", label = safeWeeks > 0 ? "IN SAFE MODE" : "SAFE MODE", enabled = live, active = safeWeeks > 0 },
                new SimCommand { name = "prioritizeDownlink", label = prioritize ? "DOWNLINK PRIORITY SET" : "PRIORITIZE DOWNLINK", enabled = live && (queue.Count > 0 || outageWeeksLeft > 0), active = prioritize },
                new SimCommand { name = "useBackupStation", label = backupWeeksLeft > 0 ? "BACKUP STATION IN USE" : "USE BACKUP STATION", enabled = live && hasBackup && outageWeeksLeft > 0, active = backupWeeksLeft > 0 },
                new SimCommand { name = "recalibrate", label = "RECALIBRATE", enabled = live && (faultWeeksLeft > 0 || pointing > basePointing + 0.05f), active = false },
            };
        }

        // ---- Failure, frames and the report ----

        void CheckFatal()
        {
            if (battery <= 0f) Fatal = "The battery ran flat and the satellite was lost.";
            else if (silence >= (int)s.silenceWeeksLost.value) Fatal = $"No contact with the satellite for {silence} weeks: it was declared lost.";
            else if (orbit != null && week > orbit.lifetimeMonths * s.weeksPerMonth) Fatal = $"Air drag in {orbit.name} brought the satellite down in week {week}.";
        }

        public SimFrame Snapshot()
        {
            var f = new SimFrame
            {
                week = launchFailed ? 0 : frameWeek,
                day = (frameWeek - 1) * 7 + (framePhase == 0 ? 2 : framePhase == 1 ? 4 : 7),
                battery = Math.Max(0f, battery), pointingError = pointing, cameraTemp = temp, linkQuality = link,
                storageQueue = queue.Count, imagesDelivered = delivered, imagesLost = lost,
                projectedSuccess = Rate(true), contact = lastContact, capturing = lastCapturing,
                alert = alert, commands = Commands(), report = Report,
            };
            Array.Copy(wk, f.weeks, Weeks);
            if (!Finished && phase == 0 && week >= 1 && wk[week - 1] == "" && (week - 1) % captureEvery == 0) f.weeks[week - 1] = "next";
            f.log = log.Skip(Math.Max(0, log.Count - 8)).ToList();
            return f;
        }

        /// <summary>The four weighted factors, each 0 to 1. With <paramref name="project"/> the rest of the year
        /// is assumed to go like the last eight weeks.</summary>
        float[] Factors(bool project)
        {
            int n = Math.Max(1, weeksDone);
            float d = delivered;
            if (project && !Finished)
            {
                int recentWeeks = Math.Min(8, weeksDone);
                float rate = recentWeeks == 0 ? 1f / captureEvery
                    : Enumerable.Range(weeksDone - recentWeeks, recentWeeks).Sum(i => deliveredPerWeek[i]) / (float)recentWeeks;
                d = Math.Min(Weeks, delivered + (Weeks - weeksDone) * rate);
            }
            return new[]
            {
                d / Weeks,
                weeksDone == 0 ? 1f : passesUsed / (float)n,
                weeksDone == 0 ? 1f : powerSum / n / 100f,
                weeksDone == 0 ? 1f : pointOk / (float)n,
            };
        }

        float Rate(bool project)
        {
            var f = Factors(project);
            return 100f * (f[0] * s.weightScience + f[1] * s.weightLink + f[2] * s.weightPower + f[3] * s.weightPointing);
        }

        void Finish(string fatal)
        {
            Finished = true; Fatal = fatal;
            var f = Factors(false);
            var r = new SimReport { imagesDelivered = delivered, successRate = Rate(false) };
            r.factors.Add(new SimFactor { label = "Science return", value = f[0] * 100f });
            r.factors.Add(new SimFactor { label = "Ground link use", value = f[1] * 100f });
            r.factors.Add(new SimFactor { label = "Power margin", value = f[2] * 100f });
            r.factors.Add(new SimFactor { label = "Pointing", value = f[3] * 100f });
            Array.Copy(wk, r.images, Weeks);
            r.outcome = fatal != null ? "Satellite lost" : delivered < minImages ? "Too few images" : "Success";
            r.success = r.outcome == "Success";
            Explain(r);
            Report = r;
            if (fatal != null) Say(week, fatal, "alert");
            else Say(week, $"Year complete: {delivered} of {Weeks} images delivered", r.success ? "good" : "alert");
        }

        int Count(string cause) => causes.TryGetValue(cause, out var n) ? n : 0;

        void Explain(SimReport r)
        {
            var lines = new List<string>();
            foreach (var c in causes.OrderByDescending(c => c.Value)) lines.Add($"{c.Value} {c.Key}");
            r.lostBecause = lines.Count == 0 ? "No images were lost." : "Lost images: " + string.Join(", ", lines) + ".";

            // Each entry: how many images it cost, what it says, and the one change to try next.
            var items = new List<(int weight, string text, string tip)>();
            if (Fatal != null)
                items.Add((1000, Fatal, launchFailed ? "Open the design again: the checks list what blocks the launch." : FatalTip()));
            int low = Count(Power);
            if (low > 0)
                items.Add((low, Inv($"Your power system ({capWh:0.#} Wh battery, {genW:0.#} W from the panels) could not keep up, so {low} images were skipped for low power."), BiggerBattery()));
            int hot = Count(Hot);
            if (hot > 0)
                items.Add((hot, Inv($"The camera bay passed {s.maxCameraTempC.value:0} C after the solar storm and {hot} images were spoiled."), "When a solar storm alert shows, pause the camera at once: it cools the camera and stops the battery drain."));
            int point = Count(Pointing);
            if (point > 0)
                items.Add((point, Inv($"Your {attitude?.name?.ToLowerInvariant() ?? "attitude control"} let the pointing drift past the {tol:0.#} degree limit, so {point} images missed the region."), BetterAttitude()));
            int full = Count(Full);
            if (full > 0)
                items.Add((full, Inv($"Your storage holds only {queueCap} images, so {full} were thrown away while the ground link was down or too slow."), BiggerStorage()));
            int backlog = queue.Count;
            if (backlog > 0 && passMb < imageMb)
                items.Add((backlog, Inv($"Your link is too slow: {backlog} images were still on board at the end. Each pass carries {passMb:0.#} MB and one image is {imageMb:0.#} MB."), FasterLink()));
            if (outageWeeksTotal > 0)
                items.Add((outageWeeksTotal, $"The ground station was offline for {outageWeeksTotal} week{(outageWeeksTotal == 1 ? "" : "s")}, and no image can be delivered without a pass.",
                    backup == null || backup.weeksSaved.value <= 0f ? "Add a backup station: it shortens an outage and makes one less likely." : "Use the backup station command as soon as the alert shows."));
            int given = Count(Paused) + Count(Safe);
            if (given > 0)
                items.Add((given, $"{given} images were given up on purpose by the commands you used.", "Answer a problem with the cheapest command that fixes it: pausing the camera costs one image, safe mode costs two."));
            int none = Count(NoCamera);
            if (none > 0) items.Add((none, "The satellite has no camera, so it could not take any image.", "Choose an instrument."));
            if (captureEvery > 1)
                items.Add((Weeks - Weeks / captureEvery, $"You chose to photograph every {captureEvery} weeks, so at most {Weeks / captureEvery} images were possible.", "Choose the weekly schedule."));

            var top = items.OrderByDescending(i => i.weight).Take(3).ToList();
            foreach (var t in top) r.decisions.Add(t.text);
            if (top.Count == 0) r.decisions.Add("Every part of your design held up: nothing cost you an image.");
            r.suggestion = top.Count > 0 ? top[0].tip : "Your design works. Try to get the same result with a lower cost or a bigger reserve.";
        }

        string FatalTip() =>
            Fatal.StartsWith("The battery") ? BiggerBattery()
            : Fatal.StartsWith("No contact") ? "Check that the radio's band is one your ground station can listen on, and add a backup station."
            : "Choose an orbit that lasts the whole year.";

        string BiggerBattery()
        {
            var next = cat.power.Where(p => p.batteryWh.value > capWh).OrderBy(p => p.batteryWh.value).FirstOrDefault();
            return next != null ? Inv($"Try {next.name}: its battery holds {next.batteryWh.value:0.#} Wh instead of {capWh:0.#} Wh.") : "Switch off what you do not need, or choose panels that make more power.";
        }

        string BetterAttitude()
        {
            var next = cat.earthWatch.attitudes.Where(a => a.basePointingDeg.value < basePointing).OrderByDescending(a => a.basePointingDeg.value).FirstOrDefault();
            return next != null ? $"Try {next.name}: it points better and faults less often." : "Recalibrate as soon as an attitude alert shows.";
        }

        string BiggerStorage()
        {
            var next = cat.earthWatch.storages.Where(x => x.capacityImages.value > queueCap).OrderBy(x => x.capacityImages.value).FirstOrDefault();
            return next != null ? Inv($"Try {next.name}: it holds {next.capacityImages.value:0} images instead of {queueCap}.") : "Prioritize the downlink as soon as contact returns.";
        }

        string FasterLink()
        {
            var next = cat.radios.Where(x => x.rateKbps.value > (radio?.rateKbps.value ?? 0f)).OrderBy(x => x.rateKbps.value).FirstOrDefault();
            return next != null ? $"Try the {next.name}, which sends data much faster, or a ground station network with more contact time." : "Add ground stations for more contact time.";
        }

        // ---- Small helpers ----

        void Lose(int w, string cause)
        {
            wk[w - 1] = "lost"; lost++;
            causes[cause] = Count(cause) + 1;
            Say(week, $"Image {w:00} lost: {cause}", "alert");
        }

        void Raise(string code, string title, string kind) { alert = new SimAlert { code = code, title = title }; alertKind = kind; }

        void Clear(string kind, string message)
        {
            if (alertKind == kind) { alert = null; alertKind = null; }
            if (message != null) Say(week, message, "good");
        }

        void Say(int w, string text, string kind) => log.Add(new SimLogEntry { week = w, text = text, kind = kind });

        static string Inv(FormattableString f) => f.ToString(CultureInfo.InvariantCulture);
    }
}
