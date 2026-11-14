using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SpaceApps.Mission;
using SpaceApps.UI;
using static SpaceApps.Game.Format;

namespace SpaceApps.Game
{
    /// <summary>Shared part of every station bound to the session: redraws whenever the design changes.</summary>
    abstract class SessionStation : IStationViewModel
    {
        protected readonly MissionSession Session;

        protected SessionStation(MissionSession session, string title, string explanation)
        {
            Session = session;
            Title = title;
            Explanation = explanation;
            session.Changed += () => Changed?.Invoke();
        }

        public string Title { get; }
        public string Explanation { get; }
        public virtual IReadOnlyList<string> Steps => Array.Empty<string>();
        public virtual int StepIndex => 0;
        public virtual IReadOnlyList<StationOption> Options => Array.Empty<StationOption>();
        public virtual bool MultiSelect => false;
        public virtual string Details => "";
        public abstract string Status { get; }
        public virtual bool StatusIsProblem => false;
        public virtual IReadOnlyList<string> Actions => Array.Empty<string>();
        public virtual bool IsDone => false;
        public event Action Changed;

        protected void Redraw() => Changed?.Invoke();
        public virtual void SelectStep(int index) { }
        public virtual void Select(int index) { }
        public virtual void Act(int index) { }
    }

    /// <summary>A station where the player makes one or more decisions (one step per decision).</summary>
    sealed class ChoiceStation : SessionStation
    {
        readonly ChoiceGroup[] groups;
        readonly string[] issueCodes;
        int step;

        public ChoiceStation(MissionSession session, string title, string explanation, ChoiceGroup[] groups, params string[] issueCodes)
            : base(session, title, explanation)
        {
            this.groups = groups;
            this.issueCodes = issueCodes;
        }

        ChoiceGroup Group => groups[step];
        Entry[] Entries => Group.Entries(Session.Catalog).ToArray();

        public override IReadOnlyList<string> Steps => groups.Select(g => g.Name).ToArray();
        public override int StepIndex => step;
        public override bool MultiSelect => Group.Multi;

        public override IReadOnlyList<StationOption> Options => Entries.Select(e =>
        {
            var (description, stats, source) = Group.Describe(Session.Catalog, e);
            return new StationOption(e.name, description, stats, source, Group.IsSelected(Session.Design, e.id));
        }).ToArray();

        /// <summary>The evaluator's issues this station can fix, blocking first.</summary>
        public IEnumerable<Issue> Issues => Session.Report.issues
            .Where(i => issueCodes.Contains(i.code))
            .OrderByDescending(i => i.severity);

        public override string Status
        {
            get
            {
                var issues = Issues.ToList();
                if (issues.Count > 0)
                    return issues[0].message + (issues.Count > 1 ? $" (+{issues.Count - 1} more at Mission Control)" : "");
                return string.Join("   ", groups.Select(g => $"{g.Name}: <b>{g.Chosen(Session.Catalog, Session.Design)}</b>"));
            }
        }

        public override bool StatusIsProblem => Issues.Any();

        public override bool IsDone => groups.All(g =>
            g.Multi ? g.List(Session.Design).Count > 0 : !string.IsNullOrEmpty(g.Get(Session.Design)));

        public override void SelectStep(int index)
        {
            if (index < 0 || index >= groups.Length) return;
            step = index;
            Redraw();
        }

        public override void Select(int index)
        {
            var entries = Entries;
            if (index < 0 || index >= entries.Length) return;
            Session.Change(d => Group.Choose(d, entries[index].id));
        }
    }

    /// <summary>Read-only: what the chosen objective demands.</summary>
    sealed class RequirementsStation : SessionStation
    {
        public RequirementsStation(MissionSession session, string title, string explanation) : base(session, title, explanation) { }

        Objective Objective => MissionCatalog.Find(Session.Catalog.objectives, Session.Design.objective);

        public override string Status => Objective == null ? "Choose an objective first, at the Objective station." : "Objective: " + Objective.name;
        public override bool IsDone => Objective != null;

