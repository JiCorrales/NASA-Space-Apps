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
        public void ThereAreEightStationScreensInWalkingOrder()
        {
            CollectionAssert.AreEqual(new[] { "Objective", "Requirements", "Spacecraft", "Instruments", "Communications",
                "Launch and Orbit", "Build and Test", "Mission Control" }, Ui.Screens().Select(s => s.ViewModel.Title).ToArray());
        }

        [Test]
        public void EveryStationHasADashboardInView()
        {
            var dashboards = UnityEngine.Object.FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None);
            foreach (var screen in Ui.Screens())
            {
                var viewer = screen.transform.position - screen.transform.forward * 1.6f;
                Assert.IsTrue(dashboards.Any(d =>
                    {
                        var toDashboard = d.transform.position - viewer;
                        return toDashboard.magnitude < 3f && Vector3.Angle(screen.transform.forward, toDashboard) < 45f
                               && Vector3.Dot(d.transform.forward, toDashboard) > 0f; // facing the viewer
                    }), $"no dashboard in view at {screen.stationTitle}");
            }
        }

        sealed class FakeResources : IResourceDashboardViewModel
        {
            public IReadOnlyList<ResourceStatus> Resources { get; set; }
            public string Note => "";
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
            Assert.AreEqual("6 / 5 W", dashboard.Rows[1].valueText.text);
            Assert.IsFalse(dashboard.IsOverLimitShown(0));
            Assert.IsTrue(dashboard.IsOverLimitShown(1));
            Assert.IsFalse(dashboard.IsOverLimitShown(2), "exactly at the limit is not over");
            Assert.AreEqual(ResourceDashboard.BarOver, dashboard.Rows[1].barFillImage.color);
            Assert.AreEqual(3, dashboard.Rows.Count(r => r.gameObject.activeSelf));
        }
    }
}
