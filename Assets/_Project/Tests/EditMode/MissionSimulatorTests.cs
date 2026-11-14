using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;

namespace SpaceApps.Mission.Tests
{
    public class MissionSimulatorTests
    {
        MissionCatalog catalog;

        [SetUp]
        public void Load() => catalog = MissionCatalog.Load();

        static MissionDesign Careful()
        {
            var d = MissionEvaluatorTests.DesignA();
            d.tests.AddRange(new[] { "etu", "flatsat", "tvac-cycling" });
            return d;
        }

        static string Trace(MissionRun r) => string.Join("|", r.timeline.Select(e => $"{e.month:0.00}:{e.code}")) + $"#{r.outcome}#{r.score}";

        // A catalog where only the named card can fire, and always does.
        static MissionCatalog OnlyEvent(string id)
        {
            var c = MissionCatalog.Load();
            foreach (var e in c.events)
            {
                e.baseChance.value = e.id == id ? 1f : 0f;
                e.modifiers = new EventModifier[0];
            }
            return c;
        }

        static MissionCatalog OnlyEvents(params string[] ids)
        {
            var c = MissionCatalog.Load();
            foreach (var e in c.events)
            {
                e.baseChance.value = ids.Contains(e.id) ? 1f : 0f;
                e.modifiers = new EventModifier[0];
            }
            return c;
        }

        // Only the named card can fire, it always does, and its modifiers still decide the explanation.
        static MissionCatalog ForceKeepingModifiers(string id)
        {
            var c = MissionCatalog.Load();
            foreach (var e in c.events)
            {
                e.baseChance.value = e.id == id ? 1f : 0f;
                if (e.id != id) e.modifiers = new EventModifier[0];
            }
            return c;
        }

        [Test]
        public void PrecautionsTakenMeanBadLuckNotBlame()
        {
            var c = ForceKeepingModifiers("vibration-break");
            var card = c.events.First(e => e.id == "vibration-break");
            var r = MissionSimulator.Run(c, Careful(), 0);
            var entry = r.timeline.Single(e => e.code == "vibration-break");
            CollectionAssert.DoesNotContain(r.lessons, card.mitigation, "the design already built the ETU and the FlatSat");
            Assert.IsTrue(r.lessons.Any(l => l.Contains("bad luck")), string.Join(" | ", r.lessons));
            StringAssert.DoesNotContain("More likely because", entry.explanation);
        }

        [Test]
        public void SkippedPrecautionIsNamedInTheTimeline()
        {
            var c = ForceKeepingModifiers("vibration-break");
            var card = c.events.First(e => e.id == "vibration-break");
            var r = MissionSimulator.Run(c, MissionEvaluatorTests.DesignA(), 0);
            var entry = r.timeline.Single(e => e.code == "vibration-break");
            StringAssert.Contains("engineering test unit was skipped", entry.explanation);
            CollectionAssert.Contains(r.lessons, card.mitigation);
        }

        [Test]
        public void SmallDelayIsAbsorbedByTheDeliverySlack()
        {
            var design = MissionEvaluatorTests.CloudIceFromStation();
            var calm = MissionSimulator.Run(OnlyEvent("none"), design, 0);
            var r = MissionSimulator.Run(OnlyEvent("vibration-break"), design, 0); // 2 months, inside the slack
            Assert.AreEqual(calm.launchMonth, r.launchMonth, 1e-4f, "the rocket does not move for a CubeSat");
            Assert.IsFalse(r.timeline.Any(e => e.code == "missed-ride"));
        }

        [Test]
        public void LongDelayMissesTheRideAndWaitsForTheNext()
        {
            var design = MissionEvaluatorTests.CloudIceFromStation(); // space station rides every couple of months
            var calm = MissionSimulator.Run(OnlyEvent("none"), design, 0);
            var r = MissionSimulator.Run(OnlyEvents("vibration-break", "late-delivery"), design, 0); // 5 months late
            var wait = MissionCatalog.Find(catalog.launches, design.launch).waitMonths.value;
            Assert.IsTrue(r.timeline.Any(e => e.code == "missed-ride"));
            Assert.IsTrue(r.Launched);
            Assert.AreEqual(calm.launchMonth + wait, r.launchMonth, 1e-4f);
        }