        public override string Details
        {
            get
            {
                var o = Objective;
                if (o == null) return "No objective chosen yet.";
                var c = Session.Catalog;
                var sb = new StringBuilder();
                Line(sb, "Science needed", N(o.minScience) + " points", o.minScience);
                Line(sb, "Budget", Usd(o.budgetUsd), o.budgetUsd);
                Line(sb, "Deadline to reach orbit", N(o.deadlineMonths) + " months", o.deadlineMonths);
                Line(sb, "Time in orbit", N(o.missionMonths) + " months", o.missionMonths);
                Line(sb, "Must measure", string.Join(", ", o.requiredTags), null);
                Line(sb, "Allowed orbits", string.Join(", ", o.allowedOrbits.Select(id => MissionCatalog.Find(c.orbits, id)?.name ?? id)), null);
                Line(sb, "Best orbit", string.Join(", ", o.preferredOrbits.Select(id => MissionCatalog.Find(c.orbits, id)?.name ?? id)) +
                    $" (science x{N(c.constants.preferredOrbitBonus)})", c.constants.preferredOrbitBonus);
                foreach (var l in c.licences)
                    Line(sb, l.name, $"{N(l.months)} months, {Usd(l.costUsd)}" + (l.imagerOnly ? " (only with a camera)" : ""), l.months);
                return sb.ToString();
            }
        }

        static void Line(StringBuilder sb, string label, string value, Num source)
        {
            sb.Append(label).Append(": <b>").Append(value).Append("</b>\n");
            if (source != null && !string.IsNullOrEmpty(source.source))
                sb.Append("<size=70%><color=#93a3b8>   ").Append(Source(source)).Append("</color></size>\n");
        }
    }

    /// <summary>
    /// Verdict on the whole design and its flight: review (can it fly, what blocks it, the risks), playback of the
    /// simulated mission entry by entry, and the outcome with its lessons.
    /// </summary>
    sealed class MissionControlStation : SessionStation
    {
        readonly MissionFlight flight;

        public MissionControlStation(MissionSession session, MissionFlight flight, string title, string explanation)
            : base(session, title, explanation)
        {
            this.flight = flight;
            flight.Changed += Redraw;
        }

        public override bool IsDone => flight.State == FlightState.Finished;
        public override bool StatusIsProblem => flight.State == FlightState.Review && !Session.Report.success;

        public override IReadOnlyList<string> Actions => flight.State switch
        {
            FlightState.Playing => new[] { "Next", "Skip to end" },
            FlightState.Finished => new[] { "Fly again", "Change design", "Reset design" },
            _ => flight.CanLaunch ? new[] { "Launch", "Reset design" } : new[] { "Reset design" },
        };

        public override void Act(int index)
        {
            string action = index >= 0 && index < Actions.Count ? Actions[index] : null;
            switch (action)
            {
                case "Launch":
                case "Fly again": flight.Launch(); break;
                case "Next": flight.Step(); break;
                case "Skip to end": flight.SkipToEnd(); break;
                case "Change design": flight.BackToDesign(); break;
                case "Reset design": Session.Reset(); flight.BackToDesign(); break;
            }
        }

        public override string Status => flight.State switch
        {
            FlightState.Playing => $"In flight: event {flight.Shown} of {flight.Run.timeline.Count}. Next comes on its own, or press Next.",
            FlightState.Finished => "Fly again to see how luck changes the result, or change the design.",
            _ => Session.Report.success
                ? "<b>Ready to fly.</b> Press Launch."
                : $"<b>Cannot fly yet:</b> {Session.Report.issues.Count(i => i.severity == Severity.Blocking)} blocking problem(s).",
        };

        public override string Details => flight.State switch
        {
            FlightState.Playing => Playback(),
            FlightState.Finished => Outcome(),
            _ => Review(),
        };

