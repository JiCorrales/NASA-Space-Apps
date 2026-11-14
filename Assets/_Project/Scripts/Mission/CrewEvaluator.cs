using System;
using System.Collections.Generic;
using System.Linq;

namespace SpaceApps.Mission
{
    /// <summary>One role's goal against the design: the measured value, the target and a 0-100 score.</summary>
    [Serializable]
    public class RoleResult
    {
        public string roleId, roleName, goalText;
        public float value, target;
        public int score;
        public bool met;
    }

    [Serializable]
    public class CrewResult
    {
        public MissionReport report;
        /// <summary>Role ids held by each player, in turn order. One player holds all four.</summary>
        public List<List<string>> players = new List<List<string>>();
        public List<RoleResult> roles = new List<RoleResult>();
        public bool allGoalsMet;
        public int teamScore;
    }

    /// <summary>Crew roles on one machine: who owns which decision, and how well each role's goal is met.
    /// The mission report is the same for any number of players; players only change who decides what.</summary>
    public static class CrewEvaluator
    {
        public static CrewResult Evaluate(MissionCatalog catalog, MissionDesign design, int playerCount)
        {
            var settings = catalog.crew;
            var result = new CrewResult { report = MissionEvaluator.Evaluate(catalog, design), players = AssignRoles(catalog, playerCount) };
            var objective = MissionCatalog.Find(catalog.objectives, design.objective);

            foreach (var role in settings.roles)
            {
                float value = Metric(role.goalMetric, result.report, objective);
                float target = role.goalTarget;
                int score = value <= 0f || target <= 0f ? 0 : (int)Math.Round(Math.Min(100f, 100f * value / target));
                result.roles.Add(new RoleResult
                {
                    roleId = role.id, roleName = role.name, goalText = role.goalText,
                    value = value, target = target, score = score, met = value >= target,
                });
            }

            // Blending the mean with the weakest role means one role cannot carry the team.
            result.allGoalsMet = result.roles.All(r => r.met);
            float blended = settings.meanWeight * (float)result.roles.Average(r => r.score) + settings.minWeight * result.roles.Min(r => r.score);
            if (result.allGoalsMet) blended += settings.allGoalsBonus;
            if (!result.report.success) blended *= settings.failedMissionFactor;
            result.teamScore = (int)Math.Round(blended);
            return result;
        }

        /// <summary>Deals the roles out in catalog order: player i gets roles i, i + n, ... Clamped to 1-4 players.</summary>
        public static List<List<string>> AssignRoles(MissionCatalog catalog, int playerCount)
        {
            var roles = catalog.crew.roles;
            int n = Math.Max(1, Math.Min(roles.Length, playerCount));
            var players = Enumerable.Range(0, n).Select(_ => new List<string>()).ToList();
            for (int i = 0; i < roles.Length; i++) players[i % n].Add(roles[i].id);
            return players;
        }

        /// <summary>The role that owns a decision group (a MissionDesign field name), or null.</summary>
        public static CrewRole OwnerOf(MissionCatalog catalog, string decision) =>
            catalog.crew.roles.FirstOrDefault(r => r.decisions.Contains(decision));

        static float Metric(string metric, MissionReport r, Objective objective)
        {
            switch (metric)
            {
                case "science-ratio":
                    return objective != null && objective.minScience > 0f ? r.science / objective.minScience : 0f;
                case "mass-power-margin":
                    return Math.Min(r.Get(ResourceKind.Mass).Margin, r.Get(ResourceKind.Power).Margin);
                case "contact-margin":
                    return r.Get(ResourceKind.Communications).Margin;
                case "budget-schedule-margin":
                    return Math.Min(r.Get(ResourceKind.Budget).Margin, r.Get(ResourceKind.Time).Margin);
                default:
                    throw new ArgumentException($"Unknown crew goal metric '{metric}'");
            }
        }
    }
}