        [Test]
        public void MissedRideAfterTheDeadlineStopsTheMission()
        {
            var design = MissionEvaluatorTests.DesignA(); // NASA rideshare: the next ride is 9 months later
            var r = MissionSimulator.Run(OnlyEvents("vibration-break", "late-delivery"), design, 0);
            Assert.IsFalse(r.Launched);
            var stop = r.timeline.Single(e => e.code == "stopped:missed-launch");
            StringAssert.Contains("next ride", stop.explanation);
        }

        [Test]
        public void LicenceRiskFollowsScheduleSlackNotTheCamera()
        {
            var camera = MissionEvaluatorTests.DesignA();
            var noCamera = MissionEvaluatorTests.DesignA();
            noCamera.objective = "space-weather";
            noCamera.instruments = new List<string> { "magnetometer" };
            Assert.AreEqual(MissionSimulator.EventChance(catalog, noCamera, "licence-late"),
                            MissionSimulator.EventChance(catalog, camera, "licence-late"), 1e-6f, "choosing a camera is not a schedule mistake");

            MissionCatalog.Find(catalog.objectives, "earth-imaging").deadlineMonths.value = 24f; // 23 of 24 months: tight
            Assert.Greater(MissionSimulator.EventChance(catalog, camera, "licence-late"),
                           MissionSimulator.EventChance(catalog, noCamera, "licence-late"));
        }

        [Test]
        public void StormChanceGrowsWithMissionLength()
        {
            float sixMonths = MissionSimulator.EventChance(catalog, MissionEvaluatorTests.RadiationOn3U(), "solar-storm");
            float twelveMonths = MissionSimulator.EventChance(catalog, MissionEvaluatorTests.DesignA(), "solar-storm");
            Assert.AreEqual(1f - (float)System.Math.Exp(-0.5 * 6 / 12), sixMonths, 1e-4f);
            Assert.AreEqual(1f - (float)System.Math.Exp(-0.5 * 12 / 12), twelveMonths, 1e-4f);
        }

        [Test]
        public void LostLicenceIsReportedInTheLicensingPhase()
        {
            var r = MissionSimulator.Run(OnlyEvent("licence-late"), MissionEvaluatorTests.DesignA(), 0);
            Assert.AreEqual(MissionPhase.Licensing, r.timeline.Single(e => e.code == "stopped:launch-lost").phase);
        }

        [Test]
        public void NullListsDoNotThrow()
        {
            var d = MissionEvaluatorTests.DesignA();
            d.tests = null;
            Assert.DoesNotThrow(() => MissionSimulator.Run(catalog, d, 0));
            Assert.DoesNotThrow(() => MissionSimulator.EventChance(catalog, d, "vibration-break"));
        }

        [Test]
        public void EveryModifierConditionChangesTheChance()
        {
            // Flip each condition on and off for the same design and check the card's chance moves by the modifier.
            foreach (var card in catalog.events)
                foreach (var m in card.modifiers)
                {
                    float on = ChanceWith(card.id, m.condition, true), off = ChanceWith(card.id, m.condition, false);
                    Assert.AreEqual(System.Math.Min(1f, off + m.chance), on, 1e-5f, $"{card.id} / {m.condition}");
                }
        }

        static float ChanceWith(string cardId, string condition, bool holds)
        {
            var c = MissionCatalog.Load();
            var d = MissionEvaluatorTests.DesignA();
            d.tests.AddRange(new[] { "etu", "flatsat", "tvac-cycling" });
            var rule = MissionCatalog.Find(c.conditions, condition);
            if (condition.StartsWith("skipped:")) { if (holds) d.tests.Remove(condition.Substring(8)); }
            else if (condition == "deployables") d.power = holds ? "deployable-3u" : "body-3u";
            else if (condition == "full-volume") rule.threshold.value = holds ? 0f : 2f;
            else rule.threshold.value = holds ? 2f : -2f; // margin conditions: below 2 always holds, below -2 never
            return MissionSimulator.EventChance(c, d, cardId);
        }

