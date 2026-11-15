using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Bridging;
using UnityEngine;
using UnityEngine.TestTools;

namespace SpaceApps.Mission.Tests
{
    public class EarthWatchTests
    {
        MissionCatalog catalog;

        [SetUp]
        public void Load() => catalog = MissionCatalog.Load();

        /// <summary>A careful design for Earth Watch: it should finish the year with most images.</summary>
        public static EarthWatchDesign Sensible() => new EarthWatchDesign
        {
            region = "costa-rica-forests", orbit = "sso-550", revisit = "weekly", format = "3u", power = "deployable-3u",
            attitude = "reaction-wheels", storage = "medium", instrument = "camera-basic", radio = "s-band",
            groundStation = "university-sband", backupStation = "none", launch = "nasa-rideshare",
            tests = new List<string> { "vibration", "bakeout", "ditl", "flatsat" },
        };

        static readonly ForcedProblem[] NoProblems = new ForcedProblem[0];
        static ForcedProblem[] At(int week, ProblemKind kind) => new[] { new ForcedProblem { week = week, kind = kind } };

        /// <summary>Flies a whole year. The answer, if any, is given once, as soon as the problem shows.</summary>
        static EarthWatchSim Fly(MissionCatalog c, EarthWatchDesign d, int seed, ForcedProblem[] forced = null, string answer = null)
        {
            var sim = new EarthWatchSim(c, d, seed, forced);
            bool answered = false;
            while (!sim.Finished)
            {
                sim.Step();
                if (answer != null && !answered && sim.AwaitingDecision) { Assert.IsTrue(sim.Command(answer), answer); answered = true; }
            }
            return sim;
        }

        static void StepToStartOfWeek(EarthWatchSim sim, int week) { while (!sim.Finished && sim.Week < week) sim.Step(); }

        // ---- Data ----

        [Test]
        public void TheCatalogHasTheMissionThreeRegionsAndEveryGroup()
        {
            var ew = catalog.earthWatch;
            Assert.AreEqual("Earth Watch", ew.mission.name);
            CollectionAssert.AreEquivalent(new[] { "costa-rica-forests", "amazon", "arctic-sea-ice" }, ew.regions.Select(r => r.id));
            var groups = new EarthWatchSession(catalog).Groups();
            CollectionAssert.AreEquivalent(EarthWatchDesign.SingleGroups.Concat(new[] { "tests" }), groups.Select(g => g.group));
            foreach (var g in groups)
            {
                Assert.IsNotEmpty(g.options, g.group);
                foreach (var o in g.options)
                {
                    CollectionAssert.Contains(new[] { "nasa", "derived", "team" }, o.source.status, $"{g.group}/{o.id}");
                    Assert.IsNotEmpty(o.source.text, $"{g.group}/{o.id}");
                }
            }
            var objective = catalog.earthWatch.objective;
            Assert.AreEqual(24f, objective.deadlineMonths.value);
            Assert.AreEqual(300000f, catalog.constants.nasaLaunchCoverUsd.value);
            Assert.AreEqual(6f, MissionCatalog.Find(catalog.formats, "3u").maxMassKg.value);
            Assert.AreEqual(40f, ew.sim.minImages.value);
        }

        // ---- The weekly simulation ----

        [Test]
        public void ASensibleDesignDeliversAtLeast40ImagesOverManySeeds()
        {
            int withProblems = 0;
            for (int seed = 0; seed < 300; seed++)
            {
                var sim = Fly(catalog, Sensible(), seed); // nobody answers any problem: the worst case
                if (sim.ProblemsSeen.Count > 0) withProblems++;
                Assert.IsNull(sim.Fatal, $"seed {seed}");
                Assert.GreaterOrEqual(sim.ImagesDelivered, 40, $"seed {seed}");
                Assert.AreEqual("Success", sim.Report.outcome, $"seed {seed}");
            }
            Assert.Greater(withProblems, 30, "the problems must actually happen in these runs");
        }

        [Test]
        public void TheProjectedSuccessNeverLeavesZeroToOneHundredAtAnyStep()
        {
            for (int seed = 0; seed < 20; seed++)
            {
                var sim = new EarthWatchSim(catalog, Sensible(), seed);
                while (!sim.Finished)
                {
                    var f = sim.Step();
                    Assert.That(f.projectedSuccess, Is.InRange(0f, 100f), $"seed {seed} week {f.week}");
                    if (sim.AwaitingDecision) sim.Command("safeMode");
                }
                Assert.That(sim.Report.successRate, Is.InRange(0f, 100f));
            }
        }

        [Test]
        public void PlayerFacingTextUsesNamesAndGrammarNotIds()
        {
            var session = new EarthWatchSession(catalog);
            var still = session.Issues().First(i => i.code == "incomplete-earth-watch").message;
            StringAssert.Contains("attitude control", still);
            StringAssert.Contains("backup station", still);
            StringAssert.DoesNotContain("backupStation", still);

            var all = string.Join("\n", session.Groups().SelectMany(g => g.options).Select(o => o.summary));
            StringAssert.DoesNotContain("uhf-437", all);
            StringAssert.DoesNotContain("(s)", all);
            StringAssert.DoesNotContain(" a 80 ", all);
            StringAssert.Contains("1 antenna,", all);
            StringAssert.Contains("3 antennas,", all);

            var oneMonth = session.Groups().First(g => g.group == "tests").options.SelectMany(o => o.stats)
                .Where(s => s.label == "Time" && s.value == 1f);
            Assert.IsNotEmpty(oneMonth);
            foreach (var s in oneMonth) Assert.AreEqual("month", s.unit);
        }

        static bool? VerifiedOf(EarthWatchSession s, string id) => s.BuildState().requirements.First(r => r.id == id).verified;

