using System.Linq;
using SpaceApps.Mission;
using SpaceApps.UI;
using UnityEngine;

namespace SpaceApps.Game
{
    /// <summary>Owns the mission session and binds every station screen and dashboard in the scene to it.</summary>
    public sealed class MissionGame : MonoBehaviour
    {
        public MissionSession Session { get; private set; }

        void Awake() => Session = new MissionSession(MissionCatalog.Load());

        void Start()
        {
            var dashboard = new DashboardViewModel(Session);
            foreach (var d in FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None)) d.Bind(dashboard);

            foreach (var screen in FindObjectsByType<StationScreen>(FindObjectsSortMode.None))
            {
                var vm = CreateStation(screen.stationTitle, screen.explanation);
                if (vm == null) Debug.LogWarning($"[MissionGame] No station logic for '{screen.stationTitle}'; it keeps its placeholder.");
                else screen.Bind(vm);
            }
        }

        // ponytail: stations matched by title; switch to an id field if titles start being translated.
        IStationViewModel CreateStation(string title, string explanation) => title switch
        {
            "Objective" => new ChoiceStation(Session, title, explanation, new[] { ChoiceGroup.Objective }),
            "Requirements" => new RequirementsStation(Session, title, explanation),
            "Spacecraft" => new ChoiceStation(Session, title, explanation, new[] { ChoiceGroup.Format, ChoiceGroup.Power },
                "mass-over-format", "volume-over-format", "power-needs-bigger-format", "power-deficit", "battery-eclipse"),
            "Instruments" => new ChoiceStation(Session, title, explanation, new[] { ChoiceGroup.Instruments },
                "missing-instrument", "science-short", "volume-over-format", "data-overflow"),
            "Communications" => new ChoiceStation(Session, title, explanation, new[] { ChoiceGroup.Radio, ChoiceGroup.GroundStation },
                "station-band-mismatch", "data-overflow"),
            "Launch and Orbit" => new ChoiceStation(Session, title, explanation, new[] { ChoiceGroup.Launch, ChoiceGroup.Orbit },
                "mass-over-launcher", "launcher-orbit", "launcher-dispenser", "orbit-objective", "orbit-lifetime"),
            "Build and Test" => new ChoiceStation(Session, title, explanation, new[] { ChoiceGroup.Tests },
                "missing-test", "schedule-overrun"),
            "Mission Control" => new MissionControlStation(Session, title, explanation),
            _ => null,
        };
    }
}
