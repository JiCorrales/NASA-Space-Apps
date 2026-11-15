using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Ship;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.XR;

namespace SpaceApps.Tests.PlayMode
{
    public sealed class ShipSceneTests
    {
        [UnitySetUp]
        public IEnumerator LoadShip()
        {
            SceneManager.LoadScene("Ship");
            yield return null; // Awake/Start run
            yield return null;
        }

        static T Find<T>() where T : UnityEngine.Object => UnityEngine.Object.FindFirstObjectByType<T>();

        [Test]
        public void ShipSceneIsLoaded()
        {
            Assert.AreEqual("Ship", SceneManager.GetActiveScene().name);
            Assert.AreEqual(0, SceneUtility.GetBuildIndexByScenePath("Assets/_Project/Scenes/Ship.unity"), "Ship must be the first build scene");
        }

        [Test]
        public void DesktopRigIsActiveWithoutXrDevice()
        {
            Assume.That(XRSettings.isDeviceActive, Is.False, "an XR device is active on this machine");
            var selector = Find<RigSelector>();
            Assert.IsTrue(selector.desktopRig.activeInHierarchy);
            Assert.IsFalse(selector.xrRig.activeInHierarchy);
            Assert.AreEqual(selector.desktopRig.GetComponentInChildren<Camera>(), Camera.main);
        }

        // One of each, in both modes: a second listener, camera or EventSystem is a classic VR template mix-up.
        [UnityTest]
        public IEnumerator ExactlyOneListenerCameraAndEventSystemInEitherMode([Values(false, true)] bool xr)
        {
            Find<RigSelector>().Apply(xr);
            yield return null;
            Assert.AreEqual(1, UnityEngine.Object.FindObjectsByType<AudioListener>(FindObjectsSortMode.None).Count(l => l.isActiveAndEnabled), "audio listeners");
            Assert.AreEqual(1, UnityEngine.Object.FindObjectsByType<EventSystem>(FindObjectsSortMode.None).Count(e => e.isActiveAndEnabled), "event systems");
            Assert.AreEqual(1, UnityEngine.Object.FindObjectsByType<Camera>(FindObjectsSortMode.None).Count(c => c.isActiveAndEnabled && c.CompareTag("MainCamera")), "main cameras");
        }

        [UnityTest]
        public IEnumerator MovingInputMovesTheRig()
        {
            var rig = Find<DesktopRig>();
            var start = rig.transform.position;
            for (int i = 0; i < 20; i++) { rig.Move(Vector2.up, 0.05f); yield return null; }
            Assert.Greater(rig.transform.position.z - start.z, 1f);
        }

        [UnityTest]
        public IEnumerator TheRoundWallStopsTheRig()
        {
            var rig = Find<DesktopRig>();
            float radius = rig.GetComponent<CharacterController>().radius;
            float wallInside = GameObject.Find("Wall").GetComponentsInChildren<Collider>()
                .Min(c => new Vector2(c.bounds.center.x, c.bounds.center.z).magnitude) - 0.1f;
            float Out() => new Vector2(rig.transform.position.x, rig.transform.position.z).magnitude;

            for (int i = 0; i < 100; i++) { rig.Move(Vector2.right, 0.1f); yield return null; }
            Assert.LessOrEqual(Out() + radius, wallInside + 0.1f, "through the side wall");
            Assert.Greater(Out() + radius, wallInside - 0.5f, "rig never reached the wall");

            // Back towards the windows: the sills hold the player in too.
            for (int i = 0; i < 100; i++) { rig.Move(Vector2.down, 0.1f); yield return null; }
            Assert.LessOrEqual(Out() + radius, wallInside + 0.1f, "through the windows");
        }
    }
}