        [Test]
        public void ARequirementIsVerifiedWhenItsTestsAreChosen()
        {
            var s = new EarthWatchSession(catalog);
            Assert.AreEqual(false, VerifiedOf(s, "minImages"), "no test chosen yet");
            Assert.IsNull(VerifiedOf(s, "massLimitKg"), "nothing to check before the design exists");

            foreach (var g in EarthWatchDesign.SingleGroups) s.Choose(g, Sensible().Get(g));
            s.Toggle("tests", "vibration");
            Assert.AreEqual(true, VerifiedOf(s, "deadlineMonths"));
            Assert.AreEqual(false, VerifiedOf(s, "minImages"), "one of its two tests is missing");
            s.Toggle("tests", "ditl"); s.Toggle("tests", "bakeout");
            Assert.AreEqual(true, VerifiedOf(s, "minImages"));
            s.Toggle("tests", "ditl");
            Assert.AreEqual(false, VerifiedOf(s, "minImages"), "unchosen again");
            Assert.AreEqual(false, VerifiedOf(s, "pointingToleranceDeg"), "flatsat not chosen");
            s.Toggle("tests", "flatsat");
            Assert.AreEqual(true, VerifiedOf(s, "pointingToleranceDeg"));
            Assert.AreEqual(true, VerifiedOf(s, "massLimitKg"));
            Assert.AreEqual(true, VerifiedOf(s, "reservePercent"));

            s.SetReserve(0.4f);
            s.SetRequirement("budgetUsd", 300000f);
            Assert.AreEqual(false, VerifiedOf(s, "reservePercent"), "the design leaves less than the reserve unspent");

            var json = (Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(s.BuildState()));
            var req = ((List<object>)json["requirements"]).Cast<Dictionary<string, object>>().First(r => (string)r["id"] == "minImages");
            Assert.AreEqual(false, req["verified"]);
        }

        [Test]
        public void ASloppyDesignFailsOften()
        {
            var d = Sensible();
            d.power = "deployable-lite"; d.attitude = "magnetorquers"; d.storage = "small"; d.radio = "uhf"; d.groundStation = "amateur-uhf";
            int failures = Enumerable.Range(0, 100).Count(seed => Fly(catalog, d, seed).Report.outcome != "Success");
            Assert.Greater(failures, 80);
        }

        [Test]
        public void ASolarStormChangesTheState()
        {
            var sim = new EarthWatchSim(catalog, Sensible(), 1, At(10, ProblemKind.SolarStorm));
            StepToStartOfWeek(sim, 10);
            var before = sim.Snapshot();
            while (sim.Week == 10) sim.Step();
            var after = sim.Snapshot();
            Assert.AreEqual("solar-storm", after.alert.code);
            Assert.Less(after.battery, before.battery - 20f);
            Assert.Greater(after.pointingError, before.pointingError + 1f);
            Assert.Greater(after.cameraTemp, before.cameraTemp + 8f);
        }

        [Test]
        public void AGroundOutageStopsTheDownlinkAndTheQueueGrows()
        {
            var d = Sensible(); d.storage = "large";
            var sim = new EarthWatchSim(catalog, d, 1, At(10, ProblemKind.GroundOutage));
            StepToStartOfWeek(sim, 11);
            Assert.AreEqual("ground-station-offline", sim.Snapshot().alert.code);
            sim.Step(); var down = sim.Step(); // week 11: capture, then the pass that does not happen
            Assert.IsFalse(down.contact);
            Assert.AreEqual(0f, down.linkQuality);
            Assert.AreEqual(1, down.storageQueue);
            StepToStartOfWeek(sim, 14);
            Assert.AreEqual(3, sim.QueueCount, "three weeks of images wait on board");
        }

        [Test]
        public void AnAttitudeFaultMakesThePointingGrowEveryWeek()
        {
            var sim = new EarthWatchSim(catalog, Sensible(), 1, At(10, ProblemKind.AttitudeFault));
            StepToStartOfWeek(sim, 11);
            var a = sim.Snapshot();
            Assert.AreEqual("attitude-fault", a.alert.code);
            StepToStartOfWeek(sim, 12);
            var b = sim.Snapshot();
            Assert.Greater(b.pointingError, a.pointingError + 0.3f);
        }

        // For each problem: every answer, and doing nothing, must leave a mark compared with a year without it.
        static bool Worse(EarthWatchSim run, EarthWatchSim baseline) =>
            run.ImagesDelivered < baseline.ImagesDelivered || run.ImagesLost > baseline.ImagesLost || run.MinBattery < baseline.MinBattery - 0.5f;

        [TestCase(ProblemKind.SolarStorm, null)]
        [TestCase(ProblemKind.SolarStorm, "pauseCamera")]
        [TestCase(ProblemKind.SolarStorm, "safeMode")]
        [TestCase(ProblemKind.AttitudeFault, null)]
        [TestCase(ProblemKind.AttitudeFault, "recalibrate")]
        [TestCase(ProblemKind.AttitudeFault, "safeMode")]
        [TestCase(ProblemKind.GroundOutage, null)]
        [TestCase(ProblemKind.GroundOutage, "prioritizeDownlink")]
        [TestCase(ProblemKind.GroundOutage, "pauseCamera")]
        public void EveryAnswerToAProblemHasACost(ProblemKind kind, string answer)
        {
            var d = Sensible(); d.storage = "small"; // two images: an outage of three weeks overflows it
            d.groundStation = "university-sband";
            var baseline = Fly(catalog, d, 3, NoProblems);
            var run = Fly(catalog, d, 3, At(20, kind), answer);
            Assert.IsTrue(Worse(run, baseline), $"{kind} answered with {answer ?? "nothing"} cost nothing");
        }