        [Test]
        public void GoldenTraceForOneSeed()
        {
            // Catches a platform difference in random numbers or float formatting that two runs in one process cannot.
            Assert.AreEqual("0.00:approved|23.00:launch|23.00:burn-wire|23.00:end#Lost#0", Trace(MissionSimulator.Run(catalog, MissionEvaluatorTests.DesignA(), 7)));
        }

        [Test]
        public void OneSmallHitIsSurvivableWithScienceMargin()
        {
            var r = MissionSimulator.Run(OnlyEvent("team-turnover"), MissionEvaluatorTests.Radiation(), 0);
            Assert.AreEqual(MissionOutcome.FullSuccess, r.outcome, $"{r.scienceReturned} of {r.scienceNeeded}");
        }

        [Test]
        public void SameSeedGivesTheSameRun()
        {
            for (int seed = 0; seed < 50; seed++)
                Assert.AreEqual(Trace(MissionSimulator.Run(catalog, MissionEvaluatorTests.DesignA(), seed)),
                                Trace(MissionSimulator.Run(catalog, MissionEvaluatorTests.DesignA(), seed)), $"seed {seed}");
        }

        [Test]
        public void DifferentSeedsGiveDifferentRuns()
        {
            var traces = Enumerable.Range(0, 50).Select(s => Trace(MissionSimulator.Run(catalog, MissionEvaluatorTests.DesignA(), s)));
            Assert.Greater(traces.Distinct().Count(), 5);
        }

        [Test]
        public void CarefulDesignSucceedsClearlyMoreOften()
        {
            const int runs = 400;
            int Wins(MissionDesign d) => Enumerable.Range(0, runs)
                .Count(s => MissionSimulator.Run(catalog, d, s).outcome == MissionOutcome.FullSuccess);
            int careful = Wins(Careful()), careless = Wins(MissionEvaluatorTests.DesignA());
            Assert.Greater(careful - careless, runs / 10, $"careful {careful}/{runs}, careless {careless}/{runs}");
        }

        [Test]
        public void ReserveLowersTheChanceOfABudgetSlip()
        {
            var thin = MissionEvaluatorTests.DesignB().Clone();
            thin.groundStation = "commercial-network";
            Assert.Greater(MissionSimulator.EventChance(catalog, thin, "budget-slip"),
                           MissionSimulator.EventChance(catalog, MissionEvaluatorTests.DesignB(), "budget-slip"));
        }

        [Test]
        public void BlockedDesignNeverLaunchesAndSaysWhy()
        {
            var d = MissionEvaluatorTests.DesignA();
            d.tests.Remove("vibration");
            for (int seed = 0; seed < 20; seed++)
            {
                var r = MissionSimulator.Run(catalog, d, seed);
                Assert.IsFalse(r.Launched);
                Assert.AreEqual(MissionOutcome.StoppedBeforeLaunch, r.outcome);
                Assert.IsTrue(r.timeline.Any(e => e.code == "stopped:missing-test"));
                Assert.IsFalse(r.timeline.Any(e => e.phase >= MissionPhase.Launch));
                Assert.IsNotEmpty(r.lessons);
                Assert.AreEqual(0, r.score);
            }
        }

