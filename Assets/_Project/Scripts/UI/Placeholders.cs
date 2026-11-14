using System;
using System.Collections.Generic;

namespace SpaceApps.UI
{
    /// <summary>Stand-in content until the mission model is connected.</summary>
    public sealed class PlaceholderStationViewModel : IStationViewModel
    {
        public string Title { get; }
        public string Explanation { get; }
        public IReadOnlyList<StationOption> Options { get; }
        public int SelectedIndex { get; private set; } = -1;
        public bool IsConfirmed { get; private set; }
        public event Action Changed;
        public event Action<int> Confirmed;

        public PlaceholderStationViewModel(string title, string explanation)
        {
            Title = title;
            Explanation = explanation;
            Options = new[]
            {
                Card("Option A", "Light and cheap, little margin.", "1.0 kg", "2 W", "$40k"),
                Card("Option B", "Balanced choice.", "1.8 kg", "4 W", "$70k"),
                Card("Option C", "Most capable, heavy and costly.", "3.0 kg", "7 W", "$120k"),
            };
        }

        static StationOption Card(string name, string description, string mass, string power, string cost) =>
            new StationOption(name, description + " (placeholder)",
                new[] { new StatValue("Mass", mass), new StatValue("Power", power), new StatValue("Cost", cost) });

        public void Select(int index)
        {
            if (index < 0 || index >= Options.Count) return;
            SelectedIndex = index;
            IsConfirmed = false;
            Changed?.Invoke();
        }

        public void Confirm()
        {
            if (SelectedIndex < 0) return;
            IsConfirmed = true;
            Changed?.Invoke();
            Confirmed?.Invoke(SelectedIndex);
        }
    }

    public sealed class PlaceholderResourceViewModel : IResourceDashboardViewModel
    {
        public IReadOnlyList<ResourceStatus> Resources { get; } = new[]
        {
            new ResourceStatus("Mass", "kg", 3.2f, 4f),
            new ResourceStatus("Power", "W", 6.5f, 5f),
            new ResourceStatus("Budget", "k$", 420f, 500f),
            new ResourceStatus("Data", "MB/day", 180f, 250f),
            new ResourceStatus("Communications", "passes/day", 2f, 3f),
            new ResourceStatus("Time", "months", 14f, 18f),
        };
        public event Action Changed { add { } remove { } }
    }
}
