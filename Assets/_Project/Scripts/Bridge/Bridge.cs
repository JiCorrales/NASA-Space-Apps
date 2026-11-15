using System;
using SpaceApps.Mission;
using UnityEngine;
#if UNITY_WEBGL && !UNITY_EDITOR
using System.Runtime.InteropServices;
#endif

namespace SpaceApps.Bridging
{
    /// <summary>
    /// The Unity end of the bridge in docs/bridge.md. The page calls
    /// <c>unityInstance.SendMessage("Bridge", "Receive", json)</c>, so the object is named "Bridge". The ship
    /// talks to it through <see cref="OpenScreen"/>, <see cref="ScreenRequested"/> and <see cref="CloseRequested"/>.
    /// </summary>
    public sealed class Bridge : MonoBehaviour
    {
        public const string ObjectName = "Bridge";

        public static Bridge Instance { get; private set; }

        BridgeCore core;

        public EarthWatchSession Session => core.Session;

        /// <summary>Raised by <see cref="OpenScreen"/> with the step to show (goals, concept, requirements, design, build, fly).</summary>
        public event Action<string> ScreenRequested { add => core.ScreenRequested += value; remove => core.ScreenRequested -= value; }
        /// <summary>Raised when the page sends <c>close</c> (Escape or "back to the ship").</summary>
        public event Action CloseRequested { add => core.CloseRequested += value; remove => core.CloseRequested -= value; }
        /// <summary>Every message sent to the page, as JSON. For editor tools and tests; the page gets them through the plugin.</summary>
        public event Action<string> Sent;

        // Creates the object when no scene has one, so SendMessage always finds it.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Ensure()
        {
            if (Instance == null) DontDestroyOnLoad(new GameObject(ObjectName, typeof(Bridge)));
        }

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            gameObject.name = ObjectName;
            core = new BridgeCore(new EarthWatchSession(MissionCatalog.Load()) { SeedBase = Environment.TickCount }, ToPage);
        }

        void OnDestroy() { if (Instance == this) Instance = null; }

        void Update() => core.Update(Time.deltaTime);

        /// <summary>Called by the page through SendMessage. One JSON message in the form { "type", "payload" }.</summary>
        public void Receive(string json) => core.Receive(json);

        /// <summary>The ship calls this when the player clicks a cover.</summary>
        public void OpenScreen(string step) => core.OpenScreen(step);

        /// <summary>The ship calls this when it unlocks the view.</summary>
        public void CloseScreen() => core.CloseScreen();

        void ToPage(string json)
        {
            Sent?.Invoke(json);
            Native.Send(json);
        }

        static class Native
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            [DllImport("__Internal")] static extern void MissionUI_Receive(string json);
            public static void Send(string json) => MissionUI_Receive(json);
#else
            // Anywhere but a WebGL player there is no page to tell.
            public static void Send(string json) { }
#endif
        }
    }
}
