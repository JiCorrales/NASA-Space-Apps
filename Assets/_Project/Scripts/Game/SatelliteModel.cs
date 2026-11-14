using System.Linq;
using SpaceApps.Mission;
using UnityEngine;

namespace SpaceApps.Game
{
    /// <summary>
    /// A primitive model of the CubeSat being designed, rebuilt whenever the design changes: body at the real size
    /// of the format, body-mounted or deployable panels, an antenna per radio and one part per instrument.
    /// </summary>
    public sealed class SatelliteModel : MonoBehaviour
    {
        /// <summary>Real CubeSat length per unit along the long axis (CubeSat Design Specification: 1U is 113.5 mm).</summary>
        public const float UnitLength = 0.1135f;
        public const float UnitWidth = 0.1f;

        public Material bodyMaterial, panelMaterial, goldMaterial, lensMaterial;
        [Tooltip("The model is shown this many times its real size.")]
        public float displayScale = 3f;
        public float spinDegreesPerSecond = 12f;

        MissionSession session;
        Transform model;

        /// <summary>The satellite body, or null while no format is chosen.</summary>
        public Transform Body { get; private set; }
        public Transform Model => model;

        /// <summary>Real size (x width, y length, z depth) of a CubeSat with this many units; 6U is two 3U stacks side by side.</summary>
        public static Vector3 BodySize(float units)
        {
            int rows = units >= 6f ? 2 : 1;
            return new Vector3(rows == 2 ? 0.226f : UnitWidth, units / rows * UnitLength, UnitWidth);
        }

        public void Bind(MissionSession missionSession)
        {
            session = missionSession;
            session.Changed += Rebuild;
            Rebuild();
        }

        void OnDestroy()
        {
            if (session != null) session.Changed -= Rebuild;
        }

        void Update()
        {
            if (model != null) model.Rotate(0f, spinDegreesPerSecond * Time.deltaTime, 0f, Space.Self);
        }

        void Rebuild()
        {
            if (model == null)
            {
                model = new GameObject("Model").transform;
                model.SetParent(transform, false);
                model.localScale = Vector3.one * displayScale;
            }
            foreach (Transform child in model.Cast<Transform>().ToList())
            {
                child.gameObject.SetActive(false);
                child.SetParent(null, false);
                Destroy(child.gameObject);
            }
            Body = null;

            var c = session.Catalog;
            var d = session.Design;
            var format = MissionCatalog.Find(c.formats, d.format);
            if (format == null) return;

            var size = BodySize(format.units);
            model.localPosition = new Vector3(0f, size.y / 2f * displayScale, 0f);
            Body = Part("Body", PrimitiveType.Cube, Vector3.zero, size, bodyMaterial);

            var power = MissionCatalog.Find(c.power, d.power);
            if (power != null)
            {
                if (power.deployable) Wings(size, power.panelW);
                else BodyPanels(size);
            }

            var radio = MissionCatalog.Find(c.radios, d.radio);
            if (radio != null) Antenna(size, radio.band);

            var instruments = d.instruments.Select(id => MissionCatalog.Find(c.instruments, id)).Where(i => i != null).ToList();
            for (int i = 0; i < instruments.Count; i++)
            {
                // One slot per instrument down the front face (-z), so each new choice adds a visible part.
                float y = size.y / 2f - (i + 0.5f) * size.y / Mathf.Max(3, instruments.Count);
                InstrumentPart(instruments[i], new Vector3(0f, y, -size.z / 2f));
            }
        }

        void BodyPanels(Vector3 size)
        {
            const float t = 0.003f;
            Part("Body Panel +x", PrimitiveType.Cube, new Vector3(size.x / 2f + t / 2f, 0f, 0f), new Vector3(t, size.y * 0.92f, size.z * 0.85f), panelMaterial);
            Part("Body Panel -x", PrimitiveType.Cube, new Vector3(-size.x / 2f - t / 2f, 0f, 0f), new Vector3(t, size.y * 0.92f, size.z * 0.85f), panelMaterial);
            Part("Body Panel +z", PrimitiveType.Cube, new Vector3(0f, 0f, size.z / 2f + t / 2f), new Vector3(size.x * 0.85f, size.y * 0.92f, t), panelMaterial);
        }

