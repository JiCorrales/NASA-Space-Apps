using System.Collections.Generic;
using SpaceApps.Mission;
using UnityEngine;

namespace SpaceApps.Game
{
    /// <summary>
    /// A small Earth with the chosen orbit at its real inclination and an exaggerated altitude, a satellite marker
    /// moving along it and the ground stations of the chosen network.
    /// </summary>
    public sealed class OrbitDisplay : MonoBehaviour
    {
        public const float EarthRadiusKm = 6371f;
        /// <summary>Latitude of the ground stations; the catalog's contact minutes assume a station near 40 degrees.</summary>
        public const float StationLatitude = 40f;

        public Transform globe;
        public Transform ringPivot;
        public LineRenderer ring;
        public Transform marker;
        public Material stationMaterial;
        public float globeRadius = 0.3f;
        [Tooltip("Altitude is drawn this many times higher than real, or the ring would touch the globe.")]
        public float altitudeExaggeration = 8f;
        public float secondsPerOrbit = 12f;
        public float earthDegreesPerSecond = 4f;

        MissionSession session;
        float ringRadius, angle;
        readonly List<Transform> stations = new List<Transform>();

        public IReadOnlyList<Transform> Stations => stations;
        public float RingRadius => ringRadius;

        public void Bind(MissionSession missionSession)
        {
            session = missionSession;
            session.Changed += Refresh;
            Refresh();
        }

        void OnDestroy()
        {
            if (session != null) session.Changed -= Refresh;
        }

        void Update()
        {
            globe.Rotate(0f, earthDegreesPerSecond * Time.deltaTime, 0f, Space.Self);
            if (!ringPivot.gameObject.activeSelf) return;
            angle += 360f / secondsPerOrbit * Time.deltaTime;
            marker.localPosition = Circle(angle, ringRadius);
        }

        static Vector3 Circle(float degrees, float radius) =>
            new Vector3(Mathf.Cos(degrees * Mathf.Deg2Rad), 0f, Mathf.Sin(degrees * Mathf.Deg2Rad)) * radius;

        void Refresh()
        {
            var c = session.Catalog;
            var orbit = MissionCatalog.Find(c.orbits, session.Design.orbit);
            ringPivot.gameObject.SetActive(orbit != null);
            if (orbit != null)
            {
                ringRadius = globeRadius * (1f + altitudeExaggeration * orbit.altitudeKm / EarthRadiusKm);
                // The equator lies in the display's xz plane; the orbit plane is tilted about x by the inclination.
                ringPivot.localRotation = Quaternion.AngleAxis(orbit.inclinationDeg, Vector3.right);
                const int points = 96;
                ring.useWorldSpace = false;
                ring.loop = true;
                ring.positionCount = points;
                for (int i = 0; i < points; i++) ring.SetPosition(i, Circle(360f * i / points, ringRadius));
                marker.localPosition = Circle(angle, ringRadius);
            }

            foreach (var s in stations)
            {
                s.gameObject.SetActive(false);
                Destroy(s.gameObject);
            }
            stations.Clear();
            var network = MissionCatalog.Find(c.groundStations, session.Design.groundStation);
            int count = network == null ? 0 : Mathf.RoundToInt(network.stationCount);
            for (int i = 0; i < count; i++)
            {
                // ponytail: the catalog has no station coordinates, so stations sit at 40 N spread evenly in longitude.
                float lon = 360f * i / count;
                var direction = Quaternion.Euler(0f, lon, 0f) * Quaternion.Euler(0f, 0f, StationLatitude) * Vector3.right;
                var s = GameObject.CreatePrimitive(PrimitiveType.Cube);
                s.name = $"Ground Station {i + 1}";
                Destroy(s.GetComponent<Collider>());
                s.GetComponent<MeshRenderer>().sharedMaterial = stationMaterial;
                s.transform.SetParent(globe, false);
                // The globe is a scaled unit sphere, so local positions are on a 0.5 radius.
                s.transform.localPosition = direction * 0.5f;
                s.transform.localRotation = Quaternion.FromToRotation(Vector3.up, direction);
                s.transform.localScale = new Vector3(0.06f, 0.08f, 0.06f);
                stations.Add(s.transform);
            }
        }
    }
}