        [Test]
        public void EveryEventAppliesItsEffect()
        {
            var design = MissionEvaluatorTests.CloudIce();
            var calm = MissionSimulator.Run(OnlyEvent("none"), design, 0);
            Assert.AreEqual(MissionOutcome.FullSuccess, calm.outcome);

            foreach (var card in catalog.events)
            {
                var r = MissionSimulator.Run(OnlyEvent(card.id), design, 0);
                var entry = r.timeline.SingleOrDefault(e => e.code == card.id);
                Assert.IsNotNull(entry, card.id);
                Assert.AreEqual(card.delayMonths.value, entry.delayMonths, card.id);
                if (entry.explanation.Contains("More likely because"))
                    CollectionAssert.Contains(r.lessons, card.mitigation, card.id);
                else
                    Assert.IsTrue(r.lessons.Any(l => l.Contains("bad luck")), card.id);

                if (card.outcome == "launch-lost")
                {
                    Assert.AreEqual(MissionOutcome.StoppedBeforeLaunch, r.outcome, card.id);
                    continue;
                }
                if (card.outcome == "mission-lost")
                {
                    Assert.AreEqual(MissionOutcome.Lost, r.outcome, card.id);
                    Assert.Less(r.scienceReturned, calm.scienceReturned, card.id);
                    continue;
                }
                Assert.AreEqual(calm.totalCostUsd + card.costUsd, r.totalCostUsd, 1f, card.id);
                float slack = catalog.constants.deliverySlackMonths;
                if (card.delayMonths <= slack)
                    Assert.AreEqual(calm.launchMonth, r.launchMonth, 1e-4f, card.id + ": a delay inside the slack keeps the ride");
                else
                    Assert.IsTrue(r.timeline.Any(e => e.code == "missed-ride"), card.id);
                if (r.Launched && card.scienceLoss > 0f)
                {
                    // A loss takes its share of the science still to come, not of the whole mission.
                    var objective = MissionCatalog.Find(catalog.objectives, design.objective);
                    float elapsed = (entry.month - r.launchMonth) / objective.missionMonths;
                    Assert.Greater(elapsed, 0f, card.id);
                    Assert.AreEqual(calm.scienceReturned * (1f - (1f - elapsed) * card.scienceLoss), r.scienceReturned, 1e-3f, card.id);
                }
            }
        }

        [Test]
        public void SurpriseCostsCanEmptyTheBudget()
        {
            var c = OnlyEvent("budget-slip");
            c.events.First(e => e.id == "budget-slip").costUsd.value = 1e7f;
            var r = MissionSimulator.Run(c, MissionEvaluatorTests.DesignA(), 0);
            Assert.IsFalse(r.Launched);
            Assert.IsTrue(r.timeline.Any(e => e.code == "stopped:out-of-money"));
        }

        [Test]
        public void ScienceReturnedNeverExceedsTheEvaluator()
        {
            var designs = MissionEvaluatorTests.AllWorking().Append(Careful());
            foreach (var d in designs)
            {
                float max = MissionEvaluator.Evaluate(catalog, d).science;
                for (int seed = 0; seed < 100; seed++)
                {
                    var r = MissionSimulator.Run(catalog, d, seed);
                    Assert.LessOrEqual(r.scienceReturned, max + 1e-4f, $"{d.objective} seed {seed}");
                    Assert.AreEqual(r.outcome == MissionOutcome.FullSuccess, r.scienceReturned >= r.scienceNeeded && r.Launched && r.outcome != MissionOutcome.Lost);
                }
            }
        }

        [Test]
        public void TimelineTextDoesNotDependOnTheMachineLanguage()
        {
            var broke = OnlyEvent("budget-slip");
            broke.events.First(e => e.id == "budget-slip").costUsd.value = 1e7f;
            string Text(MissionCatalog c, int seed) => string.Join("|", MissionSimulator.Run(c, MissionEvaluatorTests.DesignB(), seed).timeline.Select(e => e.explanation));
            var saved = System.Globalization.CultureInfo.CurrentCulture;
            try
            {
                System.Globalization.CultureInfo.CurrentCulture = System.Globalization.CultureInfo.InvariantCulture;
                var invariant = Enumerable.Range(0, 20).Select(s => Text(catalog, s)).Append(Text(broke, 0)).ToList();
                System.Globalization.CultureInfo.CurrentCulture = new System.Globalization.CultureInfo("es-ES");
                var spanish = Enumerable.Range(0, 20).Select(s => Text(catalog, s)).Append(Text(broke, 0)).ToList();
                CollectionAssert.AreEqual(invariant, spanish);
            }
            finally { System.Globalization.CultureInfo.CurrentCulture = saved; }
        }

        [Test]
        public void TimelineMovesForwardInTime()
        {
            for (int seed = 0; seed < 50; seed++)
            {
                var t = MissionSimulator.Run(catalog, Careful(), seed).timeline;
                for (int i = 1; i < t.Count; i++) Assert.GreaterOrEqual(t[i].month, t[i - 1].month, $"seed {seed} step {i}");
            }
        }
    }
}