        // Four wings out from the top edges, longer for more panel power.
        void Wings(Vector3 size, float panelW)
        {
            const float t = 0.004f;
            float reach = size.y * Mathf.Clamp(panelW / 14.4f, 0.8f, 1.6f); // ponytail: 14.4 W reads as one body length
            float top = size.y / 2f - 0.01f;
            Part("Wing +x", PrimitiveType.Cube, new Vector3(size.x / 2f + reach / 2f, top, 0f), new Vector3(reach, t, size.z * 0.95f), panelMaterial);
            Part("Wing -x", PrimitiveType.Cube, new Vector3(-size.x / 2f - reach / 2f, top, 0f), new Vector3(reach, t, size.z * 0.95f), panelMaterial);
            Part("Wing +z", PrimitiveType.Cube, new Vector3(0f, top, size.z / 2f + reach / 2f), new Vector3(size.x * 0.95f, t, reach), panelMaterial);
            Part("Wing -z", PrimitiveType.Cube, new Vector3(0f, top, -size.z / 2f - reach / 2f), new Vector3(size.x * 0.95f, t, reach), panelMaterial);
        }

        void Antenna(Vector3 size, string band)
        {
            if (band.StartsWith("uhf"))
            {
                // Four tape-measure whips from the bottom edges, about a quarter wavelength (17 cm) each.
                const float whip = 0.17f;
                float y = -size.y / 2f + 0.01f;
                Part("Antenna Whip +x", PrimitiveType.Cube, new Vector3(size.x / 2f + whip / 2f, y, 0f), new Vector3(whip, 0.002f, 0.006f), goldMaterial);
                Part("Antenna Whip -x", PrimitiveType.Cube, new Vector3(-size.x / 2f - whip / 2f, y, 0f), new Vector3(whip, 0.002f, 0.006f), goldMaterial);
                Part("Antenna Whip +z", PrimitiveType.Cube, new Vector3(0f, y, size.z / 2f + whip / 2f), new Vector3(0.006f, 0.002f, whip), goldMaterial);
                Part("Antenna Whip -z", PrimitiveType.Cube, new Vector3(0f, y, -size.z / 2f - whip / 2f), new Vector3(0.006f, 0.002f, whip), goldMaterial);
            }
            else
            {
                // An S-band patch antenna: a flat square on the bottom face.
                Part("Antenna Patch", PrimitiveType.Cube, new Vector3(0f, -size.y / 2f - 0.003f, 0f), new Vector3(0.06f, 0.006f, 0.06f), goldMaterial);
            }
        }

        // Each instrument is an unscaled group (so its details do not skew) holding a gold mount and one telling detail.
        void InstrumentPart(Instrument instrument, Vector3 at)
        {
            var group = new GameObject("Instrument " + instrument.id).transform;
            group.SetParent(model, false);
            group.localPosition = at;
            Part("Mount", PrimitiveType.Cube, new Vector3(0f, 0f, -0.01f), new Vector3(0.06f, 0.04f, 0.02f), goldMaterial, group);
            var outward = Quaternion.Euler(90f, 0f, 0f); // cylinders point along -z, out of the face
            if (instrument.isImager)
                Part("Lens", PrimitiveType.Cylinder, new Vector3(0f, 0f, -0.035f), new Vector3(0.04f, 0.02f, 0.04f), lensMaterial, group, outward);
            else if (instrument.tags.Contains("space-weather"))
                Part("Boom", PrimitiveType.Cylinder, new Vector3(0f, 0f, -0.12f), new Vector3(0.006f, 0.11f, 0.006f), bodyMaterial, group, outward);
            else if (instrument.tags.Contains("cloud-ice"))
                Part("Dish", PrimitiveType.Cylinder, new Vector3(0f, 0f, -0.025f), new Vector3(0.08f, 0.006f, 0.08f), bodyMaterial, group, outward);
            else
                Part("Sensor", PrimitiveType.Sphere, new Vector3(0f, 0f, -0.03f), Vector3.one * 0.025f, lensMaterial, group);
        }

        Transform Part(string name, PrimitiveType type, Vector3 localPosition, Vector3 localSize, Material material,
            Transform parent = null, Quaternion? rotation = null)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            Destroy(go.GetComponent<Collider>());
            go.GetComponent<MeshRenderer>().sharedMaterial = material;
            var t = go.transform;
            t.SetParent(parent != null ? parent : model, false);
            t.localPosition = localPosition;
            t.localRotation = rotation ?? Quaternion.identity;
            t.localScale = localSize;
            return t;
        }
    }
}
