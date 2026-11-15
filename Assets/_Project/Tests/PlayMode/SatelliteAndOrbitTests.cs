using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Game;
using SpaceApps.Mission;
using SpaceApps.Ship;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>The live satellite model, the orbit globe and the Earth and stars outside the windows.</summary>
    public sealed class SatelliteAndOrbitTests
    {
        MissionSession session;
        SatelliteModel satellite;
        OrbitDisplay orbit;

        [UnitySetUp]
        public IEnumerator LoadShip()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            session = Object.FindFirstObjectByType<MissionGame>().Session;
            satellite = Object.FindFirstObjectByType<SatelliteModel>();
            orbit = Object.FindFirstObjectByType<OrbitDisplay>();
        }

        int PartsNamed(string prefix) =>
            satellite.Model.GetComponentsInChildren<Transform>().Count(t => t.name.StartsWith(prefix));

        [Test]
        public void TheShipHasOneSatelliteAndOneOrbitDisplay()
        {
            Assert.AreEqual(1, Object.FindObjectsByType<SatelliteModel>(FindObjectsSortMode.None).Length);
            Assert.AreEqual(1, Object.FindObjectsByType<OrbitDisplay>(FindObjectsSortMode.None).Length);
        }

        [Test]
        public void BodySizeFollowsTheCubeSatSpecification()
        {
            Assert.AreEqual(0.1135f, SatelliteModel.BodySize(1).y, 1e-4f);
            Assert.AreEqual(0.3405f, SatelliteModel.BodySize(3).y, 1e-4f);
            var six = SatelliteModel.BodySize(6);
            Assert.AreEqual(0.226f, six.x, 1e-4f, "6U is two 3U stacks side by side");
            Assert.AreEqual(0.3405f, six.y, 1e-4f);
        }

        [UnityTest]
        public IEnumerator NoFormatMeansNoSatellite()
        {
            yield return null;
            Assert.IsNull(satellite.Body);
        }

        [UnityTest]
        public IEnumerator TheBodyHasTheChosenFormatsSize()
        {
            session.Change(d => d.format = "3u");
            yield return null;
            Assert.IsNotNull(satellite.Body);
            Assert.AreEqual(SatelliteModel.BodySize(3), satellite.Body.localScale);

            session.Change(d => d.format = "6u");
            yield return null;
            Assert.AreEqual(SatelliteModel.BodySize(6), satellite.Body.localScale);
            Assert.AreEqual(1, PartsNamed("Body"), "the old body is gone after a rebuild");
        }

        [UnityTest]
        public IEnumerator PowerRadioAndInstrumentsAddParts()
        {
            session.Change(d => { d.format = "3u"; d.power = "body-3u"; d.radio = "uhf"; });
            yield return null;
            Assert.AreEqual(3, PartsNamed("Body Panel"));
            Assert.AreEqual(0, PartsNamed("Wing"));
            Assert.AreEqual(4, PartsNamed("Antenna Whip"));

            session.Change(d => { d.power = "deployable-3u"; d.radio = "s-band"; d.instruments.Add("camera-basic"); d.instruments.Add("magnetometer"); });
            yield return null;
            Assert.AreEqual(0, PartsNamed("Body Panel"));
            Assert.AreEqual(4, PartsNamed("Wing"));
            Assert.AreEqual(0, PartsNamed("Antenna Whip"));
            Assert.AreEqual(1, PartsNamed("Antenna Patch"));
            Assert.AreEqual(2, PartsNamed("Instrument "));
            Assert.AreEqual(1, PartsNamed("Lens"), "the camera shows a lens");
            Assert.AreEqual(1, PartsNamed("Boom"), "the magnetometer shows a boom");
        }

        [UnityTest]
        public IEnumerator TheSatelliteSpins()
        {
            session.Change(d => d.format = "1u");
            yield return null;
            var before = satellite.Model.localRotation;
            for (int i = 0; i < 10; i++) yield return null;
            Assert.Greater(Quaternion.Angle(before, satellite.Model.localRotation), 0f);
        }

        [UnityTest]
        public IEnumerator TheOrbitRingAppearsAtTheChosenInclination()
        {
            yield return null;
            Assert.IsFalse(orbit.ringPivot.gameObject.activeSelf, "no orbit chosen yet");

            session.Change(d => d.orbit = "sso-550");
            yield return null;
            var sso = MissionCatalog.Find(session.Catalog.orbits, "sso-550");
            Assert.IsTrue(orbit.ringPivot.gameObject.activeSelf);
            Assert.AreEqual(orbit.globeRadius * (1f + orbit.altitudeExaggeration * sso.altitudeKm / OrbitDisplay.EarthRadiusKm), orbit.RingRadius, 1e-4f);
            Assert.AreEqual(sso.inclinationDeg, Vector3.Angle(Vector3.up, orbit.ringPivot.localRotation * Vector3.up), 0.1f);
            Assert.Greater(orbit.RingRadius, orbit.globeRadius, "the ring clears the globe");

            var start = orbit.marker.localPosition;
            for (int i = 0; i < 10; i++) yield return null;
            Assert.AreNotEqual(start, orbit.marker.localPosition, "the satellite marker moves along the ring");
            Assert.AreEqual(orbit.RingRadius, orbit.marker.localPosition.magnitude, 1e-3f);
        }

        [UnityTest]
        public IEnumerator GroundStationsFollowTheNetwork()
        {
            session.Change(d => d.groundStation = "commercial-network");
            yield return null;
            Assert.AreEqual(3, orbit.Stations.Count);
            session.Change(d => d.groundStation = "university-sband");
            yield return null;
            Assert.AreEqual(1, orbit.Stations.Count);
            Assert.AreEqual(1, orbit.globe.GetComponentsInChildren<Transform>().Count(t => t.name.StartsWith("Ground Station")),
                "replaced stations are removed from the globe");
        }

        [Test]
        public void EarthAndStarsAreOutsideTheHull()
        {
            var earth = GameObject.Find("Space Outside/Earth");
            Assert.IsNotNull(earth);
            Assert.IsNotNull(earth.GetComponent<Renderer>().sharedMaterial.GetTexture("_BaseMap"), "the Earth uses the Blue Marble image");
            var bounds = earth.GetComponent<Renderer>().bounds;
            Assert.Greater(Vector3.Distance(bounds.center, Vector3.zero) - bounds.extents.x, 50f, "the Earth is far outside the ship");
            Assert.Less(Vector3.Distance(bounds.center, Camera.main.transform.position) + bounds.extents.x, Camera.main.farClipPlane,
                "the whole Earth is inside the far clip plane");

            var stars = GameObject.Find("Space Outside/Stars").GetComponent<MeshFilter>().sharedMesh;
            Assert.Greater(stars.vertexCount, 1000);
            Assert.Less(stars.bounds.extents.x, Camera.main.farClipPlane - 50f, "stars are drawn, not clipped away");
        }
        // The Asset Store skybox is not in the repository: the scene must carry no reference to it, and must load
        // and show a sky with or without the package.
        [Test]
        public void SkyNeedsNoReferenceToTheAssetStorePackage()
        {
            var sky = Object.FindFirstObjectByType<SpaceSky>();
            Assert.IsNotNull(sky, "the scene has the SpaceSky component");
            Assert.IsNotNull(sky.fallbackStars, "the star field is the fallback");
            var package = SpaceSky.LoadPreferred(out bool earthInSky);
            var earth = GameObject.Find("Space Outside/Earth").GetComponent<Renderer>();
            if (package == null)
            {
                Assert.IsNull(RenderSettings.skybox, "without a package the scene keeps no skybox");
                Assert.IsTrue(sky.fallbackStars.enabled, "without a package the stars are drawn");
                Assert.IsTrue(earth.enabled, "without a package the scene's own Earth is drawn");
            }
            else
            {
                Assert.AreEqual(package, RenderSettings.skybox, "with a package the skybox is the preferred Asset Store sky");
                Assert.IsFalse(sky.fallbackStars.enabled, "with a package the stars are not drawn on top of it");
                Assert.AreEqual(!earthInSky, earth.enabled, "the scene's Earth is hidden only when the sky has its own");
            }
        }
    }
}