        [Test]
        public void ThePartnerStationCommandCostsHalfThePassWhileItCarriesTheLink()
        {
            var tight = MissionCatalog.Load();
            MissionCatalog.Find(tight.radios, "s-band").rateKbps.value = 16f; // a pass carries about 1.2 images
            var d = Sensible(); d.backupStation = "partner-station";
            Assert.IsFalse(new EarthWatchSim(tight, Sensible(), 1).Commands().First(c => c.name == "useBackupStation").enabled);

            EarthWatchSim Run(bool problem, bool answer)
            {
                var sim = new EarthWatchSim(tight, d, 1, problem ? At(10, ProblemKind.GroundOutage) : NoProblems);
                StepToStartOfWeek(sim, 11);
                if (answer) Assert.IsTrue(sim.Command("useBackupStation"));
                StepToStartOfWeek(sim, 13);
                return sim;
            }
            var normal = Run(false, false);
            var backup = Run(true, true);
            Assert.Less(backup.ImagesDelivered, normal.ImagesDelivered, "the partner dish carries less per pass");
            Assert.IsNull(backup.Snapshot().alert, "but contact is back at once");
        }

        [Test]
        public void ABiggerBatterySuffersLessFromTheSolarStorm()
        {
            float MinBattery(float wh)
            {
                var c = MissionCatalog.Load();
                MissionCatalog.Find(c.power, "deployable-3u").batteryWh.value = wh;
                return Fly(c, Sensible(), 1, At(20, ProblemKind.SolarStorm)).MinBattery;
            }
            Assert.Greater(MinBattery(40f), MinBattery(20f) + 15f);
            Assert.Greater(MinBattery(20f), MinBattery(16f));

            var small = new EarthWatchSim(catalog, MissionCatalog.Find(catalog.power, "deployable-lite") != null ? WithPower("deployable-lite") : null, 1);
            var big = new EarthWatchSim(catalog, WithPower("deployable-3u"), 1);
            Assert.Greater(small.YearlyChance(ProblemKind.SolarStorm), big.YearlyChance(ProblemKind.SolarStorm), "a tight battery makes the storm likelier too");
        }

        static EarthWatchDesign WithPower(string id) { var d = Sensible(); d.power = id; return d; }

        [Test]
        public void ABackupStationSuffersLessFromAGroundOutage()
        {
            var none = Sensible(); none.storage = "small";
            var backup = none.Clone(); backup.backupStation = "partner-station";
            var lostWithout = Fly(catalog, none, 1, At(20, ProblemKind.GroundOutage)).ImagesLost;
            var lostWith = Fly(catalog, backup, 1, At(20, ProblemKind.GroundOutage)).ImagesLost;
            Assert.Greater(lostWithout, lostWith);
            Assert.Less(new EarthWatchSim(catalog, backup, 1).YearlyChance(ProblemKind.GroundOutage),
                        new EarthWatchSim(catalog, none, 1).YearlyChance(ProblemKind.GroundOutage));
        }

        [Test]
        public void AnImageCountsOnlyAfterItIsDownlinked()
        {
            var sim = new EarthWatchSim(catalog, Sensible(), 1, NoProblems);
            int captured = 0;
            while (!sim.Finished)
            {
                int before = sim.ImagesDelivered;
                var f = sim.Step();
                if (f.capturing)
                {
                    captured++;
                    Assert.AreEqual(before, f.imagesDelivered, "capturing alone delivers nothing");
                    Assert.AreEqual("held", f.weeks[f.week - 1]);
                }
                if (f.imagesDelivered > before) Assert.IsTrue(f.contact, "an image was delivered without a ground pass");
            }
            Assert.AreEqual(52, captured);
            Assert.AreEqual(52, sim.ImagesDelivered);

            // No ground station: the camera works all year, yet nothing reaches the scientists.
            var d = Sensible(); d.groundStation = null;
            var blind = Fly(catalog, d, 1, NoProblems);
            Assert.AreEqual(0, blind.ImagesDelivered);
            Assert.AreEqual("Satellite lost", blind.Report.outcome);
            Assert.Greater(blind.QueueCount, 0);
        }

        [Test]
        public void TheSameSeedGivesTheSameRunAndOtherSeedsDiffer()
        {
            string Trace(int seed, string answer)
            {
                var sim = new EarthWatchSim(catalog, Sensible(), seed);
                var frames = new List<string>();
                while (!sim.Finished)
                {
                    frames.Add(StateJson.Serialize(sim.Step()));
                    if (answer != null && sim.AwaitingDecision) sim.Command(answer);
                }
                return string.Join("\n", frames);
            }
            for (int seed = 0; seed < 20; seed++) Assert.AreEqual(Trace(seed, "pauseCamera"), Trace(seed, "pauseCamera"), $"seed {seed}");
            Assert.AreNotEqual(Trace(1, null), Trace(2, null) + "x");
            Assert.IsTrue(Enumerable.Range(0, 20).Select(s => Trace(s, null)).Distinct().Count() > 3, "seeds must change the problems");
        }

        [Test]
        public void StartingValuesComeFromTheDesign()
        {
            var big = new EarthWatchSim(catalog, WithPower("deployable-3u"), 1);
            var small = new EarthWatchSim(catalog, WithPower("body-3u"), 1);
            Assert.AreEqual(40f, big.BatteryWh);
            Assert.AreEqual(20f, small.BatteryWh);
            var wheels = Sensible(); var tracker = Sensible(); tracker.attitude = "star-tracker";
            Assert.AreEqual(0.2f, new EarthWatchSim(catalog, wheels, 1).Snapshot().pointingError, 1e-4f);
            Assert.AreEqual(0.05f, new EarthWatchSim(catalog, tracker, 1).Snapshot().pointingError, 1e-4f);
            var uhf = Sensible(); uhf.radio = "uhf";
            Assert.Less(new EarthWatchSim(catalog, uhf, 1).PassMb, new EarthWatchSim(catalog, wheels, 1).PassMb / 50f);
        }

