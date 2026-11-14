using System;
using System.Collections.Generic;
using System.Linq;

namespace SpaceApps.Mission
{
    public enum MissionPhase { Design, Development, Testing, Licensing, Delivery, Launch, Operations, End }

    public enum MissionOutcome { StoppedBeforeLaunch, Lost, Partial, FullSuccess }

    /// <summary>One step of the playback. <see cref="code"/> is the event id, or a milestone such as
    /// "approved", "launch", "end", or "stopped:&lt;reason&gt;".</summary>
    [Serializable]
    public class TimelineEntry
    {
        public float month;
        public MissionPhase phase;
        public string code, title, explanation;
        public float delayMonths, extraCostUsd, scienceLost;
    }

    [Serializable]
    public class MissionRun
    {
        public int seed;
        public MissionReport report;
        public List<TimelineEntry> timeline = new List<TimelineEntry>();
        public MissionOutcome outcome;
        /// <summary>Month the satellite launched, or -1 if it never did.</summary>
        public float launchMonth = -1f;
        public float totalCostUsd;
        public float scienceExpected, scienceReturned, scienceNeeded;
        public int score;
        /// <summary>What went wrong and what to change next time, in plain language.</summary>
        public List<string> lessons = new List<string>();

        public bool Launched => launchMonth >= 0f;
    }

    /// <summary>Plays a design out month by month with the event deck. Same catalog, design and seed: same run.</summary>
    public static class MissionSimulator
    {
        static readonly MissionPhase[] BuildPhases = { MissionPhase.Development, MissionPhase.Testing, MissionPhase.Licensing, MissionPhase.Delivery };

