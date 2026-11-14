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

        public StationOption(string name, string description, IReadOnlyList<StatValue> stats)
        {
            Name = name;
            Description = description;
            Stats = stats ?? Array.Empty<StatValue>();
        }
    }

    /// <summary>What a station screen shows and what it can do. The mission model adapts to this.</summary>
    public interface IStationViewModel
    {
        string Title { get; }
        string Explanation { get; }
        IReadOnlyList<StationOption> Options { get; }
        /// <summary>-1 when nothing is selected.</summary>
        int SelectedIndex { get; }
        bool IsConfirmed { get; }

        /// <summary>Raised whenever anything above changes; the screen redraws.</summary>
        event Action Changed;
        /// <summary>Raised by Confirm with the confirmed option index.</summary>
        event Action<int> Confirmed;

        void Select(int index);
        void Confirm();
    }

    /// <summary>One resource row: used versus available.</summary>
    public readonly struct ResourceStatus
    {
        public readonly string Name;
        public readonly string Unit;
        public readonly float Used;
        public readonly float Available;
        public bool IsOverLimit => Used > Available;

        public ResourceStatus(string name, string unit, float used, float available)
        {
            Name = name; Unit = unit; Used = used; Available = available;
        }
    }

    /// <summary>What the resource dashboard shows.</summary>
    public interface IResourceDashboardViewModel
    {
        IReadOnlyList<ResourceStatus> Resources { get; }
        event Action Changed;
    }
}