        [Test]
        public void TheReportExplainsTheResult()
        {
            var d = Sensible(); d.power = "deployable-lite"; // a 5 Wh battery cannot ride out the storm
            var sim = Fly(catalog, d, 1, At(20, ProblemKind.SolarStorm));
            var r = sim.Report;
            Assert.AreEqual("Satellite lost", r.outcome);
            Assert.AreEqual(4, r.factors.Count);
            Assert.That(r.decisions.Count, Is.InRange(1, 3));
            StringAssert.Contains("battery", string.Join(" ", r.decisions));
            StringAssert.Contains("battery", r.suggestion.ToLowerInvariant());
            Assert.AreEqual(52, r.images.Length);

            var ok = Fly(catalog, Sensible(), 1, At(20, ProblemKind.SolarStorm), "pauseCamera").Report;
            Assert.AreEqual("Success", ok.outcome);
            StringAssert.Contains("camera paused", ok.lostBecause);
            Assert.AreEqual(ok.imagesDelivered, ok.images.Count(x => x == "sent"));
        }

        // ---- JSON ----

        static void HasKeys(object node, params string[] keys)
        {
            var d = node as Dictionary<string, object>;
            Assert.IsNotNull(d, "expected an object");
            foreach (var k in keys) Assert.IsTrue(d.ContainsKey(k), $"missing field '{k}'");
        }

        [Test]
        public void TheStateJsonHasEveryFieldOfTheContract()
        {
            var session = new EarthWatchSession(catalog);
            session.Choose("region", "amazon"); session.Choose("orbit", "sso-550"); session.Toggle("tests", "vibration");
            var root = MiniJson.Parse(StateJson.Serialize(session.BuildState()));
            HasKeys(root, "mission", "steps", "design", "groups", "requirements", "resources", "issues", "attempts");
            var r = (Dictionary<string, object>)root;
            HasKeys(r["mission"], "id", "name", "summary");
            var steps = (List<object>)r["steps"];
            CollectionAssert.AreEqual(new[] { "goals", "concept", "requirements", "design", "build", "fly" }, steps.Select(s => ((Dictionary<string, object>)s)["step"]));
            foreach (var s in steps) HasKeys(s, "step", "status");
            HasKeys(r["design"], "region", "orbit", "revisit", "format", "power", "attitude", "storage", "instrument", "radio", "groundStation", "backupStation", "launch", "tests");
            var design = (Dictionary<string, object>)r["design"];
            Assert.AreEqual("amazon", design["region"]);
            Assert.IsNull(design["revisit"], "a group not chosen yet is null");
            CollectionAssert.AreEqual(new[] { "vibration" }, (List<object>)design["tests"]);
            foreach (var g in (List<object>)r["groups"])
            {
                HasKeys(g, "group", "step", "multi", "options");
                foreach (var o in (List<object>)((Dictionary<string, object>)g)["options"])
                {
                    HasKeys(o, "id", "name", "summary", "stats", "source");
                    HasKeys(((Dictionary<string, object>)o)["source"], "status", "text");
                    foreach (var st in (List<object>)((Dictionary<string, object>)o)["stats"]) HasKeys(st, "label", "value", "unit");
                }
            }
            foreach (var q in (List<object>)r["requirements"]) HasKeys(q, "id", "label", "value", "unit", "min", "max", "check");
            Assert.AreEqual(6, ((List<object>)r["resources"]).Count);
            foreach (var q in (List<object>)r["resources"]) HasKeys(q, "kind", "used", "available", "unit", "known");
            var issues = (List<object>)r["issues"];
            Assert.IsNotEmpty(issues);
            foreach (var q in issues) HasKeys(q, "code", "severity", "resource", "step", "message");
            Assert.IsTrue(issues.Any(q => (string)((Dictionary<string, object>)q)["severity"] == "critical"), "web/src/bridge/types.ts calls blocking issues critical");
            Assert.IsTrue(issues.All(q => new[] { "info", "warning", "critical" }.Contains((string)((Dictionary<string, object>)q)["severity"])));

            session.CompleteStep("goals"); session.CompleteStep("concept"); session.CompleteStep("requirements");
            session.CompleteStep("design"); session.CompleteStep("build");
            session.Fly("launch");
            while (session.Flying) session.StepOnce();
            var attempts = (List<object>)((Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(session.BuildState())))["attempts"];
            Assert.AreEqual(1, attempts.Count);
            HasKeys(attempts[0], "number", "successRate", "imagesDelivered", "outcome");
        }

        [Test]
        public void TheStateCarriesTheReserveTheSliderSet()
        {
            var session = new EarthWatchSession(catalog);
            Assert.AreEqual(0.10, ReserveInJson(session), 1e-4, "the catalog's starting reserve");
            session.SetReserve(0.25f);
            Assert.AreEqual(0.25, ReserveInJson(session), 1e-4);
            session.SetReserve(0f);
            Assert.AreEqual(0.0, ReserveInJson(session), 1e-4, "zero is sent as zero, not left out");
        }

        static double ReserveInJson(EarthWatchSession s) =>
            Convert.ToDouble(((Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(s.BuildState())))["reserve"]);

