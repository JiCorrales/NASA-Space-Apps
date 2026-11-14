using System;
using System.Collections.Generic;
using System.Linq;

namespace SpaceApps.UI
{
    /// <summary>Stand-in content for a screen nothing has bound yet.</summary>
    public sealed class PlaceholderStationViewModel : IStationViewModel
    {
        static readonly string[] Names = { "Option A", "Option B", "Option C" };
        int selected = -1;

        public PlaceholderStationViewModel(string title, string explanation)
        {
            Title = title;
            Explanation = explanation;
        }

        public string Title { get; }
        public string Explanation { get; }
        public IReadOnlyList<string> Steps => Array.Empty<string>();
        public int StepIndex => 0;
        public IReadOnlyList<StationOption> Options =>
            Names.Select((n, i) => new StationOption(n, "Placeholder until the mission is connected.", null, "", i == selected)).ToArray();
        public bool MultiSelect => false;
        public string Details => "";
        public string Status => selected < 0 ? "Select an option" : "Selected: " + Names[selected];
        public bool StatusIsProblem => false;
        public IReadOnlyList<string> Actions => Array.Empty<string>();
        public bool IsDone => selected >= 0;
        public event Action Changed;

        public void SelectStep(int index) { }
        public void Select(int index) { selected = index; Changed?.Invoke(); }
        public void Act(int index) { }
    }

    public sealed class PlaceholderResourceViewModel : IResourceDashboardViewModel
    {
        public IReadOnlyList<ResourceStatus> Resources { get; } = new[]
        {
            new ResourceStatus("Mass", "kg", 3.2f, 4f),
            new ResourceStatus("Power", "W", 6.5f, 5f),
            new ResourceStatus("Budget", "k USD", 420f, 500f),
            new ResourceStatus("Data", "MB/day", 180f, 250f),
            new ResourceStatus("Communications", "min/day", 20f, 30f),
            new ResourceStatus("Time", "months", 14f, 18f),
        };
        public string Note => "Placeholder values";
        public event Action Changed { add { } remove { } }
    }
}
