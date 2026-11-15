using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace SpaceApps.Mission
{
    /// <summary>
    /// Everything the page can ask for, in plain C#: the design, its checks, the steps, the requirements, the
    /// attempts, and the flight. Unity is the only source of truth; the Bridge turns this into messages.
    /// </summary>
    public class EarthWatchSession
    {
        public static readonly string[] Steps = { "goals", "concept", "requirements", "design", "build", "fly" };

        static readonly Dictionary<string, string> StepOfGroup = new Dictionary<string, string>
        {
            { "region", "goals" }, { "orbit", "concept" }, { "revisit", "concept" },
            { "format", "design" }, { "power", "design" }, { "attitude", "design" }, { "storage", "design" }, { "instrument", "design" },
            { "radio", "design" }, { "groundStation", "design" }, { "backupStation", "design" }, { "launch", "design" },
            { "tests", "build" },
        };

        // A design with one of these cannot leave the ground: the flight ends at launch and the report says why.
        static readonly HashSet<string> LaunchBlockers = new HashSet<string>
        {
            "incomplete-design", "incomplete-earth-watch", "mass-over-format", "mass-over-launcher", "volume-over-format",
            "power-needs-bigger-format", "launcher-orbit", "launcher-dispenser",
        };

        /// <summary>Seconds a problem stays on screen waiting for a command before the flight goes on.</summary>
        public const float DecisionSeconds = 8f;
        const float DetailInterval = 1f, FastInterval = 0.05f;

        readonly MissionCatalog baseCatalog;
        readonly HashSet<string> done = new HashSet<string>();
        float stepTimer, holdTimer;

        /// <summary>The catalog this session edits (requirements change copies of its numbers, never the shared one).</summary>
        public MissionCatalog Catalog { get; }
        public EarthWatchDesign Design { get; private set; } = new EarthWatchDesign();
        public List<AttemptInfo> Attempts { get; } = new List<AttemptInfo>();
        public EarthWatchSim Sim { get; private set; }
        /// <summary>paused, detail or fast.</summary>
        public string Speed { get; private set; } = "paused";
        /// <summary>First seed; each attempt adds its number, so the same session replays the same flights.</summary>
        public int SeedBase { get; set; } = 1;
        /// <summary>Raised after anything the page should hear about: a choice, a requirement, a step, an attempt.</summary>
        public event Action StateChanged;

        public bool Flying => Sim != null && !Sim.Finished;

        public EarthWatchSession(MissionCatalog catalog)
        {
            baseCatalog = catalog;
            Catalog = catalog.Copy();
            Catalog.objectives = Catalog.objectives.Append(Catalog.earthWatch.objective).ToArray();
            ApplyRequirements();
        }

        void Touch() => StateChanged?.Invoke();

        // ---- Choices ----

        /// <summary>Picks an option of a single-choice group. Unknown group or id: ignored, returns false.</summary>
        public bool Choose(string group, string id)
        {
            if (group == EarthWatchDesign.TestsGroup) return Toggle(group, id);
            var options = GroupInfoFor(group)?.options;
            if (options == null || id != null && options.All(o => o.id != id)) return false;
            Design.Set(group, id);
            Touch();
            return true;
        }

        /// <summary>Adds or removes an option of a multi-choice group (tests). A single-choice group just takes the id.</summary>
        public bool Toggle(string group, string id)
        {
            if (group != EarthWatchDesign.TestsGroup) return Choose(group, id);
            if (MissionCatalog.Find(Catalog.tests, id) == null) return false;
            if (!Design.tests.Remove(id)) Design.tests.Add(id);
            Touch();
            return true;
        }

        // ---- Requirements ----

        /// <summary>Sets a requirement, clamped to its min and max. Returns false for an unknown id.</summary>
        public bool SetRequirement(string id, float value)
        {
            var r = Catalog.earthWatch.requirements.FirstOrDefault(x => x.id == id);
            if (r == null || float.IsNaN(value)) return false;
            r.value.value = Math.Min(r.max, Math.Max(r.min, value));
            ApplyRequirements();
            Touch();
            return true;
        }

        /// <summary>Budget kept in reserve, as a fraction from 0 to 1.</summary>
        public bool SetReserve(float fraction) => SetRequirement("reservePercent", fraction * 100f);

        public float Requirement(string id) => Catalog.earthWatch.requirements.First(x => x.id == id).value.value;

        // Pushes the requirement values into the numbers the checks and the simulation read.
        void ApplyRequirements()
        {
            var objective = MissionCatalog.Find(Catalog.objectives, EarthWatchDesign.ObjectiveId);
            foreach (var r in Catalog.earthWatch.requirements)
            {
                float v = r.value.value;
                switch (r.id)
                {
                    case "deadlineMonths": objective.deadlineMonths.value = v; break;
                    case "budgetUsd": objective.budgetUsd.value = v; break;
                    case "reservePercent": Catalog.constants.reserveFraction.value = v / 100f; break;
                    case "minImages": Catalog.earthWatch.sim.minImages.value = v; break;
                    case "pointingToleranceDeg": Catalog.earthWatch.sim.pointingToleranceDeg.value = v; break;
                    case "massLimitKg":
                        foreach (var f in Catalog.formats)
                            f.maxMassKg.value = Math.Min(MissionCatalog.Find(baseCatalog.formats, f.id).maxMassKg.value, v);
                        break;
                }
            }
        }

        // ---- Steps ----

        public string StatusOf(string step)
        {
            int i = Array.IndexOf(Steps, step);
            if (i < 0) return null;
            if (done.Contains(step))
            {
                if (step == "fly") return Attempts.Count > 0 && Attempts.Last().outcome == "Success" ? "done" : "problem";
                return Issues().Any(x => x.step == step && x.severity == "blocking") ? "problem" : "done";
            }
            return Steps.Take(i).All(done.Contains) ? "open" : "locked";
        }

        /// <summary>Marks a step finished. A locked step cannot be completed; returns false then.</summary>
        public bool CompleteStep(string step)
        {
            var status = StatusOf(step);
            if (status == null || status == "locked") return false;
            done.Add(step);
            Touch();
            return true;
        }

        // ---- Checks ----

        public MissionReport Evaluate() => MissionEvaluator.Evaluate(Catalog, Design.ToMissionDesign(), Design.Extras(Catalog));

        /// <summary>Every issue with the design today, with the step that can fix it. Nothing here blocks the player.</summary>
        public List<IssueInfo> Issues() => Issues(Evaluate());

        List<IssueInfo> Issues(MissionReport report)
        {
            var list = report.issues.Select(i => new IssueInfo
            {
                code = i.code, severity = i.severity == Severity.Blocking ? "blocking" : "warning",
                resource = ResourceName(i.resource), step = StepOfIssue(i.code), message = i.message,
            }).ToList();
            list.AddRange(EarthWatchIssues());
            return list;
        }

        static string ResourceName(ResourceKind k) => k.ToString().ToLowerInvariant();

        static string StepOfIssue(string code)
        {
            switch (code)
            {
                case "orbit-lifetime": case "orbit-objective": case "images-target": return "concept";
                case "missing-test": case "schedule-overrun": return "build";
                default: return "design";
            }
        }

        static IssueInfo Issue(string code, string severity, ResourceKind resource, string message) =>
            new IssueInfo { code = code, severity = severity, resource = ResourceName(resource), step = StepOfIssue(code), message = message };

        // Checks the generic evaluator cannot make: the parts and rules that only Earth Watch has.
        IEnumerable<IssueInfo> EarthWatchIssues()
        {
            var ew = Catalog.earthWatch;
            var sim = ew.sim;
            var missing = new[] { "region", "revisit", "attitude", "storage", "backupStation" }.Where(g => Design.Get(g) == null).Select(GroupName).ToList();
            if (missing.Count > 0)
                yield return Issue("incomplete-earth-watch", "blocking", ResourceKind.Time, Inv($"Still to choose: {string.Join(", ", missing)}."));

            var revisit = MissionCatalog.Find(ew.revisits, Design.revisit);
            float minImages = sim.minImages.value;
            if (revisit != null)
            {
                int most = EarthWatchSim.Weeks / (int)revisit.captureEveryWeeks.value;
                if (most < minImages)
                    yield return Issue("images-target", "blocking", ResourceKind.Data,
                        Inv($"Visiting the region every {revisit.captureEveryWeeks.value:0} weeks gives at most {most} images a year, but the mission needs {minImages:0}."));
            }

            var att = MissionCatalog.Find(ew.attitudes, Design.attitude);
            if (att != null && att.basePointingDeg.value > sim.pointingToleranceDeg.value)
                yield return Issue("pointing-accuracy", "blocking", ResourceKind.Data,
                    Inv($"The {att.name} holds the pointing to {att.basePointingDeg.value:0.##} degrees at best, but the requirement is {sim.pointingToleranceDeg.value:0.##} degrees, so the images would miss the region."));

            var station = MissionCatalog.Find(Catalog.groundStations, Design.groundStation);
            var backup = MissionCatalog.Find(ew.backupStations, Design.backupStation);
            var storage = MissionCatalog.Find(ew.storages, Design.storage);
            if (station != null && storage != null)
            {
                int weeks = Math.Max(1, (int)(station.outageWeeks.value - (backup?.weeksSaved.value ?? 0f)));
                if (storage.capacityImages.value < weeks)
                    yield return Issue("storage-small", "warning", ResourceKind.Data,
                        Inv($"If the {station.name} goes offline for {weeks} weeks, the storage ({storage.capacityImages.value:0} images) fills up and images are thrown away."));
            }

            var radio = MissionCatalog.Find(Catalog.radios, Design.radio);
            var orbit = MissionCatalog.Find(Catalog.orbits, Design.orbit);
            var camera = MissionCatalog.Find(Catalog.instruments, Design.instrument);
            if (radio != null && station != null && orbit != null && camera != null && station.bands.Contains(radio.band))
            {
                float passMb = radio.rateKbps * orbit.contactMinutesPerDay * station.stationCount * 60f / 8f / 1000f;
                if (passMb < camera.imageMb.value)
                    yield return Issue("link-slow", "warning", ResourceKind.Communications,
                        Inv($"One ground pass carries {passMb:0.#} MB but one image is {camera.imageMb.value:0.#} MB, so images pile up on board."));
            }
        }

        public List<ResourceInfo> Resources(MissionReport report)
        {
            bool Has(params string[] g) => g.All(x => Design.Get(x) != null);
            return report.resources.Select(r => new ResourceInfo
            {
                kind = ResourceName(r.kind), unit = r.unit, used = r.used, available = r.available,
                known = r.kind == ResourceKind.Mass ? Has("format")
                      : r.kind == ResourceKind.Power ? Has("power", "orbit")
                      : r.kind == ResourceKind.Data || r.kind == ResourceKind.Communications ? Has("radio", "groundStation")
                      : true,
            }).ToList();
        }

        // ---- The state the page draws ----

        public MissionState BuildState()
        {
            var report = Evaluate();
            var ew = Catalog.earthWatch;
            var state = new MissionState
            {
                mission = ew.mission, design = Design.Clone(), groups = Groups(),
                issues = Issues(report), resources = Resources(report),
                attempts = Attempts.Select(a => new AttemptInfo
                {
                    number = a.number, successRate = a.successRate, imagesDelivered = a.imagesDelivered, outcome = a.outcome,
                    seed = a.seed, design = a.design, requirements = a.requirements, issueCodes = a.issueCodes,
                }).ToList(),
            };
            state.worlds = WorldsData.Worlds();
            state.missions = WorldsData.Missions(ew.mission);
            state.reserve = Requirement("reservePercent") / 100f;
            state.steps = Steps.Select(s => new StepState { step = s, status = StatusOf(s) }).ToList();
            state.requirements = ew.requirements.Select(r => new RequirementInfo
            {
                id = r.id, label = r.label, unit = r.unit, check = r.check, value = r.value.value, min = r.min, max = r.max,
                verified = Verified(r.id, state.issues),
            }).ToList();
            return state;
        }

        // ---- Verification (step 5) ----

        // The tests that verify a requirement. The game had no such relation before; this is the smallest one: the images
        // by the day in the life test and the thermal vacuum bakeout, the deadline by the vibration test, the pointing by
        // the flatsat (all the electronics, attitude control included, run on a table). A requirement is verified when all
        // its tests are chosen and the design check that guards it finds no problem.
        static readonly Dictionary<string, (string[] tests, string[] problems)> TestVerified = new Dictionary<string, (string[], string[])>
        {
            { "minImages", (new[] { "ditl", "bakeout" }, new[] { "images-target" }) },
            { "deadlineMonths", (new[] { "vibration" }, new[] { "schedule-overrun" }) },
            { "pointingToleranceDeg", (new[] { "flatsat" }, new[] { "pointing-accuracy" }) },
        };

        // Requirements no test can verify are checked by the design itself, once the design is complete enough to check.
        static readonly Dictionary<string, string[]> CheckVerified = new Dictionary<string, string[]>
        {
            { "massLimitKg", new[] { "mass-over-format", "mass-over-launcher" } },
            { "budgetUsd", new[] { "over-budget" } },
            { "reservePercent", new[] { "over-budget", "no-reserve" } },
        };

        bool? Verified(string requirement, List<IssueInfo> issues)
        {
            bool Has(string[] codes) => issues.Any(i => codes.Contains(i.code));
            if (TestVerified.TryGetValue(requirement, out var rule))
                return rule.tests.All(Design.tests.Contains) && !Has(rule.problems);
            if (CheckVerified.TryGetValue(requirement, out var codes))
                return Has(new[] { "incomplete-design", "incomplete-earth-watch" }) ? (bool?)null : !Has(codes);
            return null;
        }

        // ---- Flight ----

        /// <summary>launch, pause, resume, fast or retry. Returns the frame to show, or null when nothing changed.</summary>
        public SimFrame Fly(string action)
        {
            switch (action)
            {
                case "launch":
                case "retry":
                    if (action == "launch" && Flying) return null;
                    if (StatusOf("fly") == "locked") return null;
                    if (Flying) RecordAttempt(null);
                    StartFlight();
                    return Frame();
                case "pause": if (!Flying) return null; Speed = "paused"; return Frame();
                case "resume": if (!Flying) return null; Speed = "detail"; return Frame();
                case "fast": if (!Flying) return null; Speed = "fast"; return Frame();
                default: return null;
            }
        }

        void StartFlight()
        {
            var report = Evaluate();
            var blocker = Issues(report).FirstOrDefault(i => LaunchBlockers.Contains(i.code) && i.severity == "blocking");
            int seed = SeedBase + Attempts.Count;
            Sim = new EarthWatchSim(Catalog, Design.Clone(), seed, launchFailure: blocker?.message);
            Speed = "detail"; stepTimer = 0f; holdTimer = 0f;
            if (Sim.Finished) Finalize(Sim.Snapshot());
        }

        /// <summary>Runs time forward: one step per second in detail, many in fast, and a problem holds the flight
        /// for <see cref="DecisionSeconds"/> so the player can answer it. Returns the new frame when a step happened.</summary>
        public SimFrame Advance(float dt)
        {
            if (!Flying || Speed == "paused") return null;
            stepTimer += dt;
            if (Sim.AwaitingDecision)
            {
                if (Speed == "fast") Speed = "detail";
                holdTimer += dt;
                if (holdTimer < DecisionSeconds) return null;
            }
            if (stepTimer < (Speed == "fast" ? FastInterval : DetailInterval)) return null;
            return StepOnce();
        }

        /// <summary>Advances exactly one simulated step, whatever the speed. Returns null when no flight is running.</summary>
        public SimFrame StepOnce()
        {
            if (!Flying) return null;
            stepTimer = 0f; holdTimer = 0f;
            var frame = Sim.Step();
            if (Sim.AwaitingDecision && Speed == "fast") Speed = "detail"; // fast forward stops for a problem
            frame.speed = Speed;
            if (Sim.Finished) frame = Finalize(frame);
            return frame;
        }

        /// <summary>A flight command: pauseCamera, safeMode, prioritizeDownlink, useBackupStation or recalibrate.</summary>
        public SimFrame Command(string name)
        {
            if (!Flying || !Sim.Command(name)) return null;
            holdTimer = 0f;
            return Sim.Finished ? Finalize(Frame()) : Frame();
        }

        public SimFrame Frame()
        {
            if (Sim == null) return null;
            var f = Sim.Snapshot();
            f.speed = Speed;
            return f;
        }

        // The run is over: apply the requirement checks to the report, record the attempt, finish the step.
        SimFrame Finalize(SimFrame frame)
        {
            Speed = "paused";
            var report = Sim.Report;
            var blocking = Issues().Where(i => i.severity == "blocking").ToList();
            if (report.success && blocking.Count > 0)
            {
                report.success = false;
                report.outcome = "Requirements not met";
                report.decisions.Insert(0, blocking[0].message);
                if (report.decisions.Count > 3) report.decisions.RemoveAt(3);
                report.suggestion = "Open the step that shows the problem and fix it, then fly again.";
            }
            RecordAttempt(report);
            done.Add("fly");
            frame.report = report; frame.speed = "paused";
            Touch();
            return frame;
        }

        void RecordAttempt(SimReport report)
        {
            Attempts.Add(new AttemptInfo
            {
                number = Attempts.Count + 1,
                successRate = report?.successRate ?? Sim.Snapshot().projectedSuccess,
                imagesDelivered = Sim.ImagesDelivered,
                outcome = report?.outcome ?? "Abandoned",
                seed = SeedBase + Attempts.Count,
                design = Design.Clone(),
                requirements = Catalog.earthWatch.requirements.Select(r => new RequirementValue { id = r.id, value = r.value.value }).ToList(),
                issueCodes = Issues().Select(i => i.code).ToList(),
            });
        }

        // ---- Decision groups ----

        GroupInfo GroupInfoFor(string group) => Groups().FirstOrDefault(g => g.group == group);

        public List<GroupInfo> Groups()
        {
            var c = Catalog;
            var ew = c.earthWatch;
            var groups = new List<GroupInfo>();
            GroupInfo G(string name, bool multi = false) { var g = new GroupInfo { group = name, step = StepOfGroup[name], multi = multi }; groups.Add(g); return g; }

            var region = G("region");
            foreach (var r in ew.regions)
                region.options.Add(new OptionInfo { id = r.id, name = r.name, summary = r.summary, source = Team("A story choice: the three regions use the same numbers.") });
            var orbit = G("orbit");
            foreach (var o in c.orbits)
                orbit.options.Add(Opt(o.id, o.name, o.summary,
                    St("Altitude", o.altitudeKm, "km"), St("Sunlit", o.sunlitFraction, "%", 100f), St("Contact per day", o.contactMinutesPerDay, "min"), St("Lifetime", o.lifetimeMonths, "months")));
            var revisit = G("revisit");
            foreach (var r in ew.revisits)
                revisit.options.Add(Opt(r.id, r.name, r.summary, St("Every", r.captureEveryWeeks, "weeks"),
                    new StatInfo { label = "Images a year", value = EarthWatchSim.Weeks / r.captureEveryWeeks.value, unit = "images", origin = r.captureEveryWeeks }));
            var format = G("format");
            foreach (var f in c.formats.Where(x => x.id == "3u"))
                format.options.Add(Opt(f.id, f.name, "Three 10 cm cubes stacked: 10 x 10 x 34 cm.", St("Size", f.units, "U"), St("Mass limit", f.maxMassKg, "kg"), St("Cost", f.costUsd, "USD")));
            var power = G("power");
            foreach (var p in c.power)
                power.options.Add(Opt(p.id, p.name, Inv($"{p.panelW.value:0.#} W of panels and {p.batteryWh.value:0.#} Wh of battery."),
                    St("Panels", p.panelW, "W"), St("Battery", p.batteryWh, "Wh"), St("Mass", p.massKg, "kg"), St("Cost", p.costUsd, "USD")));
            // No odds on the cards (fault, outage and reliability chances stay hidden): the player learns them by flying.
            var attitude = G("attitude");
            foreach (var a in ew.attitudes)
                attitude.options.Add(Opt(a.id, a.name, a.summary,
                    St("Pointing", a.basePointingDeg, "deg"), St("Power", a.powerW, "W"), St("Cost", a.costUsd, "USD")));
            var storage = G("storage");
            foreach (var s in ew.storages)
                storage.options.Add(Opt(s.id, s.name, s.summary, St("Holds", s.capacityImages, "images"), St("Cost", s.costUsd, "USD")));
            var instrument = G("instrument");
            foreach (var i in c.instruments.Where(x => x.isImager))
                instrument.options.Add(Opt(i.id, i.name, Inv($"Takes images of {i.imageMb.value:0.#} MB and draws {i.powerW.value:0.#} W."),
                    St("Image size", i.imageMb, "MB"), St("Power", i.powerW, "W"), St("Mass", i.massKg, "kg"), St("Cost", i.costUsd, "USD")));
            var radio = G("radio");
            foreach (var r in c.radios)
                radio.options.Add(Opt(r.id, r.name, Inv($"Sends {r.rateKbps.value:0.#} kbps on the {BandName(r.band)}."),
                    St("Rate", r.rateKbps, "kbps"), St("Power", r.txPowerW, "W"), St("Cost", r.costUsd, "USD")));
            var station = G("groundStation");
            foreach (var s in c.groundStations)
                station.options.Add(Opt(s.id, s.name, Inv($"{s.stationCount.value:0} {(s.stationCount.value == 1 ? "antenna" : "antennas")}, listens on {string.Join(" and ", s.bands.Select(b => "the " + BandName(b)))}."),
                    St("Antennas", s.stationCount, ""), St("Cost", s.costUsd, "USD"), St("Setup", s.months, "months")));
            var backup = G("backupStation");
            foreach (var b in ew.backupStations)
                backup.options.Add(Opt(b.id, b.name, b.summary, St("Outage shortened by", b.weeksSaved, "weeks"), St("Cost", b.costUsd, "USD")));
            var launch = G("launch");
            foreach (var l in c.launches)
                launch.options.Add(Opt(l.id, l.name, l.summary,
                    St("Price per U", l.pricePerUnitUsd, "USD"), St("Mass limit", l.maxMassKg, "kg"), St("Wait", l.waitMonths, "months")));
            var tests = G("tests", true);
            foreach (var t in c.tests)
                tests.options.Add(Opt(t.id, t.name, t.summary,
                    St("Cost", t.costUsd, "USD"), St("Time", t.months, "months")));
            return groups;
        }

        static SourceInfo Team(string text) => new SourceInfo { status = "team", text = text };

        // The group names as the page shows them, for the messages that list them.
        static string GroupName(string group)
        {
            switch (group)
            {
                case "region": return "region to watch";
                case "revisit": return "how often to see the region";
                case "attitude": return "attitude control";
                case "storage": return "image storage";
                case "backupStation": return "backup station";
                default: return group;
            }
        }

        static string BandName(string band) =>
            band.StartsWith("uhf-", StringComparison.Ordinal) ? $"UHF {band.Substring(4)} MHz band" : band == "s-band" ? "S-band" : band;

        // "1 months" reads wrong: the unit loses its s when the value is exactly one.
        static StatInfo St(string label, Num n, string unit, float scale = 1f)
        {
            float v = n.value * scale;
            if (v == 1f && (unit == "months" || unit == "weeks" || unit == "images")) unit = unit.Substring(0, unit.Length - 1);
            return new StatInfo { label = label, value = v, unit = unit, origin = n };
        }

        static OptionInfo Opt(string id, string name, string summary, params StatInfo[] stats)
        {
            var nums = stats.Select(s => s.origin).Where(n => n != null).ToList();
            var pick = nums.FirstOrDefault(n => n.status == "nasa-verified") ?? nums.FirstOrDefault(n => n.status == "derived") ?? nums.FirstOrDefault();
            return new OptionInfo
            {
                id = id, name = name, summary = summary, stats = stats.ToList(),
                source = pick == null ? Team("A rule of the game.") : new SourceInfo { status = SourceStatus(pick.status), text = pick.source },
            };
        }

        static string SourceStatus(string status) => status == "nasa-verified" ? "nasa" : status == "derived" ? "derived" : "team";

        static string Inv(FormattableString s) => s.ToString(CultureInfo.InvariantCulture);
    }
}
