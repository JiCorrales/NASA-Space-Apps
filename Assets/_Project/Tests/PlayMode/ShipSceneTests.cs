using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Ship;
using SpaceApps.UI;
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

        [Test]
        public void SelectorEnablesOnlyTheXrRigWhenXrIsActive()
        {
            var selector = Find<RigSelector>();
            selector.Apply(true);
            Assert.IsTrue(selector.xrRig.activeSelf);
            Assert.IsFalse(selector.desktopRig.activeSelf);
            selector.Apply(false);
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
        public IEnumerator WallsStopTheRig()
        {
            var rig = Find<DesktopRig>();
            float radius = rig.GetComponent<CharacterController>().radius;
            float wallInside = GameObject.Find("Wall_Right").GetComponent<Collider>().bounds.min.x;
            for (int i = 0; i < 100; i++) { rig.Move(Vector2.right, 0.1f); yield return null; }
            Assert.LessOrEqual(rig.transform.position.x + radius, wallInside + 0.05f);
            Assert.Greater(rig.transform.position.x, wallInside - radius - 0.5f, "rig never reached the wall");

            float backInside = GameObject.Find("Wall_Back").GetComponent<Collider>().bounds.max.z;
            for (int i = 0; i < 100; i++) { rig.Move(Vector2.down, 0.1f); yield return null; }
            Assert.GreaterOrEqual(rig.transform.position.z - radius, backInside - 0.05f);
        }

        [Test]
        public void ThereAreSevenStationScreensInWalkingOrder()
        {
            var titles = UnityEngine.Object.FindObjectsByType<StationScreen>(FindObjectsSortMode.None)
                .OrderBy(s => s.transform.position.z).Select(s => s.ViewModel.Title).ToArray();
            CollectionAssert.AreEqual(new[] { "Objective", "Requirements", "Spacecraft", "Instruments",
                "Launch and Orbit", "Build and Test", "Mission Control" }, titles);
        }

        [UnityTest]
        public IEnumerator SelectingAndConfirmingThroughTheEventSystemRaisesConfirmed()
        {
            var screen = UnityEngine.Object.FindObjectsByType<StationScreen>(FindObjectsSortMode.None)
                .OrderBy(s => s.transform.position.z).First();
            var vm = screen.ViewModel;
            int confirmed = -1;
            vm.Confirmed += i => confirmed = i;

            var cam = Camera.main;
            // Stand 1.6 m in front of the screen, looking at it.
            cam.transform.position = screen.transform.position - screen.transform.forward * 1.6f;
            cam.transform.rotation = Quaternion.LookRotation(screen.transform.forward);
            yield return null;

            Click(screen.Rows[1].button.transform as RectTransform, cam);
            Assert.AreEqual(1, vm.SelectedIndex);
            StringAssert.Contains(vm.Options[1].Name, screen.selectionText.text);

            Click(screen.confirmButton.transform as RectTransform, cam);
            Assert.AreEqual(1, confirmed);
            Assert.IsTrue(vm.IsConfirmed);
        }

        /// <summary>Raycasts the screen point of the target through the EventSystem, then clicks what it hit.</summary>
        static void Click(RectTransform target, Camera cam)
        {
            var screenPoint = (Vector2)cam.WorldToScreenPoint(target.TransformPoint(target.rect.center));
            var data = new PointerEventData(EventSystem.current) { position = screenPoint, button = PointerEventData.InputButton.Left };
            var hits = new List<RaycastResult>();
            EventSystem.current.RaycastAll(data, hits);
            Assert.IsNotEmpty(hits, $"nothing under {target.name} at {screenPoint}");
            Assert.IsTrue(hits[0].gameObject.transform.IsChildOf(target), $"{hits[0].gameObject.name} is in front of {target.name}");
            data.pointerCurrentRaycast = hits[0];
            ExecuteEvents.ExecuteHierarchy(hits[0].gameObject, data, ExecuteEvents.pointerClickHandler);
        }

        sealed class FakeResources : IResourceDashboardViewModel
        {
            public IReadOnlyList<ResourceStatus> Resources { get; set; }
            public event Action Changed { add { } remove { } }
        }

        [Test]
        public void DashboardShowsOverLimitOnlyWhereUsedExceedsAvailable()
        {
            var dashboard = Find<ResourceDashboard>();
            dashboard.Bind(new FakeResources
            {
                Resources = new[]
                {
                    new ResourceStatus("Mass", "kg", 3f, 4f),
                    new ResourceStatus("Power", "W", 6f, 5f),
                    new ResourceStatus("Budget", "k$", 500f, 500f),
                },
            });
            Assert.IsFalse(dashboard.IsOverLimitShown(0));
            Assert.IsTrue(dashboard.IsOverLimitShown(1));
            Assert.IsFalse(dashboard.IsOverLimitShown(2), "exactly at the limit is not over");
            Assert.AreEqual(ResourceDashboard.BarOver, dashboard.Rows[1].barFillImage.color);
            Assert.AreEqual(3, dashboard.Rows.Count(r => r.gameObject.activeSelf));
        }
    }
}
