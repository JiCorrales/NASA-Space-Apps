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
    public static class ShipBuilder
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
        const float ScreenHeight = 1.6f;

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

            var hull = Mat("Hull", new Color(0.55f, 0.58f, 0.62f));
            var floor = Mat("Floor", new Color(0.18f, 0.2f, 0.24f));
            var frame = Mat("Frame", new Color(0.08f, 0.09f, 0.11f));
            var desk = Mat("Desk", new Color(0.3f, 0.32f, 0.36f));
            var accent = Mat("Accent", new Color(0.1f, 0.6f, 0.8f), emission: new Color(0.2f, 1.2f, 1.6f));

            float length = StationSpacing * (Stations.Length + 1);

            var hullPrefab = SavePrefab(BuildHull(length, hull, floor, accent), "ShipInterior");
            var screenPrefab = SavePrefab(BuildStationScreen(frame, desk), "StationScreen");
            var dashboardPrefab = SavePrefab(BuildDashboard(frame), "ResourceDashboard");
            var desktopPrefab = SavePrefab(BuildDesktopRig(), "DesktopRig");

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

            for (int i = 0; i < Stations.Length; i++)
            {
                bool left = i % 2 == 0;
                float x = left ? -HalfWidth + 0.08f : HalfWidth - 0.08f;
                var station = Place(screenPrefab, $"Station {i + 1} {Stations[i].title}",
                    new Vector3(x, ScreenHeight, StationSpacing * (i + 1)), left ? -90f : 90f);
                var so = new SerializedObject(station.GetComponent<StationScreen>());
                so.FindProperty("stationTitle").stringValue = Stations[i].title;
                so.FindProperty("explanation").stringValue = Stations[i].explanation;
                so.ApplyModifiedPropertiesWithoutUndo();

                // A dashboard beside every station, so the resources are in view wherever the player stands.
                Place(dashboardPrefab, $"Resource Dashboard {i + 1}",
                    station.transform.position + station.transform.right * 1.5f + Vector3.up * 0.05f, left ? -90f : 90f);
            }

            Place(dashboardPrefab, "Resource Dashboard End", new Vector3(0f, 1.6f, length - 0.08f), 0f);
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

            var others = EditorBuildSettings.scenes.Where(s => s.path != ScenePath);
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
            var leftRoot = Group("Wall_Left", root);
            var rightRoot = Group("Wall_Right", root);
            int pieces = Mathf.CeilToInt(length / StationSpacing);
            for (int i = 0; i < pieces; i++)
            {
                float z = (i + 0.5f) * StationSpacing;
                float depth = StationSpacing + (i == 0 || i == pieces - 1 ? t : 0f);
                float zc = z + (i == 0 ? -t / 2f : 0f) + (i == pieces - 1 ? t / 2f : 0f);
                Box($"Floor {i}", floorRoot, new Vector3(0f, -t / 2f, zc), new Vector3(w, t, depth), floor);
                Box($"Ceiling {i}", ceilingRoot, new Vector3(0f, Height + t / 2f, zc), new Vector3(w, t, depth), hull);
                Box($"Wall_Left {i}", leftRoot, new Vector3(-HalfWidth - t / 2f, Height / 2f, zc), new Vector3(t, Height, depth), hull);
                Box($"Wall_Right {i}", rightRoot, new Vector3(HalfWidth + t / 2f, Height / 2f, zc), new Vector3(t, Height, depth), hull);
            }

            // The template's teleport ray lands on the whole floor.
            var teleport = floorRoot.AddComponent<TeleportationArea>();
            teleport.interactionLayers = InteractionLayerMask.GetMask("Teleport");
            Box("Wall_Back", root, new Vector3(0f, Height / 2f, -t / 2f), new Vector3(w, Height, t), hull);
            Box("Wall_Front", root, new Vector3(0f, Height / 2f, length + t / 2f), new Vector3(w, Height, t), hull);

            Box("Ceiling Strip", root, new Vector3(0f, Height - 0.01f, midZ), new Vector3(0.3f, 0.02f, length - 1f), accent, collider: false);
            Box("Floor Guide Left", root, new Vector3(-HalfWidth + 0.6f, 0.005f, midZ), new Vector3(0.05f, 0.01f, length - 1f), accent, collider: false);
            Box("Floor Guide Right", root, new Vector3(HalfWidth - 0.6f, 0.005f, midZ), new Vector3(0.05f, 0.01f, length - 1f), accent, collider: false);

            for (float z = 2f; z < length; z += 4f)
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
            const float w = 1400f, h = 1300f;
            var root = new GameObject("StationScreen");
            Box("Frame", root, new Vector3(0f, 0f, 0.03f), new Vector3(w / 1000f + 0.08f, h / 1000f + 0.08f, 0.05f), frameMat, collider: false);
            Box("Desk", root, new Vector3(0f, -ScreenHeight + 0.45f, -0.22f), new Vector3(1.3f, 0.9f, 0.4f), deskMat);

            var canvas = WorldCanvas(root, new Vector2(w, h));
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
                new Vector2(0, 0.58f), new Vector2(0.38f, 1), new Vector2(20, 0), new Vector2(0, -2));
            rowView.statsText = Label("Stats", row.rectTransform, 27, FontStyles.Normal, TextAlignmentOptions.Right, TextColor,
                new Vector2(0.38f, 0.58f), new Vector2(1, 1), new Vector2(12, 0), new Vector2(-20, -2));
            rowView.descriptionText = Label("Description", row.rectTransform, 28, FontStyles.Normal, TextAlignmentOptions.Left, DimText,
                new Vector2(0, 0.28f), new Vector2(1, 0.58f), new Vector2(20, 0), new Vector2(-20, 0));
            rowView.sourceText = Label("Source", row.rectTransform, 24, FontStyles.Italic, TextAlignmentOptions.Left, SourceText,
                new Vector2(0, 0), new Vector2(1, 0.28f), new Vector2(20, 2), new Vector2(-20, 0));
            rowView.descriptionText.textWrappingMode = rowView.sourceText.textWrappingMode = TextWrappingModes.NoWrap;
            // Long names or many stats shrink a little rather than being cut off.
            AutoSize(rowView.nameText, 26f);
            AutoSize(rowView.statsText, 22f);
            screen.optionTemplate = rowView;

            screen.detailsText = Label("Details", canvas, 32, FontStyles.Normal, TextAlignmentOptions.TopLeft, TextColor,
                Vector2.zero, Vector2.one, body, bodyTop);
            screen.detailsText.overflowMode = TextOverflowModes.Truncate;

            screen.statusText = Label("Status", canvas, 30, FontStyles.Normal, TextAlignmentOptions.Left, TextColor,
                new Vector2(0, 0), new Vector2(0.7f, 0), new Vector2(48, 30), new Vector2(0, 190));
            var action = Panel("Action", canvas, new Color(0.15f, 0.6f, 0.4f), new Vector2(0.7f, 0), new Vector2(1, 0),
                new Vector2(24, 60), new Vector2(-48, 160));
            screen.actionButton = MakeButton(action);
            screen.actionLabel = Label("Label", action.rectTransform, 40, FontStyles.Bold, TextAlignmentOptions.Center, Color.white,
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

        static RectTransform WorldCanvas(GameObject parent, Vector2 sizePx)
        {
            var go = new GameObject("Canvas", typeof(RectTransform));
            go.transform.SetParent(parent.transform, false);
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = sizePx;
            rt.localScale = Vector3.one * 0.001f; // 1 px = 1 mm
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

        static Material Mat(string name, Color color, Color? emission = null)
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
