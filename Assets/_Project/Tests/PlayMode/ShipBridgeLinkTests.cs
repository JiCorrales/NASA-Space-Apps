using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using SpaceApps.Bridging;
using SpaceApps.Ship;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.LowLevel;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>The ship and the page bridge joined by ShipBridgeLink, using a fresh bridge and the real Ship scene.</summary>
    public sealed class ShipBridgeLinkTests
    {
        ShipScreens screens;
        Bridge bridge;
        Keyboard keyboard;
        InputSettings.BackgroundBehavior oldBackground;
        InputSettings.EditorInputBehaviorInPlayMode oldEditorBehaviour;
        readonly List<string> sent = new List<string>();

        [UnitySetUp]
        public IEnumerator LoadShipWithFreshBridge()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            // The bridge keeps its session between tests, so each test gets a new one (made after the scene
            // load, which would destroy it).
            if (Bridge.Instance != null) Object.DestroyImmediate(Bridge.Instance.gameObject);
            bridge = new GameObject(Bridge.ObjectName, typeof(Bridge)).GetComponent<Bridge>();
            yield return null; // ShipBridgeLink binds on its next Update
            screens = ShipScreens.Current;
            sent.Clear();
            bridge.Sent += sent.Add;
            var settings = InputSystem.settings;
            oldBackground = settings.backgroundBehavior;
            oldEditorBehaviour = settings.editorInputBehaviorInPlayMode;
            settings.backgroundBehavior = InputSettings.BackgroundBehavior.IgnoreFocus;
            settings.editorInputBehaviorInPlayMode = InputSettings.EditorInputBehaviorInPlayMode.AllDeviceInputAlwaysGoesToGameView;
            keyboard = InputSystem.AddDevice<Keyboard>();
            keyboard.MakeCurrent();
        }

        [TearDown]
        public void Cleanup()
        {
            InputSystem.RemoveDevice(keyboard);
            InputSystem.settings.backgroundBehavior = oldBackground;
            InputSystem.settings.editorInputBehaviorInPlayMode = oldEditorBehaviour;
            if (bridge != null) Object.DestroyImmediate(bridge.gameObject);
        }

        bool Sent(string type, string contains = "") => sent.Exists(m => m.Contains($"\"type\":\"{type}\"") && m.Contains(contains));

        [Test]
        public void ClickingACoverSendsOpenScreenForItsStep()
        {
            Assert.IsTrue(screens.Activate(screens.Cover("goals")));
            Assert.IsTrue(Sent("openScreen", "\"step\":\"goals\""), string.Join("\n", sent));
        }

        [Test]
        public void ALockedCoverSendsNothing()
        {
            Assert.IsFalse(screens.Activate(screens.Cover("design")));
            Assert.IsEmpty(sent);
        }

        [Test]
        public void ThePageClosingReleasesTheViewAndSendsCloseScreen()
        {
            screens.Activate(screens.Cover("goals"));
            sent.Clear();
            bridge.Receive("{\"type\":\"close\",\"payload\":{}}");
            Assert.IsFalse(screens.ViewLocked);
            Assert.IsTrue(Sent("closeScreen"));
            Assert.AreEqual(1, sent.Count, "one closeScreen, no loop");
        }

        [UnityTest]
        public IEnumerator EscapeInTheEditorReleasesTheViewAndTellsThePage()
        {
            Assert.IsTrue(screens.escapeReleases, "in the editor the ship handles Escape");
            screens.Activate(screens.Cover("goals"));
            sent.Clear();
            InputSystem.QueueStateEvent(keyboard, new KeyboardState(Key.Escape));
            yield return null;
            InputSystem.QueueStateEvent(keyboard, new KeyboardState());
            yield return null;
            Assert.IsFalse(screens.ViewLocked);
            Assert.IsTrue(Sent("closeScreen"));
        }

        [Test]
        public void CoversStartWithTheSessionStatuses()
        {
            Assert.AreEqual("open", screens.Cover("goals").Status);
            Assert.AreEqual("locked", screens.Cover("concept").Status);
        }

        [Test]
        public void CompletingAStepThroughTheBridgeUpdatesTheCovers()
        {
            bridge.Receive("{\"type\":\"completeStep\",\"payload\":{\"step\":\"goals\"}}");
            Assert.AreEqual(bridge.Session.StatusOf("goals"), screens.Cover("goals").Status);
            Assert.AreEqual("open", screens.Cover("concept").Status);
            Assert.AreEqual("locked", screens.Cover("requirements").Status);
            Assert.IsTrue(screens.Cover("goals").Clickable, "a finished step can be reopened");
        }
    }
}