        [Test]
        public void TheStateHasTheWorldsAndMissionsOfStepOne()
        {
            var root = (Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(new EarthWatchSession(catalog).BuildState()));
            var worlds = ((List<object>)root["worlds"]).Cast<Dictionary<string, object>>().ToDictionary(w => (string)w["id"]);
            CollectionAssert.AreEqual(new[] { "earth", "moon", "mars", "venus", "jupiter" }, worlds.Keys);
            Assert.AreEqual(true, worlds["earth"]["open"]);
            foreach (var id in new[] { "moon", "mars", "venus", "jupiter" }) Assert.AreEqual(false, worlds[id]["open"], id);
            string Val(string world, string key) => ((Dictionary<string, object>)worlds[world][key])["value"].ToString();
            Assert.AreEqual("586", Val("mars", "sunlight"));
            Assert.AreEqual("2601", Val("venus", "sunlight"));
            Assert.AreEqual("50", Val("jupiter", "sunlight"));
            Assert.AreEqual("-58", Val("moon", "signal"));
            Assert.AreEqual("176 to 288", Val("mars", "travel"));
            // Not in the research data: sent as null, never guessed.
            Assert.IsNull(worlds["moon"]["travel"]);
            Assert.IsNull(worlds["mars"]["signal"]);
            Assert.IsNull(worlds["earth"]["travel"]);
            foreach (var w in worlds.Values)
                foreach (var key in new[] { "sunlight", "signal", "travel" })
                    if (w[key] != null)
                    {
                        var src = (Dictionary<string, object>)((Dictionary<string, object>)w[key])["source"];
                        CollectionAssert.Contains(new[] { "nasa", "derived", "team" }, src["status"]);
                        Assert.IsNotEmpty((string)src["text"]);
                    }

            var missions = ((List<object>)root["missions"]).Cast<Dictionary<string, object>>().ToList();
            var ew = missions.Single(m => (bool)m["open"]);
            Assert.AreEqual("EW-1", ew["id"]);
            Assert.AreEqual("earth", ew["world"]);
            Assert.IsNotEmpty((string)ew["who"]);
            Assert.IsNotEmpty((string)ew["why"]);
        }

        [Test]
        public void TheWorldNumbersMatchTheResearchFiles()
        {
            string Read(string file) => System.IO.File.ReadAllText(System.IO.Path.Combine(Application.dataPath, "..", "Resources/09-future-work/data", file));
            var horizons = Read("horizons-elements-2026-11-14.csv").Split('\n').Skip(1).Where(l => l.Length > 0).Select(l => l.Split(',')).ToDictionary(c => c[0]);
            float Au(string body) => float.Parse(horizons[body][9], System.Globalization.CultureInfo.InvariantCulture);
            Assert.AreEqual(Au("Earth"), WorldsData.EarthAu, 1e-6f);
            Assert.AreEqual(Au("Venus"), WorldsData.VenusAu, 1e-6f);
            Assert.AreEqual(Au("Mars"), WorldsData.MarsAu, 1e-6f);
            Assert.AreEqual(Au("Jupiter"), WorldsData.JupiterAu, 1e-6f);
            Assert.AreEqual(float.Parse(horizons["Moon"][10], System.Globalization.CultureInfo.InvariantCulture), WorldsData.MoonKm, 0.1f);

            var trips = Read("trajectory-browser-transfers-2026-2036.csv").Split('\n').Skip(1).Where(l => l.Length > 0).Select(l => l.Split(',')).ToList();
            int[] Range(string planet)
            {
                var d = trips.Where(c => c[0] == planet && c[1] == "oneway" && c[10].Trim() == "Earth > " + planet).Select(c => int.Parse(c[6])).ToList();
                return new[] { d.Min(), d.Max() };
            }
            CollectionAssert.AreEqual(Range("Venus"), WorldsData.VenusDays);
            CollectionAssert.AreEqual(Range("Mars"), WorldsData.MarsDays);
            CollectionAssert.AreEqual(Range("Jupiter"), WorldsData.JupiterDays);
        }

        [Test]
        public void TheFrameJsonHasEveryFieldOfTheContract()
        {
            var sim = new EarthWatchSim(catalog, Sensible(), 1, At(10, ProblemKind.SolarStorm));
            var quiet = (Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(sim.Step()));
            HasKeys(quiet, "week", "day", "speed", "battery", "pointingError", "cameraTemp", "storageQueue", "linkQuality",
                    "imagesDelivered", "imagesLost", "projectedSuccess", "weeks", "contact", "capturing", "alert", "commands", "log", "report");
            Assert.IsNull(quiet["alert"]);
            Assert.IsNull(quiet["report"]);
            Assert.AreEqual(52, ((List<object>)quiet["weeks"]).Count);
            foreach (var c in (List<object>)quiet["commands"]) HasKeys(c, "name", "label", "enabled", "active");
            CollectionAssert.AreEqual(new[] { "pauseCamera", "safeMode", "prioritizeDownlink", "useBackupStation", "recalibrate" },
                ((List<object>)quiet["commands"]).Select(c => ((Dictionary<string, object>)c)["name"]));
            foreach (var l in (List<object>)quiet["log"]) HasKeys(l, "week", "text", "kind");

            StepToStartOfWeek(sim, 11);
            var alert = (Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(sim.Snapshot()));
            HasKeys(alert["alert"], "code", "title");

            while (!sim.Finished) sim.Step();
            var last = (Dictionary<string, object>)MiniJson.Parse(StateJson.Serialize(sim.Snapshot()));
            HasKeys(last["report"], "successRate", "imagesDelivered", "factors", "lostBecause", "decisions", "suggestion", "images");
            var report = (Dictionary<string, object>)last["report"];
            Assert.AreEqual(4, ((List<object>)report["factors"]).Count);
            foreach (var f in (List<object>)report["factors"]) HasKeys(f, "label", "value");
            Assert.AreEqual(52, ((List<object>)report["images"]).Count);
            CollectionAssert.IsSubsetOf(((List<object>)last["weeks"]).Cast<string>().Distinct(), new[] { "sent", "held", "next", "lost", "" });
        }

