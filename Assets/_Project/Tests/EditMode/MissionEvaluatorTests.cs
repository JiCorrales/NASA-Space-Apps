using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using NUnit.Framework;

namespace SpaceApps.Mission.Tests
{
    public class MissionEvaluatorTests
    {
        static readonly List<string> Mandatory = new List<string> { "vibration", "bakeout", "ditl" };
        MissionCatalog catalog;

        [SetUp]
        public void Load() => catalog = MissionCatalog.Load();

        // Earth imaging, cheap and slow: small camera, NASA rideshare to a sun-synchronous orbit.
        static MissionDesign DesignA() => new MissionDesign
        {
            objective = "earth-imaging", format = "3u", power = "body-3u", radio = "s-band",
            groundStation = "university-sband", launch = "nasa-rideshare", orbit = "sso-550",
            instruments = new List<string> { "camera-basic" }, tests = new List<string>(Mandatory),
        };

        // Earth imaging, a different route: multispectral camera released from the space station.
        static MissionDesign DesignB() => new MissionDesign
        {
            objective = "earth-imaging", format = "3u", power = "body-3u", radio = "s-band",
            groundStation = "university-sband", launch = "iss-deploy", orbit = "leo-iss",
            instruments = new List<string> { "camera-multispectral" }, tests = new List<string>(Mandatory),
        };

        static MissionDesign Radiation() => new MissionDesign
        {
            objective = "radiation-survey", format = "1u", power = "body-1u", radio = "uhf",
            groundStation = "amateur-uhf", launch = "commercial-broker", orbit = "leo-500",
            instruments = new List<string> { "dosimeter" }, tests = new List<string>(Mandatory),
        };

        static MissionDesign SpaceWeather() => new MissionDesign
        {
            objective = "space-weather", format = "3u", power = "body-3u", radio = "s-band",
            groundStation = "university-sband", launch = "commercial-broker", orbit = "sso-550",
            instruments = new List<string> { "magnetometer", "plasma-probe" }, tests = new List<string>(Mandatory),
        };

        static MissionDesign SoilMoisture() => new MissionDesign
        {
            objective = "soil-moisture", format = "6u", power = "deployable-6u", radio = "s-band",
            groundStation = "commercial-network", launch = "commercial-broker", orbit = "sso-550",
            instruments = new List<string> { "radiometer" }, tests = new List<string>(Mandatory),
        };

        MissionReport Eval(MissionDesign d) => MissionEvaluator.Evaluate(catalog, d);

        MissionReport EvalWith(MissionDesign d, Action<MissionDesign> change)
        {
            var copy = d.Clone();
            change(copy);
            return Eval(copy);
        }

        static void AssertBlocked(MissionReport r, string code)
        {
            Assert.IsTrue(r.Has(code), $"expected issue {code}, got: {string.Join(", ", r.issues.ConvertAll(i => i.code))}");
            Assert.IsFalse(r.success);
            var issue = r.issues.Find(i => i.code == code);
            Assert.AreEqual(Severity.Blocking, issue.severity);
            Assert.IsNotEmpty(issue.message);
        }

        [Test]
        public void EveryObjectiveHasAWorkingDesign()
        {
            foreach (var d in new[] { DesignA(), DesignB(), Radiation(), SpaceWeather(), SoilMoisture() })
            {
                var r = Eval(d);
                Assert.IsTrue(r.success, $"{d.objective}: {string.Join(" | ", r.issues.ConvertAll(i => i.message))}");
                Assert.IsEmpty(r.issues, d.objective);
                Assert.Greater(r.score, 100);
            }
        }

        [Test]
        public void TwoDifferentDesignsMeetTheSameObjective()
        {
            var a = Eval(DesignA());
            var b = Eval(DesignB());
            Assert.IsTrue(a.success && b.success);
            Assert.AreNotEqual(a.Get(ResourceKind.Budget).used, b.Get(ResourceKind.Budget).used);
            Assert.AreNotEqual(a.Get(ResourceKind.Time).used, b.Get(ResourceKind.Time).used);
        }

        [Test]
        public void ReportsAllSixResources()
        {
            var r = Eval(DesignA());
            foreach (ResourceKind k in Enum.GetValues(typeof(ResourceKind)))
                Assert.Greater(r.Get(k).available, 0f, k.ToString());
        }

        [Test]
        public void DesignAResourceNumbers()
        {
            var r = Eval(DesignA());
            Assert.AreEqual(1.45f, r.Get(ResourceKind.Mass).used, 1e-4f);
            Assert.AreEqual(4.0f, r.Get(ResourceKind.Mass).available, 1e-4f);
            Assert.AreEqual(4.9f, r.Get(ResourceKind.Power).available, 1e-4f);
            Assert.AreEqual(240f, r.Get(ResourceKind.Data).available, 1e-3f);
            Assert.AreEqual(309000f, r.Get(ResourceKind.Budget).used, 1f);
            Assert.AreEqual(23f, r.Get(ResourceKind.Time).used, 1e-4f);
        }

