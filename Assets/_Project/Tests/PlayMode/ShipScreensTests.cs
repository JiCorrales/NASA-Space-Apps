using System.Collections;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Ship;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.LowLevel;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>The round control room, its six covers and the view lock, driven through virtual Input System devices.</summary>
    public sealed class ShipScreensTests
    {
        static readonly string[] Steps = { "goals", "concept", "requirements", "design", "build", "fly" };

        ShipScreens screens;
        DesktopRig rig;
        Mouse mouse;
        Keyboard keyboard;
        InputSettings.BackgroundBehavior oldBackground;
        InputSettings.EditorInputBehaviorInPlayMode oldEditorBehaviour;
        readonly List<string> activated = new List<string>();

        [UnitySetUp]
        public IEnumerator LoadShip()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            var settings = InputSystem.settings;
            oldBackground = settings.backgroundBehavior;
            oldEditorBehaviour = settings.editorInputBehaviorInPlayMode;
            settings.backgroundBehavior = InputSettings.BackgroundBehavior.IgnoreFocus;
            settings.editorInputBehaviorInPlayMode = InputSettings.EditorInputBehaviorInPlayMode.AllDeviceInputAlwaysGoesToGameView;
            mouse = InputSystem.AddDevice<Mouse>();
            keyboard = InputSystem.AddDevice<Keyboard>();
            mouse.MakeCurrent();
            keyboard.MakeCurrent();
            screens = Object.FindFirstObjectByType<ShipScreens>();
            rig = Object.FindFirstObjectByType<DesktopRig>();
            activated.Clear();
            screens.CoverActivated += activated.Add;
        }

        [TearDown]
        public void RemoveDevices()
        {
            InputSystem.RemoveDevice(mouse);
            InputSystem.RemoveDevice(keyboard);
            InputSystem.settings.backgroundBehavior = oldBackground;
            InputSystem.settings.editorInputBehaviorInPlayMode = oldEditorBehaviour;
        }

        Vector2 ScreenPointOf(ShipCover cover) => Camera.main.WorldToScreenPoint(cover.transform.position);

        /// <summary>A real left click through the mouse device: move, press, release.</summary>
        IEnumerator LeftClick(Vector2 at)
        {
            InputSystem.QueueStateEvent(mouse, new MouseState { position = at });
            yield return null;
            InputSystem.QueueStateEvent(mouse, new MouseState { position = at }.WithButton(MouseButton.Left));
            yield return null;
            InputSystem.QueueStateEvent(mouse, new MouseState { position = at });
            yield return null;
        }

        IEnumerator Hold(Key key, int frames)
        {
            InputSystem.QueueStateEvent(keyboard, new KeyboardState(key));
            for (int i = 0; i < frames; i++) yield return null;
            InputSystem.QueueStateEvent(keyboard, new KeyboardState());
            yield return null;
        }

        [Test]
        public void TheRoundRoomLoadsWithTheBridgeFacingApi()
        {
            Assert.AreEqual("Ship", SceneManager.GetActiveScene().name);
            Assert.IsNotNull(GameObject.Find("Control Room"), "the round room");
            Assert.IsNotNull(screens, "ShipScreens is in the scene");
            Assert.AreSame(screens, ShipScreens.Current);
            Assert.IsFalse(screens.ViewLocked);
            Assert.IsNull(GameObject.Find("Ship Interior"), "the old corridor is gone");
            Assert.IsEmpty(Object.FindObjectsByType<SpaceApps.UI.StationScreen>(FindObjectsSortMode.None), "the old station screens are gone");
            Assert.IsEmpty(Object.FindObjectsByType<SpaceApps.UI.ResourceDashboard>(FindObjectsSortMode.None), "the old dashboards are gone");
        }

        [Test]
        public void ThereAreSixCoversInStepOrderLeftToRight()
        {
            CollectionAssert.AreEqual(Steps, ShipScreens.Steps);
            CollectionAssert.AreEqual(Steps, screens.Covers.Select(c => c.step).ToArray());
            CollectionAssert.AreEqual(new[] { 1, 2, 3, 4, 5, 6 }, screens.Covers.Select(c => c.number).ToArray());
            // Left to right as the player sees them from the spawn point, and all of them in view.
            var cam = Camera.main;
            var xs = screens.Covers.Select(c => cam.WorldToViewportPoint(c.transform.position)).ToArray();
            for (int i = 0; i < xs.Length; i++)
            {
                Assert.Greater(xs[i].z, 0f, $"{Steps[i]} is in front of the player");
                Assert.That(xs[i].x, Is.InRange(0.02f, 0.98f), $"{Steps[i]} is on screen from the spawn point");
                if (i > 0) Assert.Greater(xs[i].x, xs[i - 1].x, $"{Steps[i]} is right of {Steps[i - 1]}");
            }
        }

        [Test]
        public void TheFirstRunOpensOnlyTheFirstStep()
        {
            CollectionAssert.AreEqual(new[] { "open", "locked", "locked", "locked", "locked", "locked" },
                screens.Covers.Select(c => c.Status).ToArray());
        }

        [Test]
        public void EveryCoverIsInClearViewAndReadableFromTheSpawnPoint()
        {
            var eye = Camera.main.transform.position;
            foreach (var cover in screens.Covers)
            {
                // Nothing between the eye and the middle of the cover's number or of its state bar.
                foreach (var part in new Component[] { cover.numberText, cover.stateText })
                {
                    var to = part.transform.position - eye;
                    Assert.IsTrue(Physics.Raycast(eye, to.normalized, out var hit, to.magnitude + 0.2f, Physics.DefaultRaycastLayers, QueryTriggerInteraction.Collide),
                        $"{cover.step}: the ray hits nothing");
                    Assert.AreSame(cover, hit.collider.GetComponentInParent<ShipCover>(), $"{cover.step}: {hit.collider.name} is in the way of the {part.name}");
                }
                float distance = Vector3.Distance(eye, cover.transform.position);
                foreach (var text in new TMP_Text[] { cover.numberText, cover.nameText, cover.stateText })
                {
                    float px = text.enableAutoSizing ? text.fontSizeMin : text.fontSize;
                    float degrees = 2f * Mathf.Atan(px * text.transform.lossyScale.y / 2f / distance) * Mathf.Rad2Deg;
                    // 0.6 degrees is about 10 pt print at reading distance; the number is meant to be seen across the room.
                    Assert.GreaterOrEqual(degrees, text == cover.numberText ? 2.5f : 0.6f, $"{cover.step}/{text.name} is {degrees:0.00} degrees tall");
                    text.ForceMeshUpdate();
                    Assert.IsFalse(text.isTextTruncated, $"{cover.step}/{text.name} is cut off");
                    Assert.IsFalse(text.isTextOverflowing, $"{cover.step}/{text.name} overflows");
                }
            }
        }

        [UnityTest]
        public IEnumerator ClickingAnOpenCoverRaisesItsStepAndLocksTheView()
        {
            var goals = screens.Cover("goals");
            yield return LeftClick(ScreenPointOf(goals));
            CollectionAssert.AreEqual(new[] { "goals" }, activated);
            Assert.IsTrue(screens.ViewLocked);
            Assert.AreEqual("goals", screens.ActiveStep);
            Assert.IsTrue(rig.InputLocked);
            Assert.AreEqual(CursorLockMode.None, Cursor.lockState, "the cursor is free for the web page");

            // While locked: W does not walk, E does not turn, and a second click opens nothing.
            var position = rig.transform.position;
            float yaw = rig.transform.eulerAngles.y;
            yield return Hold(Key.W, 15);
            yield return Hold(Key.E, 10);
            Assert.AreEqual(position.z, rig.transform.position.z, 0.001f, "no walking while the view is locked");
            Assert.AreEqual(yaw, rig.transform.eulerAngles.y, 0.01f, "no turning while the view is locked");
            screens.SetCoverStatus("concept", "open");
            yield return LeftClick(ScreenPointOf(screens.Cover("concept")));
            Assert.AreEqual(1, activated.Count, "clicks do nothing while the view is locked");
        }

        [UnityTest]
        public IEnumerator DoneAndProblemCoversOpenToo()
        {
            screens.SetCoverStatus("goals", "done");
            yield return LeftClick(ScreenPointOf(screens.Cover("goals")));
            screens.ReleaseView();
            screens.SetCoverStatus("design", "problem");
            yield return LeftClick(ScreenPointOf(screens.Cover("design")));
            CollectionAssert.AreEqual(new[] { "goals", "design" }, activated);
        }

        [UnityTest]
        public IEnumerator ALockedCoverDoesNothing()
        {
            var requirements = screens.Cover("requirements");
            Assert.AreEqual("locked", requirements.Status);
            var position = rig.transform.position;
            yield return LeftClick(ScreenPointOf(requirements));
            Assert.IsEmpty(activated);
            Assert.IsFalse(screens.ViewLocked);
            Assert.IsFalse(rig.InputLocked);
            Assert.IsFalse(screens.Activate(requirements), "not even when activated from code");
            // Compared on the floor plane: when this test runs before the rig has settled on the deck, its height
            // still changes by a couple of centimetres during the click, which is gravity, not the player walking.
            var after = rig.transform.position;
            Assert.AreEqual(new Vector2(position.x, position.z), new Vector2(after.x, after.z), "the player did not move");
        }

        [UnityTest]
        public IEnumerator ReleaseViewRestoresMovementAndLook()
        {
            yield return LeftClick(ScreenPointOf(screens.Cover("goals")));
            Assume.That(screens.ViewLocked);
            int released = 0;
            screens.ViewReleased += () => released++;
            screens.ReleaseView();
            Assert.IsFalse(screens.ViewLocked);
            Assert.IsNull(screens.ActiveStep);
            Assert.IsFalse(rig.InputLocked);
            Assert.AreEqual(1, released);

            float z = rig.transform.position.z, yaw = rig.transform.eulerAngles.y;
            yield return Hold(Key.W, 20);
            Assert.Greater(rig.transform.position.z, z + 0.05f, "W walks again");
            yield return Hold(Key.E, 10);
            Assert.Greater(Mathf.DeltaAngle(yaw, rig.transform.eulerAngles.y), 0.5f, "E turns again");

            screens.ReleaseView();
            Assert.AreEqual(1, released, "releasing twice raises the event once");
        }

        [UnityTest]
        public IEnumerator EscapeReleasesTheView()
        {
            yield return LeftClick(ScreenPointOf(screens.Cover("goals")));
            Assume.That(screens.ViewLocked);
            yield return Hold(Key.Escape, 2);
            Assert.IsFalse(screens.ViewLocked);
            Assert.IsFalse(rig.InputLocked);
        }

        [Test]
        public void SetCoverStatusChangesWhatTheCoverShows()
        {
            var cover = screens.Cover("build");
            Assert.AreEqual("5", cover.numberText.text);
            Assert.AreEqual("Build and verify", cover.nameText.text);
            Assert.AreEqual("LOCKED", cover.stateText.text);
            Assert.AreEqual(ShipCover.LockedColor, cover.border.color);

            var expected = new Dictionary<string, (string label, Color color)>
            {
                { "open", ("OPEN", ShipCover.OpenColor) },
                { "done", ("DONE", ShipCover.DoneColor) },
                { "problem", ("PROBLEM", ShipCover.ProblemColor) },
                { "locked", ("LOCKED", ShipCover.LockedColor) },
            };
            foreach (var pair in expected)
            {
                screens.SetCoverStatus("build", pair.Key);
                Assert.AreEqual(pair.Key, cover.Status);
                Assert.AreEqual(pair.Value.label, cover.stateText.text, pair.Key);
                Assert.AreEqual(pair.Value.color, cover.numberText.color, pair.Key);
                Assert.AreEqual(pair.Value.color, cover.stateBar.color, pair.Key);
                Assert.AreEqual(pair.Value.color, cover.border.color, pair.Key);
            }

            LogAssert.Expect(LogType.Warning, "[ShipScreens] Unknown status 'broken' for step 'build'.");
            screens.SetCoverStatus("build", "broken");
            Assert.AreEqual("locked", cover.Status, "an unknown state changes nothing");
            LogAssert.Expect(LogType.Warning, "[ShipScreens] No cover for step 'nope'.");
            screens.SetCoverStatus("nope", "open");
        }

        [Test]
        public void TheWindowsBehindOpenOntoTheEarthAndStars()
        {
            var eye = Camera.main.transform.position;
            // From the spawn point, turned round: through the windows behind, nothing of the ship in the way.
            var back = Physics.RaycastAll(eye, Vector3.back, 100f);
            Assert.IsEmpty(back, "the window behind the spawn point is blocked by " + string.Join(", ", back.Select(h => h.collider.name)));
            var earth = GameObject.Find("Space Outside/Earth").GetComponent<Renderer>().bounds;
            var toLimb = (earth.center + Vector3.up * earth.extents.y * 0.98f) - eye;
            Assert.Less(Vector3.Angle(Vector3.back, new Vector3(toLimb.x, 0f, toLimb.z)), 80f, "the Earth is behind the player, outside the windows");
        }

        [Test]
        public void TheRoomIsLitTheSameWayAtEveryQualityLevel()
        {
            var lights = Object.FindObjectsByType<Light>(FindObjectsSortMode.None).Where(l => l.isActiveAndEnabled).ToArray();
            Assert.IsEmpty(lights.Where(l => l.type != LightType.Directional && l.gameObject.scene == SceneManager.GetActiveScene()
                && !l.transform.IsChildOf(Object.FindFirstObjectByType<RigSelector>().xrRig.transform)),
                "no point or spot lights: the browser quality level does not draw additional lights");
            Assert.AreEqual(1, lights.Count(l => l.type == LightType.Directional), "one key light");
            Assert.AreEqual(UnityEngine.Rendering.AmbientMode.Trilight, RenderSettings.ambientMode);
        }
    }
}
