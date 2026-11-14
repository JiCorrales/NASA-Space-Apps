using System;
using System.Collections.Generic;

namespace SpaceApps.UI
{
    /// <summary>One labelled number on an option card, already formatted ("Mass", "1.2 kg").</summary>
    public readonly struct StatValue
    {
        public readonly string Label;
        public readonly string Value;
        public StatValue(string label, string value) { Label = label; Value = value; }
    }

    /// <summary>One choice a station offers.</summary>
    public sealed class StationOption
    {
        public readonly string Name;
        public readonly string Description;
        public readonly IReadOnlyList<StatValue> Stats;
        /// <summary>Where the numbers come from, shown under the option. May be empty.</summary>
        public readonly string Source;
        public readonly bool Selected;

        public StationOption(string name, string description, IReadOnlyList<StatValue> stats, string source, bool selected)
        {
            Name = name;
            Description = description;
            Stats = stats ?? Array.Empty<StatValue>();
            Source = source ?? "";
            Selected = selected;
        }
    }

    /// <summary>
    /// What a station screen shows and what it can do. A station has one or more steps (tabs); the options
    /// belong to the current step. Select picks an option, or toggles it when the step is multi-select.
    /// </summary>
    public interface IStationViewModel
    {
        string Title { get; }
        string Explanation { get; }

        /// <summary>Step names; one or zero steps hides the tabs.</summary>
        IReadOnlyList<string> Steps { get; }
        int StepIndex { get; }
        /// <summary>Options of the current step; empty for read-only stations.</summary>
        IReadOnlyList<StationOption> Options { get; }
        bool MultiSelect { get; }
        /// <summary>Free text shown when there are no options (rich text allowed).</summary>
        string Details { get; }
        /// <summary>Footer line: what is chosen, or why it is a problem.</summary>
        string Status { get; }
        bool StatusIsProblem { get; }
        /// <summary>Label of the action button; null hides it.</summary>
        string ActionLabel { get; }

        /// <summary>Raised whenever anything above changes; the screen redraws.</summary>
        event Action Changed;

        void SelectStep(int index);
        void Select(int index);
        void Act();
    }

    /// <summary>One resource row: used versus available.</summary>
    public readonly struct ResourceStatus
    {
        public readonly string Name;
        public readonly string Unit;
        public readonly float Used;
        public readonly float Available;
        /// <summary>False while no choice sets the limit yet; such a row is neutral, never over the limit.</summary>
        public readonly bool LimitSet;
        public bool IsOverLimit => LimitSet && Used > Available;

        public ResourceStatus(string name, string unit, float used, float available, bool limitSet = true)
        {
            Name = name; Unit = unit; Used = used; Available = available; LimitSet = limitSet;
        }
    }

    /// <summary>What the resource dashboard shows.</summary>
    public interface IResourceDashboardViewModel
    {
        IReadOnlyList<ResourceStatus> Resources { get; }
        /// <summary>One line under the rows, such as what is still to choose. May be empty.</summary>
        string Note { get; }
        event Action Changed;
    }
}
