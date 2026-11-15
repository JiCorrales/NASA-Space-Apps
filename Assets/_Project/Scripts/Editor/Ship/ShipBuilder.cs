using System.Collections.Generic;
using System.Linq;
using SpaceApps.Game;
using SpaceApps.Ship;
using SpaceApps.UI;
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
    /// </summary>
    public static partial class ShipBuilder
    {
        // Walking order. Change names, text or count here; the corridor length follows.
        static readonly (string title, string explanation)[] Stations =
        {
            ("Objective", "Choose what your mission will study and why it matters. Every other choice follows from this one."),
            ("Requirements", "Turn the goal into numbers: what data you need, how much ground you must cover and how long the mission must last."),
            ("Spacecraft", "Pick the CubeSat size and its core systems. Bigger means more room and power, but more mass and cost."),
            ("Instruments", "Choose the sensors that collect your science. Each one adds mass, draws power and fills the data link."),
            ("Communications", "Pick a radio and a ground station. Together they decide how much of your data reaches Earth each day."),
            ("Launch and Orbit", "Pick a rocket and an orbit. The orbit sets what you can see, how often, and how long the satellite lasts."),
            ("Build and Test", "Choose how to test the spacecraft before launch. Tests cost money and time but make it more likely to work."),
            ("Mission Control", "Check the whole design: can it fly, what blocks it, and how much science it returns."),
        };

        const string Root = "Assets/_Project";
        const string ScenePath = Root + "/Scenes/Ship.unity";
        const string MaterialsDir = Root + "/Art/Materials";
        const string PrefabsDir = Root + "/Prefabs";
        const string XrRigPrefab = "Assets/VRTemplateAssets/Prefabs/Setup/Complete XR Origin Set Up Hands Variant.prefab";
        const string FontPath = "Assets/VRTemplateAssets/Fonts/Inter/Inter-Regular SDF.asset";

        const float HalfWidth = 2f;
        const float Height = 3f;
        const float StationSpacing = 3f;
        const float WallThickness = 0.2f;
        const float ScreenHeight = 1.65f;
        // 1 canvas px = 1.25 mm: body text then spans about 1 degree at 1.5 m and stays above 0.5 degree at 2 m.
        const float ScreenScale = 0.00125f;
        const float ScreenWidthPx = 1400f, ScreenHeightPx = 1300f;
        // Screen frame half width 0.915 m plus dashboard frame half width 0.64 m, with a 15 mm gap. Any further and the
        // dashboard leaves a 45 degree cone from 1.6 m in front of the screen (ShipSceneTests).
        const float DashboardOffset = 1.57f;
        const float WindowBottom = 1.0f, WindowTop = 2.3f;
        const string EarthTexturePath = "Assets/ThirdParty/NASA/BlueMarble-2048.png";
        const string StarfieldPath = Root + "/Art/Meshes/Starfield.asset";

        static bool IsLeft(int station) => station % 2 == 0;
        static float StationZ(int station) => StationSpacing * (station + 1);
        static float DashboardZ(int station) => StationZ(station) + (IsLeft(station) ? DashboardOffset : -DashboardOffset);

        /// <summary>Stretches of one side wall covered by a screen or a dashboard; windows go in the gaps.</summary>
        static List<(float from, float to)> Mounts(bool left)
        {
            float screenHalf = ScreenWidthPx * ScreenScale / 2f + 0.15f;
            var mounts = new List<(float, float)>();
            for (int i = 0; i < Stations.Length; i++)
            {
                if (IsLeft(i) != left) continue;
                mounts.Add((StationZ(i) - screenHalf, StationZ(i) + screenHalf));
                mounts.Add((DashboardZ(i) - 0.75f, DashboardZ(i) + 0.75f));
            }
            return mounts.OrderBy(m => m.Item1).ToList();
        }

        static TMP_FontAsset font;
        static readonly Color TextColor = new Color(0.9f, 0.93f, 1f);
        static readonly Color DimText = new Color(0.65f, 0.72f, 0.82f);
        static readonly Color SourceText = new Color(0.55f, 0.62f, 0.72f);

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

            // The bare hull is darker than the plates mounted on it, so the gaps between plates read as seams.
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

            float length = StationSpacing * (Stations.Length + 1);

            var hullPrefab = SavePrefab(BuildHull(length, hull, floor, accent), "ShipInterior");
            var screenPrefab = SavePrefab(BuildStationScreen(frame, desk), "StationScreen");
            var dashboardPrefab = SavePrefab(BuildDashboard(frame), "ResourceDashboard");
            var desktopPrefab = SavePrefab(BuildDesktopRig(), "DesktopRig");
            var welcomePrefab = SavePrefab(BuildWelcomeSign(frame), "WelcomeSign");
            var satellitePrefab = SavePrefab(BuildSatelliteDisplay(desk, satBody, satPanel, satGold, satLens), "SatelliteDisplay");
            var orbitPrefab = SavePrefab(BuildOrbitDisplay(desk, earth, orbitLine, marker, stationMarker), "OrbitDisplay");
            var spacePrefab = SavePrefab(BuildSpaceOutside(earth, stars), "SpaceOutside");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.skybox = null;
            // Lighting that every quality level renders, including WebGL's, where additional (point) lights are off:
            // a gradient ambient plus one shadowless directional light. The point lights only add accents where supported.
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.62f, 0.66f, 0.74f);
            RenderSettings.ambientEquatorColor = new Color(0.42f, 0.46f, 0.54f);
            RenderSettings.ambientGroundColor = new Color(0.22f, 0.24f, 0.28f);
            var sun = new GameObject("Key Light").AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.shadows = LightShadows.None;
            sun.intensity = 0.7f;
            sun.color = new Color(1f, 0.97f, 0.92f);
            sun.transform.rotation = Quaternion.Euler(55f, 35f, 0f);

            Place(hullPrefab, "Ship Interior", Vector3.zero, 0f);

            Place(spacePrefab, "Space Outside", Vector3.zero, 0f);

            for (int i = 0; i < Stations.Length; i++)
            {
                bool left = IsLeft(i);
                float x = left ? -HalfWidth + 0.08f : HalfWidth - 0.08f;
                var station = Place(screenPrefab, $"Station {i + 1} {Stations[i].title}",
                    new Vector3(x, ScreenHeight, StationZ(i)), left ? -90f : 90f);
                var so = new SerializedObject(station.GetComponent<StationScreen>());
                so.FindProperty("stationNumber").intValue = i + 1;
                so.FindProperty("stationTitle").stringValue = Stations[i].title;
                so.FindProperty("explanation").stringValue = Stations[i].explanation;
                so.ApplyModifiedPropertiesWithoutUndo();

                // A dashboard beside every station, so the resources are in view wherever the player stands.
                Place(dashboardPrefab, $"Resource Dashboard {i + 1}",
                    new Vector3(x, ScreenHeight + 0.05f, DashboardZ(i)), left ? -90f : 90f);
            }

            // Hangs in front of the spawn point, above eye height so the corridor stays in view.
            Place(welcomePrefab, "Welcome Sign", new Vector3(0f, 2.2f, 2.8f), 0f);
            // The live satellite between Spacecraft and Instruments, the orbit globe past Launch and Orbit.
            Place(satellitePrefab, "Satellite Display", new Vector3(0f, 0f, 12.6f), 0f);
            Place(orbitPrefab, "Orbit Display", new Vector3(0f, 0f, 20f), 0f);
            new GameObject("Mission Game").AddComponent<MissionGame>();

            var spawn = new Vector3(0f, 0f, 1f);
            var xrRig = Place(xrPrefab, xrPrefab.name, spawn, 0f);
            xrRig.SetActive(false);
            var desktopRig = Place(desktopPrefab, "Desktop Rig", spawn, 0f);

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
            Debug.Log($"[ShipBuilder] Built {ScenePath}: {Stations.Length} stations, corridor {length} m.");
        }

        // ---------- hull ----------

        static GameObject BuildHull(float length, Material hull, Material floor, Material accent)
        {
            var root = new GameObject("ShipInterior");
            float w = HalfWidth * 2f + WallThickness * 2f;
            float midZ = length / 2f;
            float t = WallThickness;

            // Floor, ceiling and side walls in pieces one station long, so no single object needs more lights than
            // the per-object limit allows.
            var floorRoot = Group("Floor", root);
            var ceilingRoot = Group("Ceiling", root);
            int pieces = Mathf.CeilToInt(length / StationSpacing);
            for (int i = 0; i < pieces; i++)
            {
                float z = (i + 0.5f) * StationSpacing;
                float depth = StationSpacing + (i == 0 || i == pieces - 1 ? t : 0f);
                float zc = z + (i == 0 ? -t / 2f : 0f) + (i == pieces - 1 ? t / 2f : 0f);
                Box($"Floor {i}", floorRoot, new Vector3(0f, -t / 2f, zc), new Vector3(w, t, depth), floor);
                Box($"Ceiling {i}", ceilingRoot, new Vector3(0f, Height + t / 2f, zc), new Vector3(w, t, depth), hull);
            }

            SideWall(Group("Wall_Left", root), -HalfWidth - t / 2f, length, Mounts(left: true), hull, accent);
            SideWall(Group("Wall_Right", root), HalfWidth + t / 2f, length, Mounts(left: false), hull, accent);

            // The template's teleport ray lands on the whole floor.
            var teleport = floorRoot.AddComponent<TeleportationArea>();
            teleport.interactionLayers = InteractionLayerMask.GetMask("Teleport");
            Box("Wall_Back", root, new Vector3(0f, Height / 2f, -t / 2f), new Vector3(w, Height, t), hull);
            // The far end is one wide window onto the Earth.
            var front = Group("Wall_Front", root);
            float zf = length + t / 2f, pane = 1.5f;
            Box("Front Left", front, new Vector3(-(pane + w / 2f) / 2f, Height / 2f, zf), new Vector3(w / 2f - pane, Height, t), hull);
            Box("Front Right", front, new Vector3((pane + w / 2f) / 2f, Height / 2f, zf), new Vector3(w / 2f - pane, Height, t), hull);
            Box("Front Sill", front, new Vector3(0f, WindowBottom / 2f, zf), new Vector3(2f * pane, WindowBottom, t), hull);
            Box("Front Lintel", front, new Vector3(0f, (WindowTop + Height) / 2f, zf), new Vector3(2f * pane, Height - WindowTop, t), hull);
            FrontWindowFrame(front, zf, pane);

            Box("Ceiling Strip", root, new Vector3(0f, Height - 0.01f, midZ), new Vector3(0.3f, 0.02f, length - 1f), accent, collider: false);
            Box("Floor Guide Left", root, new Vector3(-HalfWidth + 0.6f, 0.005f, midZ), new Vector3(0.05f, 0.01f, length - 1f), accent, collider: false);
            Box("Floor Guide Right", root, new Vector3(HalfWidth - 0.6f, 0.005f, midZ), new Vector3(0.05f, 0.01f, length - 1f), accent, collider: false);

            var lightZs = new List<float>();
            for (float z = 2f; z < length; z += 4f) lightZs.Add(z);
            HullDressing(root, length, lightZs.ToArray());
            foreach (float z in lightZs)
            {
                var light = new GameObject($"Light {z:0}").AddComponent<Light>();
                light.transform.SetParent(root.transform, false);
                light.transform.localPosition = new Vector3(0f, Height - 0.3f, z);
                light.type = LightType.Point;
                light.range = 7f;
                light.intensity = 1.5f;
                light.color = new Color(0.9f, 0.95f, 1f);
            }
            return root;
        }

        /// <summary>Window openings along one side wall: every gap of at least 1.2 m between mounts, 0.1 m clear of them.</summary>
        static List<(float from, float to)> Windows(List<(float from, float to)> mounts, float length)
        {
            var windows = new List<(float from, float to)>();
            float cursor = 0.3f;
            foreach (var (from, to) in mounts.Append((length - 0.3f, length)))
            {
                if (from - cursor >= 1.2f) windows.Add((cursor + 0.1f, from - 0.1f));
                cursor = Mathf.Max(cursor, to);
            }
            return windows;
        }

        /// <summary>A side wall with a window in every gap of at least 1.2 m between mounts; solid stretches in 3 m pieces.</summary>
        static void SideWall(GameObject wall, float x, float length, List<(float from, float to)> mounts, Material hull, Material accent)
        {
            const float t = WallThickness;
            var windows = Windows(mounts, length);

            int piece = 0;
            void Solid(float from, float to)
            {
                for (float z = from; z < to - 0.001f; z += StationSpacing)
                {
                    float end = Mathf.Min(to, z + StationSpacing);
                    Box($"{wall.name} {piece++}", wall, new Vector3(x, Height / 2f, (z + end) / 2f), new Vector3(t, Height, end - z), hull);
                    WallPlates(wall, x, Mathf.Max(z, 0.02f), Mathf.Min(end, length - 0.02f), 0f, Height);
                }
            }

            float solidFrom = -t;
            for (int i = 0; i < windows.Count; i++)
            {
                var (from, to) = windows[i];
                Solid(solidFrom, from);
                float mid = (from + to) / 2f, span = to - from;
                Box($"{wall.name} Window {i} Sill", wall, new Vector3(x, WindowBottom / 2f, mid), new Vector3(t, WindowBottom, span), hull);
                Box($"{wall.name} Window {i} Lintel", wall, new Vector3(x, (WindowTop + Height) / 2f, mid), new Vector3(t, Height - WindowTop, span), hull);
                Box($"{wall.name} Window {i} Light", wall, new Vector3(x, WindowBottom + 0.01f, mid), new Vector3(t + 0.04f, 0.02f, span), accent, collider: false);
                WallPlates(wall, x, from, to, 0f, WindowBottom);
                WallPlates(wall, x, from, to, WindowTop, Height);
                WindowFrame(wall, x, from, to, $"{wall.name} Window {i}");
                solidFrom = to;
            }
            Solid(solidFrom, length + t);
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

        // ---------- station screen ----------

        static GameObject BuildStationScreen(Material frameMat, Material deskMat)
        {
            const float w = ScreenWidthPx, h = ScreenHeightPx;
            var root = new GameObject("StationScreen");
            Box("Frame", root, new Vector3(0f, 0f, 0.03f), new Vector3(w * ScreenScale + 0.08f, h * ScreenScale + 0.08f, 0.05f), frameMat, collider: false);
            Console(root);

            var canvas = WorldCanvas(root, new Vector2(w, h), ScreenScale);
            Panel("Background", canvas, new Color(0.04f, 0.06f, 0.1f, 0.97f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            var screen = root.AddComponent<StationScreen>();
            screen.titleText = Label("Title", canvas, 64, FontStyles.Bold, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(48, -120), new Vector2(-48, -28));
            screen.explanationText = Label("Explanation", canvas, 34, FontStyles.Normal, TextAlignmentOptions.TopLeft, DimText,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(48, -230), new Vector2(-48, -125));

            var steps = Rect("Steps", canvas, new Vector2(0, 1), new Vector2(1, 1), new Vector2(48, -315), new Vector2(-48, -245));
            var stepsLayout = steps.gameObject.AddComponent<HorizontalLayoutGroup>();
            stepsLayout.spacing = 14;
            stepsLayout.childControlHeight = stepsLayout.childControlWidth = true;
            stepsLayout.childForceExpandWidth = stepsLayout.childForceExpandHeight = true;
            screen.stepsRoot = steps;
            var tab = Panel("Step Template", steps, StationScreen.RowIdle, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            var tabView = tab.gameObject.AddComponent<StepTabView>();
            tabView.background = tab;
            tabView.button = MakeButton(tab);
            tabView.label = Label("Label", tab.rectTransform, 36, FontStyles.Bold, TextAlignmentOptions.Center, TextColor,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            screen.stepTemplate = tabView;

            var body = new Vector2(48, 205);
            var bodyTop = new Vector2(-48, -330);
            var options = Rect("Options", canvas, Vector2.zero, Vector2.one, body, bodyTop);
            var layout = options.gameObject.AddComponent<VerticalLayoutGroup>();
            layout.spacing = 10;
            layout.childControlHeight = layout.childControlWidth = true;
            layout.childForceExpandHeight = false;
            layout.childForceExpandWidth = true;
            screen.optionsRoot = options;

            var row = Panel("Option Template", options, StationScreen.RowIdle, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            row.gameObject.AddComponent<LayoutElement>().preferredHeight = 118;
            var rowView = row.gameObject.AddComponent<OptionRowView>();
            rowView.background = row;
            rowView.button = MakeButton(row);
            rowView.nameText = Label("Name", row.rectTransform, 32, FontStyles.Bold, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 0.58f), new Vector2(0.42f, 1), new Vector2(20, 0), new Vector2(0, -2));
            rowView.statsText = Label("Stats", row.rectTransform, 27, FontStyles.Normal, TextAlignmentOptions.Right, TextColor,
                new Vector2(0.42f, 0.58f), new Vector2(1, 1), new Vector2(12, 0), new Vector2(-20, -2));
            rowView.descriptionText = Label("Description", row.rectTransform, 28, FontStyles.Normal, TextAlignmentOptions.Left, DimText,
                new Vector2(0, 0.28f), new Vector2(1, 0.58f), new Vector2(20, 0), new Vector2(-20, 0));
            rowView.sourceText = Label("Source", row.rectTransform, 26, FontStyles.Italic, TextAlignmentOptions.Left, SourceText,
                new Vector2(0, 0), new Vector2(1, 0.28f), new Vector2(20, 2), new Vector2(-20, 0));
            rowView.descriptionText.textWrappingMode = rowView.sourceText.textWrappingMode = TextWrappingModes.NoWrap;
            // Long names or many stats shrink a little rather than being cut off.
            AutoSize(rowView.nameText, 22f);
            AutoSize(rowView.statsText, 22f);
            screen.optionTemplate = rowView;

            screen.detailsText = Label("Details", canvas, 32, FontStyles.Normal, TextAlignmentOptions.TopLeft, TextColor,
                Vector2.zero, Vector2.one, body, bodyTop);
            screen.detailsText.overflowMode = TextOverflowModes.Truncate;

            screen.statusText = Label("Status", canvas, 30, FontStyles.Normal, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 0), new Vector2(0.4f, 0), new Vector2(48, 30), new Vector2(0, 190));

            var actions = Rect("Actions", canvas, new Vector2(0.4f, 0), new Vector2(1, 0), new Vector2(24, 60), new Vector2(-48, 160));
            var actionsLayout = actions.gameObject.AddComponent<HorizontalLayoutGroup>();
            actionsLayout.spacing = 14;
            actionsLayout.childAlignment = TextAnchor.MiddleRight;
            actionsLayout.childControlHeight = actionsLayout.childControlWidth = true;
            actionsLayout.childForceExpandHeight = true;
            actionsLayout.childForceExpandWidth = false;
            screen.actionsRoot = actions;
            var action = Panel("Action Template", actions, new Color(0.15f, 0.6f, 0.4f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            action.gameObject.AddComponent<LayoutElement>().preferredWidth = 240;
            var actionView = action.gameObject.AddComponent<StepTabView>();
            actionView.background = action;
            actionView.button = MakeButton(action);
            actionView.label = Label("Label", action.rectTransform, 30, FontStyles.Bold, TextAlignmentOptions.Center, Color.white,
                Vector2.zero, Vector2.one, new Vector2(8, 0), new Vector2(-8, 0));
            AutoSize(actionView.label, 24f);
            screen.actionTemplate = actionView;

            var done = Panel("Done", canvas, StationScreen.DoneColor, new Vector2(1, 1), new Vector2(1, 1), new Vector2(-200, -100), new Vector2(-48, -40));
            Label("Label", done.rectTransform, 32, FontStyles.Bold, TextAlignmentOptions.Center, new Color(0.04f, 0.1f, 0.08f),
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero).text = "DONE";
            screen.doneBadge = done.gameObject;

            // The station number, above the screen, readable from down the corridor.
            var plate = Panel("Number Plate", canvas, new Color(0.04f, 0.06f, 0.1f), new Vector2(0.5f, 1), new Vector2(0.5f, 1),
                new Vector2(-120, 50), new Vector2(120, 290));
            screen.numberText = Label("Number", plate.rectTransform, 150, FontStyles.Bold, TextAlignmentOptions.Center, TextColor,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            return root;
        }

        // ---------- dashboard ----------

        static GameObject BuildDashboard(Material frameMat)
        {
            var root = new GameObject("ResourceDashboard");
            Box("Frame", root, new Vector3(0f, 0f, 0.03f), new Vector3(1.28f, 1.06f, 0.05f), frameMat, collider: false);
            var canvas = WorldCanvas(root, new Vector2(1200f, 980f));
            Panel("Background", canvas, new Color(0.04f, 0.06f, 0.1f, 0.97f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            Label("Title", canvas, 56, FontStyles.Bold, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(48, -120), new Vector2(-48, -30)).text = "Mission resources";

            var dashboard = root.AddComponent<ResourceDashboard>();
            var rows = Rect("Rows", canvas, Vector2.zero, Vector2.one, new Vector2(48, 110), new Vector2(-48, -135));
            dashboard.noteText = Label("Note", canvas, 28, FontStyles.Normal, TextAlignmentOptions.TopLeft, DimText,
                Vector2.zero, new Vector2(1, 0), new Vector2(48, 16), new Vector2(-48, 106));
            var layout = rows.gameObject.AddComponent<VerticalLayoutGroup>();
            layout.spacing = 12;
            layout.childControlHeight = layout.childControlWidth = true;
            layout.childForceExpandHeight = false;
            layout.childForceExpandWidth = true;
            dashboard.rowsRoot = rows;

            var row = Rect("Row Template", rows, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            row.gameObject.AddComponent<LayoutElement>().preferredHeight = 108;
            var view = row.gameObject.AddComponent<ResourceRowView>();
            view.nameText = Label("Name", row, 38, FontStyles.Bold, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 0.45f), new Vector2(0.45f, 1), Vector2.zero, Vector2.zero);
            view.valueText = Label("Value", row, 36, FontStyles.Normal, TextAlignmentOptions.Right, TextColor,
                new Vector2(0.6f, 0.45f), new Vector2(1, 1), Vector2.zero, Vector2.zero);
            var badge = Panel("Over Limit", row, ResourceDashboard.BarOver, new Vector2(0.38f, 0.5f), new Vector2(0.6f, 1f),
                Vector2.zero, new Vector2(-12, 0));
            Label("Label", badge.rectTransform, 28, FontStyles.Bold, TextAlignmentOptions.Center, Color.white,
                Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero).text = "OVER LIMIT";
            view.overLimitBadge = badge.gameObject;
            var bar = Panel("Bar", row, new Color(0.15f, 0.18f, 0.24f), new Vector2(0, 0.08f), new Vector2(1, 0.38f), Vector2.zero, Vector2.zero);
            view.barFillImage = Panel("Fill", bar.rectTransform, ResourceDashboard.BarOk, Vector2.zero, new Vector2(0.5f, 1f), Vector2.zero, Vector2.zero);
            view.barFill = view.barFillImage.rectTransform;
            dashboard.rowTemplate = view;
            return root;
        }

        // ---------- welcome sign ----------

        static GameObject BuildWelcomeSign(Material frameMat)
        {
            var root = new GameObject("WelcomeSign");
            Box("Frame", root, new Vector3(0f, 0f, 0.03f), new Vector3(1.68f, 0.88f, 0.05f), frameMat, collider: false);
            var canvas = WorldCanvas(root, new Vector2(1600f, 800f));
            Panel("Background", canvas, new Color(0.04f, 0.06f, 0.1f, 0.97f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            var sign = root.AddComponent<WelcomeSign>();
            sign.titleText = Label("Title", canvas, 60, FontStyles.Bold, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 1), new Vector2(1, 1), new Vector2(48, -120), new Vector2(-48, -30));
            sign.bodyText = Label("Body", canvas, 36, FontStyles.Normal, TextAlignmentOptions.TopLeft, TextColor,
                new Vector2(0, 0), new Vector2(1, 1), new Vector2(48, 200), new Vector2(-48, -135));
            var controls = Panel("Controls", canvas, new Color(0.12f, 0.17f, 0.25f), new Vector2(0, 0), new Vector2(1, 0), new Vector2(32, 28), new Vector2(-32, 180));
            sign.controlsText = Label("Text", controls.rectTransform, 32, FontStyles.Normal, TextAlignmentOptions.Left, TextColor,
                Vector2.zero, Vector2.one, new Vector2(24, 8), new Vector2(-24, -8));
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

            var holder = new GameObject("Satellite");
            holder.transform.SetParent(root.transform, false);
            holder.transform.localPosition = new Vector3(0f, 1.02f, 0f);
            var model = holder.AddComponent<SatelliteModel>();
            model.bodyMaterial = body;
            model.panelMaterial = panel;
            model.goldMaterial = gold;
            model.lensMaterial = lens;
            model.displayScale = 2.5f;

            Caption(root, new Vector3(0f, 0.9f, -0.26f), "Your CubeSat\n<size=70%>shown 2.5 times real size</size>");
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

        /// <summary>A small text plate facing -z (towards the player coming from the spawn point).</summary>
        static void Caption(GameObject parent, Vector3 position, string text)
        {
            var holder = new GameObject("Caption");
            holder.transform.SetParent(parent.transform, false);
            holder.transform.localPosition = position;
            var canvas = WorldCanvas(holder, new Vector2(600f, 140f));
            Panel("Background", canvas, new Color(0.04f, 0.06f, 0.1f, 0.9f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            Label("Text", canvas, 40, FontStyles.Bold, TextAlignmentOptions.Center, TextColor, Vector2.zero, Vector2.one,
                new Vector2(12, 6), new Vector2(-12, -6)).text = text;
        }

        // ---------- space outside ----------

        static GameObject BuildSpaceOutside(Material earthMat, Material starMat)
        {
            var root = new GameObject("SpaceOutside");
            // A big Earth below and to the left: it fills the bottom of the left windows and the front window's corner.
            var earth = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            earth.name = "Earth";
            Object.DestroyImmediate(earth.GetComponent<Collider>());
            earth.transform.SetParent(root.transform, false);
            earth.transform.localPosition = new Vector3(-500f, -150f, 60f);
            earth.transform.localRotation = Quaternion.Euler(0f, 200f, 23.4f);
            earth.transform.localScale = Vector3.one * 600f;
            earth.GetComponent<MeshRenderer>().sharedMaterial = earthMat;
            earth.GetComponent<MeshRenderer>().shadowCastingMode = ShadowCastingMode.Off;

            var stars = new GameObject("Stars");
            stars.transform.SetParent(root.transform, false);
            stars.AddComponent<MeshFilter>().sharedMesh = Starfield();
            var renderer = stars.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = starMat;
            renderer.shadowCastingMode = ShadowCastingMode.Off;
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

        static RectTransform WorldCanvas(GameObject parent, Vector2 sizePx, float metresPerPixel = 0.001f)
        {
            var go = new GameObject("Canvas", typeof(RectTransform));
            go.transform.SetParent(parent.transform, false);
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = sizePx;
            rt.localScale = Vector3.one * metresPerPixel;
            go.AddComponent<Canvas>().renderMode = RenderMode.WorldSpace;
            // Walls and doors in front of a screen block both the mouse and the XR ray.
            go.AddComponent<GraphicRaycaster>().blockingObjects = GraphicRaycaster.BlockingObjects.ThreeD;
            go.AddComponent<TrackedDeviceGraphicRaycaster>().checkFor3DOcclusion = true;
            return rt;
        }

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

        static Image Panel(string name, Transform parent, Color color, Vector2 min, Vector2 max, Vector2 offMin, Vector2 offMax)
        {
            var img = Rect(name, parent, min, max, offMin, offMax).gameObject.AddComponent<Image>();
            img.color = color;
            return img;
        }

        static TextMeshProUGUI Label(string name, Transform parent, float size, FontStyles style, TextAlignmentOptions align,
            Color color, Vector2 min, Vector2 max, Vector2 offMin, Vector2 offMax)
        {
            var text = Rect(name, parent, min, max, offMin, offMax).gameObject.AddComponent<TextMeshProUGUI>();
            text.font = font;
            text.fontSize = size;
            text.fontStyle = style;
            text.alignment = align;
            text.color = color;
            text.raycastTarget = false;
            text.textWrappingMode = TextWrappingModes.Normal;
            text.overflowMode = TextOverflowModes.Ellipsis;
            return text;
        }

        static void AutoSize(TMP_Text text, float min)
        {
            text.textWrappingMode = TextWrappingModes.NoWrap;
            text.fontSizeMax = text.fontSize;
            text.fontSizeMin = min;
            text.enableAutoSizing = true;
        }

        static Button MakeButton(Image target)
        {
            var button = target.gameObject.AddComponent<Button>();
            button.targetGraphic = target;
            var colors = button.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(0.8f, 0.9f, 1f);
            colors.pressedColor = new Color(0.65f, 0.75f, 0.85f);
            colors.selectedColor = Color.white;
            colors.disabledColor = new Color(0.45f, 0.45f, 0.45f);
            button.colors = colors;
            return button;
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