        string Review()
        {
            var r = Session.Report;
            var sb = new StringBuilder();
            sb.Append(r.success ? "<color=#5fe0a0><b>MISSION CAN FLY</b></color>\n" : "<color=#ff7366><b>MISSION CANNOT FLY</b></color>\n");
            sb.Append($"Science <b>{N(r.science)}</b>     Reliability <b>{Pct(r.reliability)}</b>     Score <b>{r.score}</b>\n\n");
            if (r.issues.Count == 0) sb.Append("No problems found.\n");
            foreach (var i in r.issues.OrderByDescending(i => i.severity))
                sb.Append(i.severity == Severity.Blocking ? "<color=#ff7366>Blocking</color>: " : "<color=#ffc857>Warning</color>: ")
                  .Append(i.message).Append('\n');

            var c = Session.Catalog;
            var risks = (c.events ?? new EventCard[0])
                .Select(e => (card: e, chance: MissionSimulator.EventChance(c, Session.Design, e.id)))
                .OrderByDescending(x => x.chance).Take(5).ToList();
            if (risks.Count > 0)
            {
                sb.Append("\n<b>Biggest risks in flight</b> <size=80%>(optional tests and a budget reserve lower them)</size>\n");
                foreach (var (card, chance) in risks)
                    sb.Append($"<b>{Pct(chance)}</b>  {card.name} <size=80%><color=#93a3b8>({card.phase})</color></size>\n");
            }
            return sb.ToString();
        }

        string Playback()
        {
            var sb = new StringBuilder("<b>MISSION IN PROGRESS</b>\n\n");
            foreach (var e in flight.ShownEntries.Reverse().Take(4).Reverse()) Entry(sb, e);
            return sb.ToString();
        }

        string Outcome()
        {
            var run = flight.Run;
            var sb = new StringBuilder();
            sb.Append(run.outcome switch
            {
                MissionOutcome.FullSuccess => "<color=#5fe0a0><b>MISSION ACCOMPLISHED</b></color>",
                MissionOutcome.Partial => "<color=#ffc857><b>PARTIAL SUCCESS</b></color>",
                MissionOutcome.Lost => "<color=#ff7366><b>MISSION LOST</b></color>",
                _ => "<color=#ff7366><b>NEVER LAUNCHED</b></color>",
            }).Append('\n');
            sb.Append($"Science returned <b>{N(run.scienceReturned)}</b> of {N(run.scienceNeeded)} needed     Score <b>{run.score}</b>     Cost <b>{Usd(run.totalCostUsd)}</b>\n\n");
            var last = run.timeline[run.timeline.Count - 1];
            sb.Append(last.explanation).Append("\n\n");
            var lessons = run.lessons.Where(l => !string.IsNullOrEmpty(l)).Distinct().Take(5).ToList();
            if (lessons.Count > 0)
            {
                sb.Append("<b>Lessons</b>\n");
                foreach (var l in lessons) sb.Append("- ").Append(l).Append('\n');
            }
            return sb.ToString();
        }

        static void Entry(StringBuilder sb, TimelineEntry e)
        {
            sb.Append($"<b>Month {N((float)Math.Round(e.month))}</b>  <color=#93a3b8>{e.phase}</color>  <b>{e.title}</b>\n");
            sb.Append("<size=85%>").Append(e.explanation);
            if (e.delayMonths > 0f) sb.Append($"  <color=#ffc857>+{N(e.delayMonths)} months</color>");
            if (e.extraCostUsd > 0f) sb.Append($"  <color=#ffc857>+{Usd(e.extraCostUsd)}</color>");
            if (e.scienceLost > 0f) sb.Append($"  <color=#ff7366>-{N(e.scienceLost)} science</color>");
            sb.Append("</size>\n\n");
        }
    }

    /// <summary>The six resources of the current report, with budget shown in thousands of dollars.</summary>
    sealed class DashboardViewModel : IResourceDashboardViewModel
    {
        readonly MissionSession session;

        public DashboardViewModel(MissionSession session)
        {
            this.session = session;
            session.Changed += () => Changed?.Invoke();
        }

        // While the design is unfinished, a zero limit means no choice has set it yet, not that it is exceeded.
        public IReadOnlyList<ResourceStatus> Resources
        {
            get
            {
                bool unfinished = session.Report.Has("incomplete-design");
                return session.Report.resources.Select(r =>
                {
                    bool set = !(unfinished && r.available <= 0f);
                    float scale = r.unit == "USD" ? 1000f : 1f;
                    return new ResourceStatus(r.kind.ToString(), r.unit == "USD" ? "k USD" : r.unit, r.used / scale, r.available / scale, set);
                }).ToArray();
            }
        }

        public string Note => session.Report.issues.FirstOrDefault(i => i.code == "incomplete-design")?.message ?? "";

        public event Action Changed;
    }
}