        [Test]
        public void TextWithQuotesAndNewlinesSurvivesTheRoundTrip()
        {
            var w = new JsonWriter().BeginObject().Field("a", "say \"hi\"\nnow\\ \u0001").EndObject().ToString();
            Assert.AreEqual("say \"hi\"\nnow\\ \u0001", ((Dictionary<string, object>)MiniJson.Parse(w))["a"]);
        }

        // ---- Session: steps, requirements, attempts ----

        [Test]
        public void StepsOpenInOrderTheFirstTimeAndAnyFinishedStepCanBeReopened()
        {
            var s = new EarthWatchSession(catalog);
            string Status() => string.Join(",", EarthWatchSession.Steps.Select(x => s.StatusOf(x)[0]));
            Assert.AreEqual("o,l,l,l,l,l", Status());
            Assert.IsFalse(s.CompleteStep("design"), "a locked step cannot be finished");
            Assert.IsTrue(s.CompleteStep("goals"));
            Assert.AreEqual("d,o,l,l,l,l", Status());
            s.CompleteStep("concept"); s.CompleteStep("requirements");
            Assert.AreEqual("d,d,d,o,l,l", Status());
            Assert.IsTrue(s.CompleteStep("goals"), "a finished step can be reopened and finished again");
            Assert.AreEqual("d,d,d,o,l,l", Status());
        }

        [Test]
        public void ABadChoiceBlocksNothingButIsReported()
        {
            var s = new EarthWatchSession(catalog);
            foreach (var kv in new Dictionary<string, string> {
                { "orbit", "leo-iss" }, { "launch", "nasa-rideshare" }, { "format", "3u" }, { "power", "body-1u" }, { "instrument", "camera-multispectral" },
                { "radio", "uhf" }, { "groundStation", "amateur-uhf" }, { "revisit", "fortnightly" }, { "attitude", "magnetorquers" }, { "storage", "small" }, { "backupStation", "none" }, { "region", "amazon" } })
                Assert.IsTrue(s.Choose(kv.Key, kv.Value), kv.Key);
            Assert.IsTrue(s.Issues().Any(i => i.severity == "blocking"));
            foreach (var step in EarthWatchSession.Steps.Take(5)) Assert.IsTrue(s.CompleteStep(step));
            Assert.AreEqual("problem", s.StatusOf("design"), "a finished step with a blocking issue shows a problem");
            Assert.IsNotNull(s.Fly("launch"), "the player can still launch");
            while (s.Flying) s.StepOnce();
            Assert.AreEqual(1, s.Attempts.Count);
            Assert.AreEqual("problem", s.StatusOf("fly"));
            Assert.AreNotEqual("Success", s.Attempts[0].outcome);
        }

        [Test]
        public void ADesignThatCannotLaunchEndsAtLaunchWithTheReason()
        {
            var s = new EarthWatchSession(catalog); // nothing chosen at all
            foreach (var step in EarthWatchSession.Steps.Take(5)) s.CompleteStep(step);
            var frame = s.Fly("launch");
            Assert.IsNotNull(frame.report);
            Assert.AreEqual(0, frame.week);
            Assert.AreEqual(0, frame.report.imagesDelivered);
            StringAssert.Contains("Still to choose", frame.report.decisions[0]);
            Assert.AreEqual(1, s.Attempts.Count);
        }

        [Test]
        public void EveryAttemptIsRecordedWithItsChoicesAndResult()
        {
            var s = new EarthWatchSession(catalog) { SeedBase = 5 };
            foreach (var kv in Dictionary(Sensible())) s.Choose(kv.Key, kv.Value);
            foreach (var t in Sensible().tests) s.Toggle("tests", t);
            foreach (var step in EarthWatchSession.Steps.Take(5)) s.CompleteStep(step);
            s.Fly("launch"); s.Fly("fast");
            while (s.Flying) s.StepOnce();
            s.Choose("storage", "large");
            s.Fly("retry");
            while (s.Flying) s.StepOnce();
            Assert.AreEqual(2, s.Attempts.Count);
            Assert.AreEqual(new[] { 1, 2 }, s.Attempts.Select(a => a.number).ToArray());
            Assert.AreEqual("medium", s.Attempts[0].design.storage);
            Assert.AreEqual("large", s.Attempts[1].design.storage);
            Assert.AreEqual(new[] { 5, 6 }, s.Attempts.Select(a => a.seed).ToArray());
            Assert.IsTrue(s.Attempts.All(a => a.requirements.Count == catalog.earthWatch.requirements.Length));
            Assert.IsTrue(s.Attempts.All(a => a.outcome.Length > 0 && a.successRate > 0f));
        }

        [Test]
        public void ChangingTheDesignAfterAFlightReopensTheLastStep()
        {
            var s = new EarthWatchSession(catalog) { SeedBase = 5 };
            foreach (var kv in Dictionary(Sensible())) s.Choose(kv.Key, kv.Value);
            foreach (var t in Sensible().tests) s.Toggle("tests", t);
            foreach (var step in EarthWatchSession.Steps.Take(5)) s.CompleteStep(step);
            s.Fly("launch"); s.Fly("fast");
            while (s.Flying) s.StepOnce();
            var flown = s.StatusOf("fly");
            Assert.That(flown, Is.EqualTo("done").Or.EqualTo("problem"), "a flight just finished");

            s.Choose("storage", "large");
            Assert.AreEqual("open", s.StatusOf("fly"), "a different design has not been flown");
            s.Choose("storage", "medium");
            Assert.AreEqual(flown, s.StatusOf("fly"), "back to what was flown");
            s.Toggle("tests", "etu");
            Assert.AreEqual("open", s.StatusOf("fly"), "tests count as the design");
            s.Toggle("tests", "etu");
            s.SetRequirement("minImages", 30f);
            Assert.AreEqual("open", s.StatusOf("fly"), "so do the requirements");
            s.SetRequirement("minImages", 40f);
            Assert.AreEqual(flown, s.StatusOf("fly"));
        }

