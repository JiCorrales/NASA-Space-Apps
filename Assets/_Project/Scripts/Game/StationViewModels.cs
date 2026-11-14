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
        public virtual string ActionLabel => null;
        public event Action Changed;

        protected void Redraw() => Changed?.Invoke();
        public virtual void SelectStep(int index) { }
        public virtual void Select(int index) { }
        public virtual void Act() { }
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

    /// <summary>Verdict on the whole design: can it fly, why not, and the score. Resets the design.</summary>
    sealed class MissionControlStation : SessionStation
    {
        public MissionControlStation(MissionSession session, string title, string explanation) : base(session, title, explanation) { }

        public override string Status => Session.Report.success
            ? "<b>Ready to fly.</b> Every constraint is met."
            : $"<b>Cannot fly yet:</b> {Session.Report.issues.Count(i => i.severity == Severity.Blocking)} blocking problem(s).";

        public override bool StatusIsProblem => !Session.Report.success;
        public override string ActionLabel => "Reset design";
        public override void Act() => Session.Reset();

        public override string Details
        {
            get
            {
                var r = Session.Report;
                var sb = new StringBuilder();
                sb.Append(r.success ? "<color=#5fe0a0><b>MISSION CAN FLY</b></color>\n" : "<color=#ff7366><b>MISSION CANNOT FLY</b></color>\n");
                sb.Append($"Science <b>{N(r.science)}</b>     Reliability <b>{Pct(r.reliability)}</b>     Score <b>{r.score}</b>\n\n");
                if (r.issues.Count == 0) sb.Append("No problems found.");
                foreach (var i in r.issues.OrderByDescending(i => i.severity))
                    sb.Append(i.severity == Severity.Blocking ? "<color=#ff7366>Blocking</color>: " : "<color=#ffc857>Warning</color>: ")
                      .Append(i.message).Append('\n');
                return sb.ToString();
            }
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
