using System;
using System.Collections.Generic;
using SpaceApps.Mission;

namespace SpaceApps.Game
{
    public enum FlightState { Review, Playing, Finished }

    /// <summary>
    /// Flies the session's design with the simulator and plays the timeline back one entry at a time.
    /// Any change to the design sends it back to Review.
    /// </summary>
    public sealed class MissionFlight
    {
        public const float SecondsPerEntry = 3f;

        readonly MissionSession session;
        int nextSeed;
        float timer;

        public FlightState State { get; private set; } = FlightState.Review;
        public MissionRun Run { get; private set; }
        public int Seed => Run?.seed ?? -1;
        /// <summary>How many timeline entries the player has seen so far.</summary>
        public int Shown { get; private set; }
        public IEnumerable<TimelineEntry> ShownEntries => Run == null ? Array.Empty<TimelineEntry>() : Run.timeline.GetRange(0, Shown);
        public event Action Changed;

        public MissionFlight(MissionSession session, int firstSeed)
        {
            this.session = session;
            nextSeed = firstSeed;
            session.Changed += () =>
            {
                if (State == FlightState.Review) return;
                State = FlightState.Review;
                Changed?.Invoke();
            };
        }

        public bool CanLaunch => session.Report.success;

        /// <summary>Flies the current design with a new seed (or the given one). False when the design cannot fly.</summary>
        public bool Launch(int? seed = null)
        {
            if (!CanLaunch) return false;
            Run = MissionSimulator.Run(session.Catalog, session.Design.Clone(), seed ?? nextSeed++);
            Shown = 1;
            timer = 0f;
            State = Run.timeline.Count > 1 ? FlightState.Playing : FlightState.Finished;
            Changed?.Invoke();
            return true;
        }

        public void Step()
        {
            if (State != FlightState.Playing) return;
            Shown++;
            timer = 0f;
            if (Shown >= Run.timeline.Count) State = FlightState.Finished;
            Changed?.Invoke();
        }

        public void SkipToEnd()
        {
            if (State != FlightState.Playing) return;
            Shown = Run.timeline.Count;
            State = FlightState.Finished;
            Changed?.Invoke();
        }

        public void BackToDesign()
        {
            State = FlightState.Review;
            Changed?.Invoke();
        }

        /// <summary>Advances the playback at a readable pace; call every frame.</summary>
        public void Tick(float deltaSeconds)
        {
            if (State != FlightState.Playing) return;
            timer += deltaSeconds;
            if (timer >= SecondsPerEntry) Step();
        }
    }
}