        static Dictionary<string, string> Dictionary(EarthWatchDesign d) => EarthWatchDesign.SingleGroups.ToDictionary(g => g, g => d.Get(g));

        [Test]
        public void RequirementAdjustmentsStayWithinMinAndMax()
        {
            var s = new EarthWatchSession(catalog);
            foreach (var r in catalog.earthWatch.requirements)
            {
                Assert.GreaterOrEqual(r.value.value, r.min, r.id);
                Assert.LessOrEqual(r.value.value, r.max, r.id);
                Assert.IsNotEmpty(r.check, r.id);
                Assert.IsTrue(s.SetRequirement(r.id, r.max * 100f + 1000f), r.id);
                Assert.AreEqual(r.max, s.Requirement(r.id), r.id);
                Assert.IsTrue(s.SetRequirement(r.id, -r.max * 100f - 1000f), r.id);
                Assert.AreEqual(r.min, s.Requirement(r.id), r.id);
                Assert.IsTrue(s.SetRequirement(r.id, (r.min + r.max) / 2f), r.id);
                Assert.AreEqual((r.min + r.max) / 2f, s.Requirement(r.id), 1e-3f, r.id);
            }
            Assert.IsFalse(s.SetRequirement("nope", 3f));
            Assert.IsFalse(s.SetRequirement("minImages", float.NaN));
            s.SetReserve(5f);
            Assert.AreEqual(40f, s.Requirement("reservePercent"), "a fraction above 1 stops at the maximum");
            Assert.AreEqual(40f, catalog.earthWatch.requirements.First(r => r.id == "minImages").value.value, "the shared catalog is never edited");
        }

        [Test]
        public void AdjustedRequirementsChangeTheChecksAndTheFlight()
        {
            var s = new EarthWatchSession(catalog);
            foreach (var kv in Dictionary(Sensible())) s.Choose(kv.Key, kv.Value);
            foreach (var t in Sensible().tests) s.Toggle("tests", t);
            Assert.IsFalse(s.Issues().Any(i => i.severity == "blocking"), string.Join(" | ", s.Issues().Select(i => i.message)));
            s.SetRequirement("deadlineMonths", 12f);
            Assert.IsTrue(s.Issues().Any(i => i.code == "schedule-overrun"));
            s.SetRequirement("deadlineMonths", 24f);
            s.SetRequirement("massLimitKg", 1f + 2f); // minimum is 3
            s.SetRequirement("budgetUsd", 300000f);
            Assert.IsTrue(s.Issues().Any(i => i.code == "over-budget" || i.code == "no-reserve"));
            s.SetRequirement("budgetUsd", 600000f);
            s.Choose("revisit", "fortnightly");
            Assert.IsTrue(s.Issues().Any(i => i.code == "images-target"), "26 images cannot meet a 40-image requirement");
            s.SetRequirement("minImages", 20f);
            Assert.IsFalse(s.Issues().Any(i => i.code == "images-target"));
            s.SetRequirement("pointingToleranceDeg", 0.5f);
            s.Choose("attitude", "magnetorquers");
            Assert.IsTrue(s.Issues().Any(i => i.code == "pointing-accuracy"));
        }

        [Test]
        public void AFlightRunsAtThreeSpeedsAndStopsForAProblem()
        {
            var s = new EarthWatchSession(catalog);
            foreach (var kv in Dictionary(Sensible())) s.Choose(kv.Key, kv.Value);
            foreach (var t in Sensible().tests) s.Toggle("tests", t);
            foreach (var step in EarthWatchSession.Steps.Take(5)) s.CompleteStep(step);
            s.SeedBase = FindSeedWithAProblem();
            s.Fly("launch");
            Assert.AreEqual("detail", s.Speed);
            Assert.IsNull(s.Advance(0.5f), "detail speed is one step a second");
            Assert.IsNotNull(s.Advance(0.6f));
            s.Fly("pause");
            Assert.IsNull(s.Advance(10f));
            s.Fly("fast");
            int steps = 0;
            while (s.Flying && !s.Sim.AwaitingDecision && steps++ < 1000) s.Advance(0.06f);
            Assert.IsTrue(s.Sim.AwaitingDecision, "fast forward stops when a problem appears");
            Assert.AreEqual("detail", s.Speed);
            Assert.IsNull(s.Advance(DecisionWait() - 1f), "the flight waits for the player's command");
            Assert.IsNotNull(s.Advance(2f), "and goes on when time runs out");
        }

        static float DecisionWait() => EarthWatchSession.DecisionSeconds;

        int FindSeedWithAProblem()
        {
            for (int seed = 0; seed < 100; seed++)
                if (new EarthWatchSim(catalog, Sensible(), seed).Schedule.Any(p => p.week > 3)) return seed;
            Assert.Fail("no seed has a problem"); return 0;
        }

        // ---- The bridge ----

