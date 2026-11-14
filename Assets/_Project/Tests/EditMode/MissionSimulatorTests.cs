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
            var design = MissionEvaluatorTests.SoilMoisture();
            var calm = MissionSimulator.Run(OnlyEvent("none"), design, 0);
            Assert.AreEqual(MissionOutcome.FullSuccess, calm.outcome);

            foreach (var card in catalog.events)
            {
                var r = MissionSimulator.Run(OnlyEvent(card.id), design, 0);
                var entry = r.timeline.SingleOrDefault(e => e.code == card.id);
                Assert.IsNotNull(entry, card.id);
                Assert.AreEqual(card.delayMonths.value, entry.delayMonths, card.id);
                CollectionAssert.Contains(r.lessons, card.mitigation, card.id);

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
                if (r.Launched)
                    Assert.AreEqual(calm.launchMonth + card.delayMonths, r.launchMonth, 1e-4f, card.id);
                else
                    Assert.IsTrue(r.timeline.Any(e => e.code == "stopped:missed-launch"), card.id);
                if (r.Launched)
                    Assert.AreEqual(calm.scienceReturned * (1f - card.scienceLoss), r.scienceReturned, 1e-3f, card.id);
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
            var designs = new[] { MissionEvaluatorTests.DesignA(), MissionEvaluatorTests.DesignB(), MissionEvaluatorTests.Radiation(),
                                  MissionEvaluatorTests.SpaceWeather(), MissionEvaluatorTests.SoilMoisture(), Careful() };
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
