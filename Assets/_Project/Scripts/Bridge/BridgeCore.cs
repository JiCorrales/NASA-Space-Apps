using System;
using SpaceApps.Mission;
using UnityEngine;

namespace SpaceApps.Bridging
{
    /// <summary>
    /// The bridge without Unity's MonoBehaviour: reads each page-to-Unity message, changes the session, and
    /// writes the Unity-to-page messages through <c>send</c>. Kept apart so EditMode tests can drive it.
    /// </summary>
    public sealed class BridgeCore
    {
        // One flat shape for every page message; JsonUtility fills what the message has and leaves the rest empty.
        [Serializable] class Payload { public string group, id, step, action, name; public float value, fraction; }
        [Serializable] class Incoming { public string type; public Payload payload = new Payload(); }

        readonly Action<string> send;

        public EarthWatchSession Session { get; }

        /// <summary>The ship asked to open a screen (see <see cref="OpenScreen"/>).</summary>
        public event Action<string> ScreenRequested;
        /// <summary>The page sent <c>close</c>: unlock the view.</summary>
        public event Action CloseRequested;

        public BridgeCore(EarthWatchSession session, Action<string> send)
        {
            Session = session; this.send = send;
            session.StateChanged += SendState;
        }

        /// <summary>The ship calls this when the player clicks a cover.</summary>
        public void OpenScreen(string step)
        {
            if (Array.IndexOf(EarthWatchSession.Steps, step) < 0) return;
            ScreenRequested?.Invoke(step);
            send(StateJson.OpenScreenMessage(step));
        }

        /// <summary>The ship calls this when it unlocks the view.</summary>
        public void CloseScreen() => send(StateJson.CloseScreenMessage());

        public void SendState() => send(StateJson.Message(Session.BuildState()));

        void SendFrame(SimFrame frame) { if (frame != null) send(StateJson.Message(frame)); }

        /// <summary>Time passes: advances the flight and sends a frame when a step happened.</summary>
        public void Update(float dt) => SendFrame(Session.Advance(dt));

        /// <summary>One page-to-Unity message, as the JSON string the page sends. Bad input is logged and ignored.</summary>
        public void Receive(string json)
        {
            Incoming m;
            try { m = JsonUtility.FromJson<Incoming>(json); }
            catch (ArgumentException e) { Debug.LogWarning($"Bridge: unreadable message ({e.Message})"); return; }
            if (m == null || string.IsNullOrEmpty(m.type)) { Debug.LogWarning("Bridge: message without a type"); return; }
            var p = m.payload ?? new Payload();

            switch (m.type)
            {
                case "ready":
                    SendState();
                    SendFrame(Session.Frame());
                    break;
                case "choose": Session.Choose(p.group, p.id); break;
                case "toggle": Session.Toggle(p.group, p.id); break;
                case "setRequirement": Session.SetRequirement(p.id, p.value); break;
                case "setReserve": Session.SetReserve(p.fraction); break;
                case "completeStep": Session.CompleteStep(p.step); break;
                case "close": CloseRequested?.Invoke(); break;
                case "fly": SendFrame(Session.Fly(p.action)); break;
                case "command": SendFrame(Session.Command(p.name)); break;
                default: Debug.LogWarning($"Bridge: unknown message type '{m.type}'"); break;
            }
        }
    }
}