        [Test]
        public void TooHeavyForTheFormat() =>
            AssertBlocked(EvalWith(Radiation(), d => d.instruments.AddRange(new[] { "magnetometer", "plasma-probe" })), "mass-over-format");

        [Test]
        public void TooBigForTheFormat() =>
            AssertBlocked(EvalWith(Radiation(), d => d.instruments.Add("camera-basic")), "volume-over-format");

        [Test]
        public void TooHeavyForTheLauncher() =>
            AssertBlocked(EvalWith(DesignB(), d =>
            {
                d.format = "6u";
                d.power = "deployable-6u";
                d.instruments.AddRange(new[] { "radiometer", "radiometer", "plasma-probe", "magnetometer" });
            }), "mass-over-launcher");

        [Test]
        public void PowerDeficit() => AssertBlocked(EvalWith(DesignB(), d => d.power = "body-1u"), "power-deficit");

        [Test]
        public void PanelsNeedABiggerBody() => AssertBlocked(EvalWith(Radiation(), d => d.power = "body-3u"), "power-needs-bigger-format");

        [Test]
        public void BatteryTooSmallForEclipse()
        {
            var r = EvalWith(DesignB(), d =>
            {
                d.power = "deployable-lite";
                d.instruments.Add("radiometer");
            });
            AssertBlocked(r, "battery-eclipse");
            Assert.IsFalse(r.Has("power-deficit"), "panels cover the average load; only the battery should fail");
        }

        [Test]
        public void MoreDataThanTheLinkCanCarry()
        {
            var r = EvalWith(DesignB(), d => { d.radio = "uhf"; d.groundStation = "amateur-uhf"; });
            Assert.IsTrue(r.Has("data-overflow"));
            Assert.Less(r.science, Eval(DesignB()).science);
            AssertBlocked(r, "science-short");
        }

        [Test]
        public void StationCannotHearTheRadio() =>
            AssertBlocked(EvalWith(DesignA(), d => d.groundStation = "amateur-uhf"), "station-band-mismatch");

        [Test]
        public void OverBudgetWhenTheLaunchCostsMoreThanNasaCovers()
        {
            var r = EvalWith(DesignB(), d => { d.launch = "dedicated-small"; d.orbit = "sso-550"; });
            AssertBlocked(r, "over-budget");
            StringAssert.Contains("NASA covers launch", r.issues.Find(i => i.code == "over-budget").message);
        }

        [Test]
        public void ThinReserveIsAWarningNotAFailure()
        {
            var r = EvalWith(DesignB(), d => d.groundStation = "commercial-network");
            Assert.IsTrue(r.Has("no-reserve"));
            Assert.IsTrue(r.success);
        }

        [Test]
        public void ScheduleOverrunWithTheSlowRideshare() =>
            AssertBlocked(EvalWith(Radiation(), d => d.launch = "nasa-rideshare"), "schedule-overrun");

        [Test]
        public void ACameraAddsTheNoaaLicenceTime()
        {
            var withCamera = Eval(DesignA()).Get(ResourceKind.Time).used;
            var noCamera = EvalWith(DesignA(), d => { d.objective = "space-weather"; d.instruments = new List<string> { "magnetometer" }; })
                .Get(ResourceKind.Time).used;
            Assert.Greater(withCamera, noCamera);
        }

        [Test]
        public void LauncherDoesNotReachTheOrbit() => AssertBlocked(EvalWith(DesignA(), d => d.launch = "iss-deploy"), "launcher-orbit");

        [Test]
        public void LauncherHasNoDispenserForTheFormat() => AssertBlocked(EvalWith(DesignA(), d => d.format = "6u"), "launcher-dispenser");

        [Test]
        public void OrbitDoesNotServeTheObjective() =>
            AssertBlocked(EvalWith(SoilMoisture(), d => d.orbit = "leo-500"), "orbit-objective");

        [Test]
        public void OrbitDecaysBeforeTheMissionEnds() =>
            AssertBlocked(EvalWith(SoilMoisture(), d => { d.orbit = "leo-iss"; d.launch = "iss-deploy"; }), "orbit-lifetime");

        [Test]
        public void MandatoryTestMissing() => AssertBlocked(EvalWith(DesignA(), d => d.tests.Remove("vibration")), "missing-test");

        [Test]
        public void NoInstrumentForTheObjective() =>
            AssertBlocked(EvalWith(DesignA(), d => d.instruments = new List<string> { "dosimeter" }), "missing-instrument");

        [Test]
        public void UnknownChoiceIsReportedNotThrown() => AssertBlocked(EvalWith(DesignA(), d => d.orbit = null), "incomplete-design");

