using System.Linq;
using SpaceApps.Game;
using SpaceApps.Ship;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Rendering;
using UnityEngine.UI;
using UnityEngine.XR.Interaction.Toolkit;
using UnityEngine.XR.Interaction.Toolkit.Locomotion.Teleportation;
using UnityEngine.XR.Interaction.Toolkit.UI;

namespace SpaceApps.Ship.Editor
{
    /// <summary>
    /// Builds Ship.unity and the prefabs it places from primitives. Nobody edits the scene by hand:
    /// change this file and rerun it (menu Space Apps/Build Ship Scene, or
    /// -executeMethod SpaceApps.Ship.Editor.ShipBuilder.Build). 1 unit = 1 m.
    /// The ship is one round control room (docs/game-plan.md, section 5): six covers on the wall in front of the
    /// spawn point, the CubeSat on a stand in the centre, large windows across the wall behind.
    /// </summary>
    public static partial class ShipBuilder
    {
        // The six steps in cover order, left to right from the spawn point. Ids are the bridge's (docs/bridge.md).
        static readonly (string id, string name)[] CoverSteps =
        {
            ("goals", "Need and goals"),
            ("concept", "Concept"),
            ("requirements", "Requirements"),
            ("design", "Design"),
            ("build", "Build and verify"),
            ("fly", "Fly the mission"),
        };

        const string Root = "Assets/_Project";
        const string ScenePath = Root + "/Scenes/Ship.unity";
        const string MaterialsDir = Root + "/Art/Materials";
        const string PrefabsDir = Root + "/Prefabs";
        const string XrRigPrefab = "Assets/VRTemplateAssets/Prefabs/Setup/Complete XR Origin Set Up Hands Variant.prefab";
        const string FontPath = "Assets/VRTemplateAssets/Fonts/Inter/Inter-Regular SDF.asset";
        const string EarthTexturePath = "Assets/ThirdParty/NASA/BlueMarble-2048.png";
        const string StarfieldPath = Root + "/Art/Meshes/Starfield.asset";

        // ---------- room dimensions ----------

        /// <summary>Inner radius of the round wall: 10 m across, every cover a few steps from the centre.</summary>
        const float RoomRadius = 5f;
        const float Height = 3.2f;
        const float WallThickness = 0.2f;
        /// <summary>The wall is this many flat segments, 10 degrees each.</summary>
        const int WallSegments = 36;
        /// <summary>Segments whose centre is at least this far round from the covers (azimuth 0) are windows.</summary>
        const float WindowFromAzimuth = 100f;
        const float WindowBottom = 0.8f, WindowTop = 2.6f;

        // Azimuth is measured from +z (the cover wall) towards +x; the player spawns at -z facing +z.
        static readonly Vector3 Spawn = new Vector3(0f, 0f, -3f);
        const float CoverSpacing = 20f;
        const float CoverRadius = RoomRadius - 0.15f;
        const float CoverCentreHeight = 1.75f;
        // 1 canvas px = 1 mm. The cover is 1.5 m by 1.2 m; its number is about 0.4 m tall, about 3 degrees from the spawn point.
        const float CoverWidthPx = 1500f, CoverHeightPx = 1200f, CoverScale = 0.001f;

        static float CoverAzimuth(int i) => (i - (CoverSteps.Length - 1) / 2f) * CoverSpacing;
        static bool IsWindowSegment(float azimuth) => Mathf.Abs(Mathf.DeltaAngle(0f, azimuth)) >= WindowFromAzimuth;
        static Vector3 OnCircle(float azimuth, float radius, float y = 0f) =>
            new Vector3(Mathf.Sin(azimuth * Mathf.Deg2Rad) * radius, y, Mathf.Cos(azimuth * Mathf.Deg2Rad) * radius);

        static TMP_FontAsset font;
        static readonly Color TextColor = new Color(0.9f, 0.93f, 1f);

