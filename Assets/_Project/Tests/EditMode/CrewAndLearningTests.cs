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
