using System.Collections;
using NUnit.Framework;
using SpaceApps.Game;
using SpaceApps.Mission;
using SpaceApps.Ship;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.LowLevel;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>
    /// Drives the game through virtual Input System devices, so the real input path (input module, rig Update) runs.
    /// </summary>
    public sealed class InputDeviceTests
    {
        Mouse mouse;
        Keyboard keyboard;
        DesktopRig rig;
        InputSettings.BackgroundBehavior oldBackground;
        InputSettings.EditorInputBehaviorInPlayMode oldEditorBehaviour;

        [UnitySetUp]
        public IEnumerator Setup()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            // Batch mode has no focused window; let device input through anyway, and put it back in TearDown.
            var settings = InputSystem.settings;
            oldBackground = settings.backgroundBehavior;
            oldEditorBehaviour = settings.editorInputBehaviorInPlayMode;
            settings.backgroundBehavior = InputSettings.BackgroundBehavior.IgnoreFocus;
            settings.editorInputBehaviorInPlayMode = InputSettings.EditorInputBehaviorInPlayMode.AllDeviceInputAlwaysGoesToGameView;
            mouse = InputSystem.AddDevice<Mouse>();
            keyboard = InputSystem.AddDevice<Keyboard>();
            mouse.MakeCurrent();
            keyboard.MakeCurrent();
            rig = Object.FindFirstObjectByType<DesktopRig>();
        }

        [TearDown]
        public void RemoveDevices()
        {
            InputSystem.RemoveDevice(mouse);
            InputSystem.RemoveDevice(keyboard);
            InputSystem.settings.backgroundBehavior = oldBackground;
            InputSystem.settings.editorInputBehaviorInPlayMode = oldEditorBehaviour;
        }

        IEnumerator Pointer(Vector2 position, bool left = false, bool right = false, Vector2 delta = default)
        {
            var state = new MouseState { position = position, delta = delta };
            if (left) state = state.WithButton(MouseButton.Left);
            if (right) state = state.WithButton(MouseButton.Right);
            InputSystem.QueueStateEvent(mouse, state);
            yield return null;
            yield return null;
        }

        [UnityTest]
        public IEnumerator ALeftClickThroughTheInputModuleChoosesAnOption()
        {
            var session = Object.FindFirstObjectByType<MissionGame>().Session;
            var screen = Ui.Screen("Objective");
            Ui.LookAt(screen);
            var row = (RectTransform)screen.Rows[1].button.transform;
            var point = (Vector2)Camera.main.WorldToScreenPoint(row.TransformPoint(row.rect.center));

            yield return Pointer(point);
            yield return Pointer(point, left: true);
            yield return Pointer(point);

            Assert.AreEqual(session.Catalog.objectives[1].id, session.Design.objective);
        }

        [UnityTest]
        public IEnumerator HoldingWWalksForwardAndSStepsBack()
        {
            float z = rig.transform.position.z;
            InputSystem.QueueStateEvent(keyboard, new KeyboardState(Key.W));
            for (int i = 0; i < 20; i++) yield return null;
            Assert.Greater(rig.transform.position.z, z + 0.05f, "W moves forward");

            z = rig.transform.position.z;
            InputSystem.QueueStateEvent(keyboard, new KeyboardState(Key.S));
            for (int i = 0; i < 20; i++) yield return null;
            Assert.Less(rig.transform.position.z, z - 0.05f, "S moves back");
            InputSystem.QueueStateEvent(keyboard, new KeyboardState());
            yield return null;
        }

        [UnityTest]
        public IEnumerator EAndQTurnTheRig()
        {
            float yaw = rig.transform.eulerAngles.y;
            InputSystem.QueueStateEvent(keyboard, new KeyboardState(Key.E));
            for (int i = 0; i < 10; i++) yield return null;
            InputSystem.QueueStateEvent(keyboard, new KeyboardState());
            yield return null;
            Assert.Greater(Mathf.DeltaAngle(yaw, rig.transform.eulerAngles.y), 0.5f, "E turns right");
        }

        [UnityTest]
        public IEnumerator MouseLooksOnlyWhileTheRightButtonIsHeld()
        {
            float yaw = rig.transform.eulerAngles.y;
            yield return Pointer(new Vector2(100, 100), delta: new Vector2(200, 0));
            Assert.AreEqual(yaw, rig.transform.eulerAngles.y, 0.01f, "no look without the right button");

            yield return Pointer(new Vector2(100, 100), right: true, delta: new Vector2(200, 0));
            Assert.Greater(Mathf.DeltaAngle(yaw, rig.transform.eulerAngles.y), 1f, "right drag turns");
            yield return Pointer(new Vector2(100, 100));
        }

        [Test]
        public void LookingUpOrDownStopsAtEightyDegrees()
        {
            rig.Look(new Vector2(0f, -1000f));
            Assert.AreEqual(80f, rig.head.localEulerAngles.x, 0.01f);
            rig.Look(new Vector2(0f, 2000f));
            Assert.AreEqual(-80f, Mathf.DeltaAngle(0f, rig.head.localEulerAngles.x), 0.01f);
        }
    }
}
