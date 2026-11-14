using System.Linq;
using SpaceApps.Mission;
using SpaceApps.Ship;
using SpaceApps.UI;
using UnityEngine;

namespace SpaceApps.Game
{
    /// <summary>Owns the mission session and binds every station screen and dashboard in the scene to it.</summary>
    public sealed class MissionGame : MonoBehaviour
    {
        public const string WelcomeTitle = "Welcome aboard, mission designer";
        public const string WelcomeBody =
            "You are planning a real CubeSat mission with numbers from NASA. Walk along the ship: each numbered screen " +
            "makes one decision, and the panels beside them show the mass, power, money, data, contact time and schedule it uses.\n" +
            "<b>Goal:</b> reach screen 8, Mission Control, with a design that can fly, then launch it and see what science comes home.";
        public const string DesktopControls =
            "<b>W A S D</b> or arrows: walk     <b>Q / E</b>: turn     <b>Hold the right mouse button</b> and move: look\n<b>Left click</b>: choose on a screen";
        public const string VrControls =
            "<b>Left stick</b>: walk     <b>Right stick</b>: turn, or push it forward to aim a teleport and let go\n" +
            "<b>Point at a screen and pull the trigger</b>: choose";

        public MissionSession Session { get; private set; }
        public MissionFlight Flight { get; private set; }

        void Awake()
        {
            Session = new MissionSession(MissionCatalog.Load());
            Flight = new MissionFlight(Session, Random.Range(1, int.MaxValue / 2));
        }

        void Update() => Flight.Tick(Time.deltaTime);

        void Start()
        {
            var selector = FindFirstObjectByType<RigSelector>();
            var sign = FindFirstObjectByType<WelcomeSign>();
            if (selector != null && sign != null)
            {
                ShowWelcome(sign, selector.XrActive);
                selector.RigChanged += xr => ShowWelcome(sign, xr);
            }

            var dashboard = new DashboardViewModel(Session);
            foreach (var d in FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None)) d.Bind(dashboard);

            foreach (var screen in FindObjectsByType<StationScreen>(FindObjectsSortMode.None))
            {
                var vm = CreateStation(screen.stationTitle, screen.explanation);
                if (vm == null) Debug.LogWarning($"[MissionGame] No station logic for '{screen.stationTitle}'; it keeps its placeholder.");
                else screen.Bind(vm);
            }
        }

        static void ShowWelcome(WelcomeSign sign, bool xr) => sign.Show(WelcomeTitle, WelcomeBody, xr ? VrControls : DesktopControls);

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
            "Mission Control" => new MissionControlStation(Session, Flight, title, explanation),
            _ => null,
        };
    }
}
