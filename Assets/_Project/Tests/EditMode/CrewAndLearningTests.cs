using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using UnityEngine;

namespace SpaceApps.Mission.Tests
{
    public class CrewAndLearningTests
    {
        MissionCatalog catalog;

        [SetUp]
        public void Load() => catalog = MissionCatalog.Load();

        // The MissionDesign fields the player decides (difficulty is a game setting, not a mission decision).
        static readonly string[] Decisions = typeof(MissionDesign).GetFields()
            .Where(f => f.Name != nameof(MissionDesign.difficulty)).Select(f => f.Name).ToArray();

        // Space weather with one instrument: every role meets its goal.
        static MissionDesign Balanced()
        {
            var d = MissionEvaluatorTests.SpaceWeather();
            d.instruments = new List<string> { "plasma-probe" };
            return d;
        }

        [Test]
        public void BalancedCrewBeatsOneRoleMaximisingItsGoal()
        {
            var balanced = CrewEvaluator.Evaluate(catalog, Balanced(), 4);
            var greedy = CrewEvaluator.Evaluate(catalog, MissionEvaluatorTests.SpaceWeather(), 4); // PI adds a second instrument
            Assert.IsTrue(balanced.allGoalsMet, string.Join(", ", balanced.roles.Select(r => $"{r.roleId}={r.value:0.00}/{r.target}")));
            Assert.Greater(greedy.roles.First(r => r.roleId == "pi").value, balanced.roles.First(r => r.roleId == "pi").value);
            Assert.IsFalse(greedy.allGoalsMet, "the extra instrument should cost another role its goal");
            Assert.Greater(balanced.teamScore, greedy.teamScore);
        }

        [Test]
        public void ScienceHeavyDesignStarvesCommunications()
        {
            var careful = CrewEvaluator.Evaluate(catalog, MissionEvaluatorTests.DesignA(), 2);
            var greedy = CrewEvaluator.Evaluate(catalog, MissionEvaluatorTests.DesignB(), 2);
            Assert.Greater(greedy.roles.First(r => r.roleId == "pi").score, careful.roles.First(r => r.roleId == "pi").score);
            Assert.Less(greedy.roles.First(r => r.roleId == "comms").score, careful.roles.First(r => r.roleId == "comms").score);
            Assert.Greater(careful.teamScore, greedy.teamScore);
        }

        [Test]
        public void FailedMissionHalvesTheTeamScore()
        {
            var d = Balanced();
            d.tests.Remove("vibration");
            var failed = CrewEvaluator.Evaluate(catalog, d, 1);
            Assert.IsFalse(failed.report.success);
            Assert.Less(failed.teamScore, CrewEvaluator.Evaluate(catalog, Balanced(), 1).teamScore);
        }

        [Test]
        public void PlayerCountDoesNotChangeTheMission()
        {
            var one = CrewEvaluator.Evaluate(catalog, MissionEvaluatorTests.DesignB(), 1);
            var four = CrewEvaluator.Evaluate(catalog, MissionEvaluatorTests.DesignB(), 4);
            Assert.AreEqual(JsonUtility.ToJson(one.report), JsonUtility.ToJson(four.report));
            Assert.AreEqual(one.teamScore, four.teamScore);
            CollectionAssert.AreEqual(one.roles.Select(r => r.score), four.roles.Select(r => r.score));
        }

        [TestCase(1, new[] { 4 })]
        [TestCase(2, new[] { 2, 2 })]
        [TestCase(3, new[] { 2, 1, 1 })]
        [TestCase(4, new[] { 1, 1, 1, 1 })]
        [TestCase(9, new[] { 1, 1, 1, 1 })]
        public void RolesAreDealtToEveryPlayer(int players, int[] rolesEach)
        {
            var seats = CrewEvaluator.AssignRoles(catalog, players);
            CollectionAssert.AreEqual(rolesEach, seats.Select(s => s.Count));
            CollectionAssert.AreEquivalent(catalog.crew.roles.Select(r => r.id), seats.SelectMany(s => s));
        }

        [Test]
        public void EveryDecisionHasExactlyOneOwner()
        {
            foreach (var decision in Decisions)
                Assert.AreEqual(1, catalog.crew.roles.Count(r => r.decisions.Contains(decision)), decision);
            CollectionAssert.IsSubsetOf(catalog.crew.roles.SelectMany(r => r.decisions), Decisions);
            Assert.AreEqual("pi", CrewEvaluator.OwnerOf(catalog, "instruments").id);
        }

        [Test]
        public void NoDifficultyKeepsTheCatalogValues()
        {
            var plain = MissionEvaluator.Evaluate(catalog, MissionEvaluatorTests.DesignA());
            var objective = MissionCatalog.Find(catalog.objectives, "earth-imaging");
            Assert.AreEqual(objective.budgetUsd.value, plain.Get(ResourceKind.Budget).available, 1e-3f);
            Assert.AreEqual(objective.deadlineMonths.value, plain.Get(ResourceKind.Time).available, 1e-4f);
            foreach (var id in new[] { "normal", "no-such-level" })
            {
                var d = MissionEvaluatorTests.DesignA();
                d.difficulty = id;
                Assert.AreEqual(JsonUtility.ToJson(plain), JsonUtility.ToJson(MissionEvaluator.Evaluate(catalog, d)), id);
            }
        }

        [TestCase("easy")]
        [TestCase("hard")]
        public void DifficultyScalesBudgetDeadlineAndEvents(string id)
        {
            var level = MissionCatalog.Find(catalog.difficulties, id);
            var plainDesign = MissionEvaluatorTests.DesignA();
            var leveled = MissionEvaluatorTests.DesignA();
            leveled.difficulty = id;
            var plain = MissionEvaluator.Evaluate(catalog, plainDesign);
            var r = MissionEvaluator.Evaluate(catalog, leveled);

            Assert.AreEqual(plain.Get(ResourceKind.Budget).available * level.budgetScale, r.Get(ResourceKind.Budget).available, 1f);
            Assert.AreEqual(plain.Get(ResourceKind.Time).available * level.deadlineScale, r.Get(ResourceKind.Time).available, 1e-3f);
            Assert.AreEqual(plain.Get(ResourceKind.Mass).available, r.Get(ResourceKind.Mass).available, "mass limits do not depend on difficulty");
            Assert.AreEqual(plain.Get(ResourceKind.Budget).used, r.Get(ResourceKind.Budget).used, "costs do not depend on difficulty");

            float baseChance = MissionSimulator.EventChance(catalog, plainDesign, "vibration-break");
            Assert.Less(baseChance * level.eventChanceScale, 1f, "pick a card the clamp does not hide");
            Assert.AreEqual(baseChance * level.eventChanceScale, MissionSimulator.EventChance(catalog, leveled, "vibration-break"), 1e-5f);
        }

        [Test]
        public void EasyModeMakesADeadlineThatNormalMisses()
        {
            var d = MissionEvaluatorTests.Radiation(); // 15 of 20 months
            d.launch = "nasa-rideshare"; d.orbit = "leo-500";
            var normal = MissionEvaluator.Evaluate(catalog, d);
            d.difficulty = "easy";
            var easy = MissionEvaluator.Evaluate(catalog, d);
            Assert.IsTrue(normal.Has("schedule-overrun"));
            Assert.IsFalse(easy.Has("schedule-overrun"), "a longer deadline on easy fits the slow rideshare");
        }

    }
}