        [Test]
        public void EmptyDesignStillReportsEveryResource()
        {
            var r = Eval(new MissionDesign());
            foreach (ResourceKind k in Enum.GetValues(typeof(ResourceKind)))
                Assert.IsTrue(r.resources.Exists(b => b.kind == k), k.ToString());
            Assert.AreEqual(catalog.constants.busMassKg.value, r.Get(ResourceKind.Mass).used, 1e-4f);
            AssertBlocked(r, "incomplete-design");
            StringAssert.Contains("orbit", r.issues.Find(i => i.code == "incomplete-design").message);
        }

        [Test]
        public void PartialDesignShowsWhatIsKnownSoFar()
        {
            var r = Eval(new MissionDesign { format = "3u", instruments = new List<string> { "camera-basic" } });
            Assert.AreEqual(0.3f + 0.5f + 0.2f, r.Get(ResourceKind.Mass).used, 1e-4f);
            Assert.AreEqual(4.0f, r.Get(ResourceKind.Mass).available, 1e-4f);
            Assert.AreEqual(15f, r.Get(ResourceKind.Data).used, 1e-4f);
            Assert.AreEqual(0f, r.Get(ResourceKind.Power).available);
            Assert.Greater(r.Get(ResourceKind.Budget).used, 0f);
            var missing = r.issues.Find(i => i.code == "incomplete-design").message;
            StringAssert.Contains("orbit", missing);
            StringAssert.DoesNotContain("format", missing);
            Assert.IsFalse(r.Has("power-deficit"), "checks that need a missing part are skipped");
        }

        [Test]
        public void ChoosingAPartMovesTheResources()
        {
            var before = Eval(new MissionDesign { format = "3u" });
            var after = Eval(new MissionDesign { format = "3u", power = "body-3u" });
            Assert.Greater(after.Get(ResourceKind.Mass).used, before.Get(ResourceKind.Mass).used);
            Assert.Greater(after.Get(ResourceKind.Power).available, before.Get(ResourceKind.Power).available);
        }

        [Test]
        public void GetNeverThrows() => Assert.AreEqual(ResourceKind.Data, new MissionReport().Get(ResourceKind.Data).kind);

        [Test]
        public void InstrumentsOffTheObjectiveAddNoScience() =>
            Assert.AreEqual(Eval(DesignA()).science, EvalWith(DesignA(), d => d.instruments.Add("dosimeter")).science, 1e-4f);

        [Test]
        public void MessagesDoNotDependOnTheMachineLanguage()
        {
            var designs = new List<MissionDesign>
            {
                Radiation().Clone(), DesignB().Clone(), DesignB().Clone(),
            };
            designs[0].instruments.AddRange(new[] { "magnetometer", "plasma-probe" });
            designs[1].launch = "dedicated-small"; designs[1].orbit = "sso-550";
            designs[2].radio = "uhf"; designs[2].groundStation = "amateur-uhf";

            var saved = CultureInfo.CurrentCulture;
            try
            {
                CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
                var invariant = designs.SelectMany(d => Eval(d).issues.Select(i => i.message)).ToList();
                CultureInfo.CurrentCulture = new CultureInfo("es-ES");
                var spanish = designs.SelectMany(d => Eval(d).issues.Select(i => i.message)).ToList();
                CollectionAssert.AreEqual(invariant, spanish);
                StringAssert.DoesNotContain(" %", string.Join(" ", invariant));
            }
            finally { CultureInfo.CurrentCulture = saved; }
        }

        [Test]
        public void OptionalTestsRaiseReliabilityAndScore()
        {
            var a = Eval(DesignA());
            var tested = EvalWith(DesignA(), d => d.tests.Add("etu"));
            Assert.IsTrue(tested.success);
            Assert.Greater(tested.reliability, a.reliability);
            Assert.Greater(tested.score, a.score);
        }

        [Test]
        public void PreferredOrbitGivesMoreScience()
        {
            var sso = Eval(SpaceWeather());
            var leo = EvalWith(SpaceWeather(), d => d.orbit = "leo-500");
            Assert.Greater(sso.science, leo.science);
        }

        [Test]
        public void FailedMissionScoresBelowAnySuccess()
        {
            var failed = EvalWith(SpaceWeather(), d => d.instruments.AddRange(Enumerable.Repeat("plasma-probe", 9)));
            Assert.IsFalse(failed.success);
            var careful = DesignA().Clone();
            careful.tests.AddRange(new[] { "etu", "flatsat", "tvac-cycling" });
            foreach (var d in new[] { DesignA(), DesignB(), Radiation(), SpaceWeather(), SoilMoisture(), careful })
            {
                var ok = Eval(d);
                Assert.IsTrue(ok.success, d.objective);
                Assert.Less(failed.score, ok.score, d.objective);
            }
        }

        [Test]
        public void EvaluationIsDeterministic()
        {
            var x = Eval(DesignB());
            var y = Eval(DesignB());
            Assert.AreEqual(x.score, y.score);
            Assert.AreEqual(x.issues.Count, y.issues.Count);
        }
    }
}