        [MenuItem("Space Apps/Build Ship Scene")]
        public static void Build()
        {
            // Template assets first: fail before anything is overwritten.
            font = AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(FontPath);
            var xrPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(XrRigPrefab);
            if (font == null || xrPrefab == null)
                throw new System.InvalidOperationException(
                    $"[ShipBuilder] Template asset missing, nothing was changed. Font at {FontPath}: {(font ? "ok" : "missing")}; XR rig at {XrRigPrefab}: {(xrPrefab ? "ok" : "missing")}.");

            // The builder replaces the open scene; let the user save theirs. Batch mode never prompts.
            if (!Application.isBatchMode && !EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
                return;

            EnsureFolder(MaterialsDir);

            var hull = Mat("Hull", new Color(0.3f, 0.32f, 0.36f));
            var floor = Mat("Floor", new Color(0.18f, 0.2f, 0.24f));
            var frame = Mat("Frame", new Color(0.08f, 0.09f, 0.11f));
            var desk = Mat("Desk", new Color(0.3f, 0.32f, 0.36f));
            var accent = Mat("Accent", new Color(0.1f, 0.6f, 0.8f), emission: new Color(0.2f, 1.2f, 1.6f));
            ArtMaterials(floor);
            var earthTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(EarthTexturePath);
            if (earthTexture == null) Debug.LogWarning($"[ShipBuilder] {EarthTexturePath} missing; the Earth will be plain blue.");
            var earth = Mat("Earth", earthTexture ? Color.white : new Color(0.2f, 0.35f, 0.8f), texture: earthTexture);
            var stars = Unlit("Stars", Color.white, doubleSided: true);
            var orbitLine = Unlit("Orbit Line", new Color(0.4f, 0.9f, 1f));
            var marker = Unlit("Satellite Marker", Color.white);
            var stationMarker = Unlit("Ground Station", new Color(1f, 0.6f, 0.2f));
            var satBody = Mat("Satellite Body", new Color(0.75f, 0.77f, 0.8f));
            var satPanel = Mat("Solar Panel", new Color(0.08f, 0.12f, 0.35f));
            var satGold = Mat("Gold Foil", new Color(0.85f, 0.65f, 0.25f));
            var satLens = Mat("Lens", new Color(0.03f, 0.03f, 0.05f));

            var roomPrefab = SavePrefab(BuildRoom(hull, floor, accent), "ControlRoom");
            var coverPrefab = SavePrefab(BuildCover(frame), "ShipCover");
            var desktopPrefab = SavePrefab(BuildDesktopRig(), "DesktopRig");
            var satellitePrefab = SavePrefab(BuildSatelliteDisplay(desk, satBody, satPanel, satGold, satLens), "SatelliteDisplay");
            var orbitPrefab = SavePrefab(BuildOrbitDisplay(desk, earth, orbitLine, marker, stationMarker), "OrbitDisplay");
            var spacePrefab = SavePrefab(BuildSpaceOutside(earth, stars), "SpaceOutside");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            Lighting();

            Place(roomPrefab, "Control Room", Vector3.zero, 0f);
            Place(spacePrefab, "Space Outside", Vector3.zero, 0f);

            var covers = new ShipCover[CoverSteps.Length];
            for (int i = 0; i < CoverSteps.Length; i++)
            {
                float azimuth = CoverAzimuth(i);
                var go = Place(coverPrefab, $"Cover {i + 1} {CoverSteps[i].id}", OnCircle(azimuth, CoverRadius, CoverCentreHeight), azimuth);
                var cover = go.GetComponent<ShipCover>();
                var so = new SerializedObject(cover);
                so.FindProperty("step").stringValue = CoverSteps[i].id;
                so.FindProperty("number").intValue = i + 1;
                so.FindProperty("stepName").stringValue = CoverSteps[i].name;
                // Forced order on the first run (game-plan, section 2): only the first step is open.
                so.FindProperty("status").stringValue = i == 0 ? ShipCover.Open : ShipCover.Locked;
                so.ApplyModifiedPropertiesWithoutUndo();
                cover.Refresh();
                covers[i] = cover;
            }

            // The CubeSat on its stand in the centre, the orbit globe off to the right, both facing the spawn point.
            Place(satellitePrefab, "Satellite Display", Vector3.zero, 0f);
            var orbitAt = OnCircle(80f, 3.6f);
            Place(orbitPrefab, "Orbit Display", orbitAt, Quaternion.LookRotation(orbitAt - Spawn).eulerAngles.y);
            new GameObject("Mission Game").AddComponent<MissionGame>();

            var xrRig = Place(xrPrefab, xrPrefab.name, Spawn, 0f);
            xrRig.SetActive(false);
            var desktopRig = Place(desktopPrefab, "Desktop Rig", Spawn, 0f);

            var screens = new GameObject("Ship Screens").AddComponent<ShipScreens>();
            screens.covers = covers;
            screens.rig = desktopRig.GetComponent<DesktopRig>();

            if (!xrRig.GetComponentsInChildren<EventSystem>(true).Any())
            {
                var es = new GameObject("EventSystem", typeof(EventSystem), typeof(XRUIInputModule));
                es.transform.SetAsLastSibling();
            }
            else
            {
                Debug.LogWarning("[ShipBuilder] XR rig prefab carries its own EventSystem; desktop rig has none.");
            }

            var selector = new GameObject("Rig Selector").AddComponent<RigSelector>();
            selector.xrRig = xrRig;
            selector.desktopRig = desktopRig;

            EditorSceneManager.SaveScene(scene, ScenePath);

            // Only the ship goes into builds; the template's scenes stay listed but disabled.
            var others = EditorBuildSettings.scenes.Where(s => s.path != ScenePath).Select(s => new EditorBuildSettingsScene(s.path, false));
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) }.Concat(others).ToArray();
            AssetDatabase.SaveAssets();
            Debug.Log($"[ShipBuilder] Built {ScenePath}: round room {RoomRadius * 2f} m across, {CoverSteps.Length} covers.");
        }