        public static MissionRun Run(MissionCatalog catalog, MissionDesign design, int seed)
        {
            var report = MissionEvaluator.Evaluate(catalog, design);
            var run = new MissionRun { seed = seed, report = report };
            run.lessons.AddRange(report.issues.Select(i => i.message));

            if (!report.success)
            {
                foreach (var issue in report.issues.Where(i => i.severity == Severity.Blocking))
                    Add(run, 0f, MissionPhase.Design, "stopped:" + issue.code, "Stopped at design review", issue.message);
                run.outcome = MissionOutcome.StoppedBeforeLaunch;
                return run;
            }

            var c = catalog.constants;
            var objective = MissionCatalog.Find(catalog.objectives, design.objective);
            var launch = MissionCatalog.Find(catalog.launches, design.launch);
            var conditions = Conditions(catalog, design, report);
            float months = objective.missionMonths;
            var random = new Random(seed);
            var cards = catalog.events ?? new EventCard[0];

            float budget = report.Get(ResourceKind.Budget).available;
            float buildEnd = report.Get(ResourceKind.Time).used - launch.waitMonths;
            float delay = 0f;
            run.totalCostUsd = report.Get(ResourceKind.Budget).used;
            run.scienceExpected = report.science;
            run.scienceNeeded = objective.minScience;
            float science = report.science;

            Add(run, 0f, MissionPhase.Design, "approved", "Design approved",
                "The design passed review" + (report.issues.Count > 0 ? ", with warnings: " + string.Join(" ", report.issues.Select(i => i.message)) : "."));

            // Build: each phase rolls its cards; delays push every later step back.
            for (int p = 0; p < BuildPhases.Length; p++)
            {
                float month = c.baselineMonths + (buildEnd - c.baselineMonths) * p / (BuildPhases.Length - 1f) + delay;
                foreach (var card in Phase(cards, BuildPhases[p]))
                {
                    if (!Fires(random, card, conditions, months)) continue;
                    var e = Fire(run, catalog, card, conditions, month);
                    delay += e.delayMonths;
                    run.totalCostUsd += e.extraCostUsd;
                    if (card.outcome == "launch-lost")
                        return Stop(run, month, "launch-lost", "Removed from the launch", card.description, BuildPhases[p]);
                }
            }

            if (run.totalCostUsd > budget)
                return Stop(run, buildEnd + delay, "out-of-money", "The money ran out",
                    MissionEvaluator.Inv($"Surprise costs took the mission to ${run.totalCostUsd:N0}, over the ${budget:N0} budget, before it could launch."));

            // The rocket never waits for a CubeSat (CubeSat 101 section 2.15 p.28). A delay inside the delivery
            // slack keeps the planned ride; a longer one misses it, and the satellite waits for the next ride.
            float plannedLaunch = buildEnd + launch.waitMonths;
            run.launchMonth = plannedLaunch;
            float slack = c.deliverySlackMonths;
            if (delay > slack)
            {
                float wait = Math.Max(1f, launch.waitMonths);
                int missed = (int)Math.Ceiling((delay - slack) / wait);
                run.launchMonth = plannedLaunch + missed * wait;
                Add(run, buildEnd + delay, MissionPhase.Delivery, "missed-ride", "The rocket left without it",
                    MissionEvaluator.Inv($"Delays added {delay:0.#} months, more than the {slack:0.#} months of delivery slack, so the planned rocket left without the satellite. The next ride is at month {run.launchMonth:0.#}."));
            }
            float deadline = objective.deadlineMonths;
            if (run.launchMonth > deadline)
                return Stop(run, run.launchMonth, "missed-launch", "No ride before the deadline",
                    MissionEvaluator.Inv($"The next ride is at month {run.launchMonth:0.#}, after the month-{deadline:0} deadline, so the mission cannot fly in time."));

            Add(run, run.launchMonth, MissionPhase.Launch, "launch", MissionEvaluator.Inv($"Launch on the {launch.name}"), "The satellite is released into orbit.");
            foreach (var card in Phase(cards, MissionPhase.Launch))
            {
                if (!Fires(random, card, conditions, months)) continue;
                Fire(run, catalog, card, conditions, run.launchMonth);
                if (card.outcome == "mission-lost") return Lose(run, run.launchMonth, 0f);
            }

            // Operations: each card that fires takes a share of the science still to come.
            var ops = Phase(cards, MissionPhase.Operations).ToList();
            for (int i = 0; i < ops.Count; i++)
            {
                if (!Fires(random, ops[i], conditions, months)) continue;
                float fraction = (i + 1f) / (ops.Count + 1f);
                float month = run.launchMonth + objective.missionMonths * fraction;
                if (ops[i].outcome == "mission-lost")
                {
                    Fire(run, catalog, ops[i], conditions, month);
                    return Lose(run, month, science * fraction);
                }
                float lost = Math.Min(science, run.scienceExpected * (1f - fraction) * Math.Min(1f, ops[i].scienceLoss));
                science -= lost;
                Fire(run, catalog, ops[i], conditions, month).scienceLost = lost;
            }

            run.scienceReturned = science;
            run.outcome = science >= run.scienceNeeded ? MissionOutcome.FullSuccess : MissionOutcome.Partial;
            run.score = (int)Math.Round(report.score * (report.science > 0f ? science / report.science : 0f));
            if (run.outcome == MissionOutcome.Partial)
                run.lessons.Add(MissionEvaluator.Inv($"The mission returned {science:0} science points but needed {run.scienceNeeded:0}. More margin on the instruments or fewer risks would have covered the losses."));
            Add(run, run.launchMonth + objective.missionMonths, MissionPhase.End, "end",
                run.outcome == MissionOutcome.FullSuccess ? "Mission accomplished" : "Mission ended short of its goal",
                MissionEvaluator.Inv($"The mission returned {science:0} of the {run.scienceExpected:0} science points it could, against {run.scienceNeeded:0} needed."));
            return run;
        }

        /// <summary>Chance (0 to 1) that a card fires for this design: base plus every modifier whose condition holds.</summary>
        public static float EventChance(MissionCatalog catalog, MissionDesign design, string eventId)
        {
            var card = MissionCatalog.Find(catalog.events, eventId);
            if (card == null) return 0f;
            float months = MissionCatalog.Find(catalog.objectives, design.objective)?.missionMonths.value ?? 12f;
            return Chance(card, Conditions(catalog, design, MissionEvaluator.Evaluate(catalog, design)), months);
        }