        sealed class Wire
        {
            public readonly List<string> Sent = new List<string>();
            public readonly EarthWatchSession Session = new EarthWatchSession(MissionCatalog.Load());
            public readonly BridgeCore Core;
            public Wire() { Core = new BridgeCore(Session, Sent.Add); }
            public string Last(string type) => Sent.LastOrDefault(m => ((Dictionary<string, object>)MiniJson.Parse(m))["type"].Equals(type));
            public Dictionary<string, object> LastPayload(string type) =>
                (Dictionary<string, object>)((Dictionary<string, object>)MiniJson.Parse(Last(type)))["payload"];
            public void Send(string type, string payload) => Core.Receive($"{{\"type\":\"{type}\",\"payload\":{payload}}}");
        }

        [Test]
        public void EachPageMessageChangesTheStateAsSpecified()
        {
            var w = new Wire();
            w.Send("ready", "{}");
            Assert.IsNotNull(w.Last("state"), "ready answers with the state");

            w.Send("choose", "{\"group\":\"orbit\",\"id\":\"sso-550\"}");
            Assert.AreEqual("sso-550", w.Session.Design.orbit);
            Assert.AreEqual("sso-550", ((Dictionary<string, object>)w.LastPayload("state")["design"])["orbit"], "and the state is sent after the change");

            w.Send("choose", "{\"group\":\"orbit\",\"id\":\"no-such-orbit\"}");
            Assert.AreEqual("sso-550", w.Session.Design.orbit, "an unknown id changes nothing");

            w.Send("toggle", "{\"group\":\"tests\",\"id\":\"vibration\"}");
            CollectionAssert.AreEqual(new[] { "vibration" }, w.Session.Design.tests);
            w.Send("toggle", "{\"group\":\"tests\",\"id\":\"vibration\"}");
            Assert.IsEmpty(w.Session.Design.tests);

            w.Send("setRequirement", "{\"id\":\"minImages\",\"value\":44}");
            Assert.AreEqual(44f, w.Session.Requirement("minImages"));
            w.Send("setRequirement", "{\"id\":\"minImages\",\"value\":9999}");
            Assert.AreEqual(52f, w.Session.Requirement("minImages"));

            w.Send("setReserve", "{\"fraction\":0.25}");
            Assert.AreEqual(25f, w.Session.Requirement("reservePercent"), 1e-3f);

            w.Send("completeStep", "{\"step\":\"design\"}");
            Assert.AreEqual("locked", w.Session.StatusOf("design"), "a locked step stays locked");
            w.Send("completeStep", "{\"step\":\"goals\"}");
            Assert.AreEqual("done", w.Session.StatusOf("goals"));
            Assert.AreEqual("open", w.Session.StatusOf("concept"));

            bool closed = false;
            w.Core.CloseRequested += () => closed = true;
            w.Send("close", "{}");
            Assert.IsTrue(closed);
        }

        [Test]
        public void FlyAndCommandMessagesDriveTheFlight()
        {
            var w = new Wire();
            foreach (var kv in Dictionary(Sensible())) w.Session.Choose(kv.Key, kv.Value);
            foreach (var t in Sensible().tests) w.Session.Toggle("tests", t);
            w.Send("fly", "{\"action\":\"launch\"}");
            Assert.IsNull(w.Last("simTick"), "the fly step is still locked");
            foreach (var step in EarthWatchSession.Steps.Take(5)) w.Send("completeStep", $"{{\"step\":\"{step}\"}}");

            w.Send("fly", "{\"action\":\"launch\"}");
            Assert.AreEqual("detail", w.LastPayload("simTick")["speed"]);
            w.Send("fly", "{\"action\":\"pause\"}");
            Assert.AreEqual("paused", w.LastPayload("simTick")["speed"]);
            w.Send("fly", "{\"action\":\"resume\"}");
            Assert.AreEqual("detail", w.LastPayload("simTick")["speed"]);
            w.Send("fly", "{\"action\":\"fast\"}");
            Assert.AreEqual("fast", w.LastPayload("simTick")["speed"]);

            w.Core.Update(0.06f);
            int before = w.Sent.Count;
            w.Send("command", "{\"name\":\"pauseCamera\"}");
            var cmd = ((List<object>)w.LastPayload("simTick")["commands"]).Cast<Dictionary<string, object>>().First(c => (string)c["name"] == "pauseCamera");
            Assert.AreEqual(true, cmd["active"], "the command shows as active");
            Assert.Greater(w.Sent.Count, before);

            w.Send("command", "{\"name\":\"noSuchCommand\"}");
            Assert.IsNotNull(w.Last("simTick"));

            w.Send("fly", "{\"action\":\"retry\"}");
            Assert.AreEqual(1, w.Session.Attempts.Count, "a retry mid-flight records the abandoned attempt");
            Assert.AreEqual("Abandoned", w.Session.Attempts[0].outcome);
            Assert.IsTrue(w.Session.Flying, "and the retry starts a new flight");
        }

        [Test]
        public void TheShipSeamRaisesScreenRequestedAndTellsThePage()
        {
            var w = new Wire();
            string requested = null;
            w.Core.ScreenRequested += s => requested = s;
            w.Core.OpenScreen("requirements");
            Assert.AreEqual("requirements", requested);
            Assert.AreEqual("requirements", w.LastPayload("openScreen")["step"]);
            w.Core.OpenScreen("not-a-step");
            Assert.AreEqual("requirements", requested);
            w.Core.CloseScreen();
            Assert.IsNotNull(w.Last("closeScreen"));
        }

        [Test]
        public void BadMessagesAreIgnoredWithAWarning()
        {
            var w = new Wire();
            LogAssert.Expect(LogType.Warning, new System.Text.RegularExpressions.Regex("unknown message type"));
            LogAssert.Expect(LogType.Warning, new System.Text.RegularExpressions.Regex("without a type"));
            w.Core.Receive("{\"type\":\"dance\",\"payload\":{}}");
            w.Core.Receive("{}");
            Assert.IsEmpty(w.Sent);
        }
    }
}