        /// <summary>
        /// Lighting that looks the same at every quality level, including the browser's, where additional (point)
        /// lights and post-processing are off: a gradient ambient, one directional key light (the only light the
        /// browser level draws per pixel) whose shadows only the furniture casts, glowing strips, and covers that
        /// draw unlit. No point lights at all, so the editor and the browser show the same room.
        /// </summary>
        static void Lighting()
        {
            RenderSettings.skybox = null;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.5f, 0.56f, 0.68f);
            RenderSettings.ambientEquatorColor = new Color(0.36f, 0.4f, 0.48f);
            RenderSettings.ambientGroundColor = new Color(0.16f, 0.17f, 0.2f);
            var key = new GameObject("Key Light").AddComponent<Light>();
            key.type = LightType.Directional;
            key.intensity = 1.1f;
            key.color = new Color(1f, 0.96f, 0.9f);
            // Steeply down and towards the windows: it lights the deck and the side of the Earth that faces the ship.
            key.transform.rotation = Quaternion.Euler(62f, 160f, 0f);
            key.shadows = LightShadows.Soft;
            key.shadowStrength = 0.55f;
        }

        // ---------- room ----------

        static GameObject BuildRoom(Material hull, Material floor, Material accent)
        {
            var root = new GameObject("ControlRoom");
            float outer = RoomRadius + WallThickness;

            // Deck and ceiling are discs; the walls decide where players walk, the deck's box collider holds them up.
            var deck = Disc("Floor", root, outer, -0.05f, 0.05f, floor);
            deck.AddComponent<BoxCollider>();
            var teleport = deck.AddComponent<TeleportationArea>();
            teleport.interactionLayers = InteractionLayerMask.GetMask("Teleport");
            var ceiling = Disc("Ceiling", root, outer, Height + 0.05f, 0.05f, hull);
            ceiling.GetComponent<MeshRenderer>().shadowCastingMode = ShadowCastingMode.Off;

            var wall = Group("Wall", root);
            float step = 360f / WallSegments;
            // Each flat segment is wide enough at the outer face to close the gap with its neighbours.
            float width = 2f * outer * Mathf.Tan(step / 2f * Mathf.Deg2Rad) + 0.02f;
            float mid = RoomRadius + WallThickness / 2f;
            for (int s = 0; s < WallSegments; s++)
            {
                float azimuth = (s + 0.5f) * step;
                var segment = Group($"Segment {s:00}", wall);
                segment.transform.SetLocalPositionAndRotation(OnCircle(azimuth, mid), Quaternion.Euler(0f, azimuth, 0f));
                if (!IsWindowSegment(azimuth))
                {
                    Panel3D("Solid", segment, Height / 2f, Height, width, plateMat);
                    continue;
                }
                Panel3D("Sill", segment, WindowBottom / 2f, WindowBottom, width, plateMat);
                Panel3D("Lintel", segment, (WindowTop + Height) / 2f, Height - WindowTop, width, plateMat);
            }

            RoomDressing(root, accent);
            return root;
        }

        /// <summary>One wall piece in a segment's local space (+z points out of the room), with its collider.</summary>
        static void Panel3D(string name, GameObject segment, float y, float height, float width, Material mat)
        {
            var box = Box(name, segment, new Vector3(0f, y, 0f), new Vector3(width, height, WallThickness), mat);
            // The hull never shadows the room: the key light stands for light from everywhere, not a sun in one place.
            box.GetComponent<MeshRenderer>().shadowCastingMode = ShadowCastingMode.Off;
        }

        static GameObject Disc(string name, GameObject parent, float radius, float y, float halfThickness, Material mat)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            go.name = name;
            Object.DestroyImmediate(go.GetComponent<Collider>());
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = new Vector3(0f, y, 0f);
            go.transform.localScale = new Vector3(radius * 2f, halfThickness, radius * 2f);
            go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            return go;
        }

        static GameObject Group(string name, GameObject parent)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent.transform, false);
            return go;
        }

        static GameObject Box(string name, GameObject parent, Vector3 position, Vector3 scale, Material mat, bool collider = true)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            if (!collider) Object.DestroyImmediate(go.GetComponent<Collider>());
            return go;
        }

        // ---------- cover ----------

        /// <summary>
        /// A cover in its own local space: the face looks along -z (into the room), the back sits against the wall.
        /// A step number, the step name and a state bar with the state in words; it draws unlit, so it reads the same
        /// under any lighting. The trigger collider is what a click hits.
        /// </summary>
        static GameObject BuildCover(Material frameMat)
        {
            const float w = CoverWidthPx, h = CoverHeightPx;
            var root = new GameObject("ShipCover");
            Box("Frame", root, new Vector3(0f, 0f, 0.04f), new Vector3(w * CoverScale + 0.12f, h * CoverScale + 0.12f, 0.06f), frameMat, collider: false);
            Box("Glow", root, new Vector3(0f, -h * CoverScale / 2f - 0.09f, 0.0f), new Vector3(w * CoverScale, 0.02f, 0.04f), coveMat, collider: false);
            var hit = root.AddComponent<BoxCollider>();
            hit.isTrigger = true;
            hit.size = new Vector3(w * CoverScale, h * CoverScale, 0.1f);

            var cover = root.AddComponent<ShipCover>();
            // No raycasters on this canvas: clicks go through ShipScreens' physics ray, not the UI event system.
            var go = new GameObject("Canvas", typeof(RectTransform));
            go.transform.SetParent(root.transform, false);
            var canvas = (RectTransform)go.transform;
            canvas.sizeDelta = new Vector2(w, h);
            canvas.localScale = Vector3.one * CoverScale;
            canvas.localRotation = Quaternion.identity;
            go.AddComponent<Canvas>().renderMode = RenderMode.WorldSpace;

            const float b = 22f;
            cover.border = Fill("Border", canvas, Color.white, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            Fill("Background", canvas, new Color(0.03f, 0.05f, 0.08f), Vector2.zero, Vector2.one, new Vector2(b, b), new Vector2(-b, -b));
            cover.numberText = Label("Number", canvas, 480, FontStyles.Bold, TextAlignmentOptions.Center,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(b, -650), new Vector2(-b, -30));
            cover.nameText = Label("Name", canvas, 130, FontStyles.Bold, TextAlignmentOptions.Center,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(60, -860), new Vector2(-60, -660));
            cover.nameText.textWrappingMode = TextWrappingModes.NoWrap;
            cover.nameText.fontSizeMax = 130;
            cover.nameText.fontSizeMin = 100;
            cover.nameText.enableAutoSizing = true;
            cover.stateBar = Fill("State Bar", canvas, Color.white, new Vector2(0, 0), new Vector2(1, 0), new Vector2(b, b), new Vector2(-b, 250));
            cover.stateText = Label("State", cover.stateBar.rectTransform, 140, FontStyles.Bold, TextAlignmentOptions.Center,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            cover.stateText.characterSpacing = 20;
            return root;
        }

        // ---------- live satellite and orbit ----------

        static GameObject BuildSatelliteDisplay(Material pedestalMat, Material body, Material panel, Material gold, Material lens)
        {
            var root = new GameObject("SatelliteDisplay");
            var pedestal = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            pedestal.name = "Pedestal";
            pedestal.transform.SetParent(root.transform, false);
            pedestal.transform.localPosition = new Vector3(0f, 0.5f, 0f);
            pedestal.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
            pedestal.GetComponent<MeshRenderer>().sharedMaterial = pedestalMat;
            Disc("Pedestal Cap", root, 0.28f, 1.0f, 0.012f, trimMat);

            var holder = new GameObject("Satellite");
            holder.transform.SetParent(root.transform, false);
            holder.transform.localPosition = new Vector3(0f, 1.02f, 0f);
            var model = holder.AddComponent<SatelliteModel>();
            model.bodyMaterial = body;
            model.panelMaterial = panel;
            model.goldMaterial = gold;
            model.lensMaterial = lens;
            // Real size, like the room: a 3U CubeSat stands 34 cm tall and stays below the covers seen from the spawn point.
            model.displayScale = 1f;

            Caption(root, new Vector3(0f, 0.86f, -0.26f), "Your CubeSat\n<size=70%>real size</size>");
            return root;
        }

        static GameObject BuildOrbitDisplay(Material pedestalMat, Material earth, Material line, Material marker, Material station)
        {
            var root = new GameObject("OrbitDisplay");
            var pedestal = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            pedestal.name = "Pedestal";
            pedestal.transform.SetParent(root.transform, false);
            pedestal.transform.localPosition = new Vector3(0f, 0.55f, 0f);
            pedestal.transform.localScale = new Vector3(0.2f, 0.55f, 0.2f);
            pedestal.GetComponent<MeshRenderer>().sharedMaterial = pedestalMat;

            var display = new GameObject("Display");
            display.transform.SetParent(root.transform, false);
            display.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            var orbit = display.AddComponent<OrbitDisplay>();

            var globe = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            globe.name = "Globe";
            Object.DestroyImmediate(globe.GetComponent<Collider>());
            globe.transform.SetParent(display.transform, false);
            globe.transform.localScale = Vector3.one * (orbit.globeRadius * 2f);
            globe.GetComponent<MeshRenderer>().sharedMaterial = earth;
            orbit.globe = globe.transform;

            var pivot = new GameObject("Orbit");
            pivot.transform.SetParent(display.transform, false);
            orbit.ringPivot = pivot.transform;
            var ring = pivot.AddComponent<LineRenderer>();
            ring.sharedMaterial = line;
            ring.widthMultiplier = 0.008f;
            ring.useWorldSpace = false;
            ring.loop = true;
            ring.shadowCastingMode = ShadowCastingMode.Off;
            orbit.ring = ring;

            var dot = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            dot.name = "Satellite Marker";
            Object.DestroyImmediate(dot.GetComponent<Collider>());
            dot.transform.SetParent(pivot.transform, false);
            dot.transform.localScale = Vector3.one * 0.045f;
            dot.GetComponent<MeshRenderer>().sharedMaterial = marker;
            orbit.marker = dot.transform;
            orbit.stationMaterial = station;

            Caption(root, new Vector3(0f, 1.0f, -0.12f), "Your orbit\n<size=70%>height shown 8 times higher; orange: ground stations</size>");
            return root;
        }

        /// <summary>A small text plate facing -z (towards a player in front of the prefab).</summary>
        static void Caption(GameObject parent, Vector3 position, string text)
        {
            var holder = new GameObject("Caption");
            holder.transform.SetParent(parent.transform, false);
            holder.transform.localPosition = position;
            var go = new GameObject("Canvas", typeof(RectTransform));
            go.transform.SetParent(holder.transform, false);
            var canvas = (RectTransform)go.transform;
            canvas.sizeDelta = new Vector2(600f, 140f);
            canvas.localScale = Vector3.one * 0.001f;
            go.AddComponent<Canvas>().renderMode = RenderMode.WorldSpace;
            Fill("Background", canvas, new Color(0.04f, 0.06f, 0.1f, 0.9f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            Label("Text", canvas, 40, FontStyles.Bold, TextAlignmentOptions.Center, Vector2.zero, Vector2.one,
                new Vector2(12, 6), new Vector2(-12, -6)).text = text;
        }

        // ---------- space outside ----------

        static GameObject BuildSpaceOutside(Material earthMat, Material starMat)
        {
            var root = new GameObject("SpaceOutside");
            // A big Earth below and behind the spawn point: its limb fills the bottom of the windows behind the player.
            var earth = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            earth.name = "Earth";
            Object.DestroyImmediate(earth.GetComponent<Collider>());
            earth.transform.SetParent(root.transform, false);
            earth.transform.localPosition = new Vector3(-80f, -240f, -368f);
            earth.transform.localRotation = Quaternion.Euler(0f, 200f, 23.4f);
            earth.transform.localScale = Vector3.one * 480f;
            earth.GetComponent<MeshRenderer>().sharedMaterial = earthMat;
            earth.GetComponent<MeshRenderer>().shadowCastingMode = ShadowCastingMode.Off;

            var stars = new GameObject("Stars");
            stars.transform.SetParent(root.transform, false);
            stars.AddComponent<MeshFilter>().sharedMesh = Starfield();
            var renderer = stars.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = starMat;
            renderer.shadowCastingMode = ShadowCastingMode.Off;

            // The committed scene never references the Asset Store skybox (it is not in the repository); SpaceSky
            // applies it at runtime when the package is installed.
            root.AddComponent<SpaceSky>().fallbackStars = renderer;
            Debug.Log(Resources.Load<Material>(SpaceSky.ResourceName) != null
                ? $"[ShipBuilder] Sky: SpaceSkies Free found, SpaceSky applies it at runtime over the fallback star field."
                : $"[ShipBuilder] Sky: SpaceSkies Free not installed, the star field is the sky.");
            return root;
        }

        /// <summary>1500 small quads on a sphere 800 m out, from a fixed seed so every rerun writes the same mesh.</summary>
        static Mesh Starfield()
        {
            EnsureFolder(Root + "/Art/Meshes");
            var mesh = AssetDatabase.LoadAssetAtPath<Mesh>(StarfieldPath);
            if (mesh == null)
            {
                mesh = new Mesh { name = "Starfield" };
                AssetDatabase.CreateAsset(mesh, StarfieldPath);
            }
            var random = new System.Random(20261114);
            const int count = 1500;
            const float radius = 800f;
            var vertices = new Vector3[count * 4];
            var triangles = new int[count * 6];
            for (int i = 0; i < count; i++)
            {
                // Uniform direction on the sphere.
                float y = (float)(random.NextDouble() * 2.0 - 1.0);
                float a = (float)(random.NextDouble() * Mathf.PI * 2.0);
                float r = Mathf.Sqrt(1f - y * y);
                var dir = new Vector3(r * Mathf.Cos(a), y, r * Mathf.Sin(a));
                float size = 1.2f + 2.4f * (float)(random.NextDouble() * random.NextDouble());
                var right = Vector3.Cross(dir, Mathf.Abs(dir.y) > 0.9f ? Vector3.forward : Vector3.up).normalized * size;
                var up = Vector3.Cross(right, dir).normalized * size;
                var c = dir * radius;
                vertices[i * 4] = c - right - up;
                vertices[i * 4 + 1] = c - right + up;
                vertices[i * 4 + 2] = c + right + up;
                vertices[i * 4 + 3] = c + right - up;
                int v = i * 4, t = i * 6;
                triangles[t] = v; triangles[t + 1] = v + 1; triangles[t + 2] = v + 2;
                triangles[t + 3] = v; triangles[t + 4] = v + 2; triangles[t + 5] = v + 3;
            }
            mesh.Clear();
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateBounds();
            EditorUtility.SetDirty(mesh);
            return mesh;
        }

        // ---------- desktop rig ----------

        static GameObject BuildDesktopRig()
        {
            var root = new GameObject("DesktopRig");
            var body = root.AddComponent<CharacterController>();
            body.height = 1.8f;
            body.radius = 0.3f;
            body.center = new Vector3(0f, 0.9f, 0f);
            body.skinWidth = 0.02f;

            var head = new GameObject("Head");
            head.tag = "MainCamera";
            head.transform.SetParent(root.transform, false);
            head.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            var cam = head.AddComponent<Camera>();
            cam.nearClipPlane = 0.05f;
            cam.fieldOfView = 70f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Color.black;
            head.AddComponent<AudioListener>();

            root.AddComponent<DesktopRig>().head = head.transform;
            return root;
        }

        // ---------- UI helpers ----------

        static RectTransform Rect(string name, Transform parent, Vector2 min, Vector2 max, Vector2 offMin, Vector2 offMax)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = min;
            rt.anchorMax = max;
            rt.offsetMin = offMin;
            rt.offsetMax = offMax;
            return rt;
        }

        static Image Fill(string name, Transform parent, Color color, Vector2 min, Vector2 max, Vector2 offMin, Vector2 offMax)
        {
            var img = Rect(name, parent, min, max, offMin, offMax).gameObject.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = false;
            return img;
        }

        static TextMeshProUGUI Label(string name, Transform parent, float size, FontStyles style, TextAlignmentOptions align,
            Vector2 min, Vector2 max, Vector2 offMin, Vector2 offMax)
        {
            var text = Rect(name, parent, min, max, offMin, offMax).gameObject.AddComponent<TextMeshProUGUI>();
            text.font = font;
            text.fontSize = size;
            text.fontStyle = style;
            text.alignment = align;
            text.color = TextColor;
            text.raycastTarget = false;
            text.textWrappingMode = TextWrappingModes.Normal;
            text.overflowMode = TextOverflowModes.Overflow;
            return text;
        }

        // ---------- assets ----------

        static Material Unlit(string name, Color color, bool doubleSided = false)
        {
            string path = $"{MaterialsDir}/{name}.mat";
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat == null)
            {
                mat = new Material(Shader.Find("Universal Render Pipeline/Unlit"));
                AssetDatabase.CreateAsset(mat, path);
            }
            mat.SetColor("_BaseColor", color);
            mat.SetFloat("_Cull", doubleSided ? 0f : 2f);
            EditorUtility.SetDirty(mat);
            return mat;
        }

        static Material Mat(string name, Color color, Color? emission = null, Texture2D texture = null)
        {
            string path = $"{MaterialsDir}/{name}.mat";
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat == null)
            {
                mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                AssetDatabase.CreateAsset(mat, path);
            }
            mat.SetColor("_BaseColor", color);
            mat.SetFloat("_Smoothness", 0.35f);
            mat.SetTexture("_BaseMap", texture);
            if (emission.HasValue)
            {
                mat.EnableKeyword("_EMISSION");
                mat.SetColor("_EmissionColor", emission.Value);
                mat.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
            }
            EditorUtility.SetDirty(mat);
            return mat;
        }

        static GameObject SavePrefab(GameObject temp, string name)
        {
            var prefab = PrefabUtility.SaveAsPrefabAsset(temp, $"{PrefabsDir}/{name}.prefab");
            Object.DestroyImmediate(temp);
            return prefab;
        }

        static GameObject Place(GameObject prefab, string name, Vector3 position, float yaw)
        {
            var go = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            go.name = name;
            go.transform.SetPositionAndRotation(position, Quaternion.Euler(0f, yaw, 0f));
            return go;
        }

        static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            int slash = path.LastIndexOf('/');
            EnsureFolder(path.Substring(0, slash));
            AssetDatabase.CreateFolder(path.Substring(0, slash), path.Substring(slash + 1));
        }
    }
}