        // The design decisions the event deck reacts to. Names match EventModifier.condition in the JSON.
        static HashSet<string> Conditions(MissionCatalog catalog, MissionDesign design, MissionReport report)
        {
            var set = new HashSet<string>();
            var tests = design.tests ?? new List<string>();
            foreach (var t in catalog.tests.Where(t => !t.mandatory && !tests.Contains(t.id))) set.Add("skipped:" + t.id);

            // Thresholds live in the catalog's conditions table; a condition missing there never fires.
            void Below(string id, ResourceKind kind)
            {
                var rule = MissionCatalog.Find(catalog.conditions, id);
                if (rule != null && report.Get(kind).Margin < rule.threshold) set.Add(id);
            }
            Below("no-reserve", ResourceKind.Budget);
            Below("tight-schedule", ResourceKind.Time);
            Below("tight-power", ResourceKind.Power);
            Below("weak-station", ResourceKind.Communications);

            var c = catalog.constants;

            var format = MissionCatalog.Find(catalog.formats, design.format);
            var power = MissionCatalog.Find(catalog.power, design.power);
            var instruments = (design.instruments ?? new List<string>()).Select(id => MissionCatalog.Find(catalog.instruments, id)).Where(i => i != null).ToList();
            float units = c.busUnits + instruments.Sum(i => i.units.value);
            var fill = MissionCatalog.Find(catalog.conditions, "full-volume");
            if (format != null && fill != null && units > format.units * fill.threshold) set.Add("full-volume");
            if (power != null && power.deployable) set.Add("deployables");
            return set;
        }

        static float Chance(EventCard card, HashSet<string> conditions, float missionMonths)
        {
            float b = card.baseChancePerYear ? 1f - (float)Math.Exp(-card.baseChance * missionMonths / 12f) : card.baseChance.value;
            float chance = b + (card.modifiers ?? new EventModifier[0])
                .Where(m => conditions.Contains(m.condition)).Sum(m => m.chance.value);
            return Math.Max(0f, Math.Min(1f, chance));
        }

        // Always draws one number per card so a card's chance never shifts the rolls of the cards after it.
        static bool Fires(Random random, EventCard card, HashSet<string> conditions, float missionMonths) =>
            random.NextDouble() < Chance(card, conditions, missionMonths);

        static IEnumerable<EventCard> Phase(EventCard[] cards, MissionPhase phase) =>
            cards.Where(e => string.Equals(e.phase, phase.ToString(), StringComparison.OrdinalIgnoreCase));

        // Names the decisions that made this card more likely. The advice is given only when one of them held;
        // otherwise the card was bad luck, and the lesson says so instead of blaming precautions the team took.
        static TimelineEntry Fire(MissionRun run, MissionCatalog catalog, EventCard card, HashSet<string> conditions, float month)
        {
            var reasons = (card.modifiers ?? new EventModifier[0]).Where(m => conditions.Contains(m.condition))
                .Select(m => MissionCatalog.Find(catalog.conditions, m.condition)?.name ?? m.condition).ToList();
            string explanation = card.description;
            if (reasons.Count > 0)
            {
                explanation += " More likely because " + string.Join(" and ", reasons) + ".";
                run.lessons.Add(card.mitigation);
            }
            else if (card.modifiers != null && card.modifiers.Length > 0)
                run.lessons.Add(card.name + " was bad luck: the design already did what lowers this risk, and it can still happen.");
            else
                run.lessons.Add(card.name + " was bad luck: it can happen to any mission.");
            var e = Add(run, month, (MissionPhase)Enum.Parse(typeof(MissionPhase), card.phase, true), card.id, card.name, explanation);
            e.delayMonths = card.delayMonths;
            e.extraCostUsd = card.costUsd;
            return e;
        }

        static MissionRun Stop(MissionRun run, float month, string reason, string title, string why, MissionPhase phase = MissionPhase.Delivery)
        {
            Add(run, month, phase, "stopped:" + reason, title, why);
            run.outcome = MissionOutcome.StoppedBeforeLaunch;
            run.launchMonth = -1f;
            return run;
        }

        static MissionRun Lose(MissionRun run, float month, float scienceSoFar)
        {
            run.scienceReturned = scienceSoFar;
            run.outcome = MissionOutcome.Lost;
            Add(run, month, MissionPhase.End, "end", "Mission lost",
                MissionEvaluator.Inv($"Contact with the satellite was lost. It returned {scienceSoFar:0} of the {run.scienceNeeded:0} science points needed."));
            return run;
        }

        static TimelineEntry Add(MissionRun run, float month, MissionPhase phase, string code, string title, string explanation)
        {
            var e = new TimelineEntry { month = month, phase = phase, code = code, title = title, explanation = explanation };
            run.timeline.Add(e);
            return e;
        }
    }
}
