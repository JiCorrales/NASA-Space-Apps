using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace SpaceApps.Ship.Editor
{
    /// <summary>
    /// The room's dressing, built from primitives and URP materials: ribs between the wall segments, window frames,
    /// light strips along the top of the wall and on the deck, a ceiling light ring, and a plated deck (a texture
    /// this builder draws). Nothing here has a collider, so the walls and floor alone decide where players walk.
    /// The glowing pieces stand in for point lights, which the browser quality level does not draw.
    /// </summary>
    public static partial class ShipBuilder
    {
        const string TexturesDir = Root + "/Art/Textures";
        const string DeckTexturePath = TexturesDir + "/DeckPlates.png";
        /// <summary>Metres of deck covered by one copy of the deck texture (two by two plates of 0.75 m).</summary>
        const float DeckTile = 1.5f;

        const string HullTexturePath = "Assets/ThirdParty/PolyHaven/blue_metal_plate/blue_metal_plate_diff_2k.jpg";
        const string WallMeshPath = Root + "/Art/Meshes/RoomWall.asset";
        const string ConsoleModelPath = Root + "/Art/Models/Ship_Console.fbx";
        /// <summary>Metres of wall covered by one copy of the hull texture, both ways.</summary>
        const float HullTile = 3f;
        const float BeltHeight = WindowTop;

        static Material plateMat, plateDarkMat, ceilingMat, ribMat, trimMat, lightPanelMat, coveMat, warmMat, consoleMat, consoleTopMat;
        static Material[] buttonMats;

        /// <summary>
        /// A material that shows a texture and also glows with it a little, so the plates stay readable in the
        /// browser's flat lighting (no point lights, no post-processing).
        /// </summary>
        static Material TexturedGlow(string name, Texture2D texture, Color tint, float glow, float tile)
        {
            var mat = Mat(name, tint, texture: texture);
            mat.SetTextureScale("_BaseMap", new Vector2(tile, tile));
            mat.SetFloat("_Smoothness", 0.25f);
            mat.EnableKeyword("_EMISSION");
            mat.SetTexture("_EmissionMap", texture);
            mat.SetTextureScale("_EmissionMap", new Vector2(tile, tile));
            mat.SetColor("_EmissionColor", new Color(glow, glow, glow));
            mat.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
            EditorUtility.SetDirty(mat);
            return mat;
        }

        /// <summary>Creates the dressing materials and the deck texture; call before any prefab is built.</summary>
        static void ArtMaterials(Material floor)
        {
            var hullTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(HullTexturePath);
            if (hullTexture == null) Debug.LogWarning($"[ShipBuilder] {HullTexturePath} missing; the hull will be plain.");
            // The wall mesh carries its own UVs in metres / HullTile, so these two keep a tile of 1.
            plateMat = TexturedGlow("Hull Plate", hullTexture, new Color(0.9f, 0.95f, 1f), 1.6f, 1f);
            plateDarkMat = TexturedGlow("Hull Plate Dark", hullTexture, new Color(0.7f, 0.75f, 0.85f), 0.9f, 1f);
            // The ceiling disc maps its texture once across the diameter: repeat it every HullTile metres.
            ceilingMat = TexturedGlow("Ceiling", hullTexture, new Color(0.8f, 0.85f, 0.95f), 0.7f, (RoomRadius + WallThickness) * 2f / HullTile);
            ribMat = Mat("Rib", new Color(0.1f, 0.12f, 0.16f));
            trimMat = Mat("Trim", new Color(0.05f, 0.06f, 0.08f));
            lightPanelMat = Mat("Light Panel", new Color(0.9f, 0.93f, 1f), emission: new Color(0.9f, 1.0f, 1.15f));
            coveMat = Mat("Cove Light", new Color(0.7f, 0.85f, 1f), emission: new Color(0.6f, 1.1f, 1.6f));
            warmMat = Mat("Warm Light", new Color(0.8f, 0.25f, 0.15f), emission: new Color(1.0f, 0.2f, 0.1f));
            consoleMat = Mat("Console", new Color(0.18f, 0.2f, 0.25f));
            consoleTopMat = Mat("Console Top", new Color(0.07f, 0.08f, 0.1f));
            buttonMats = new[]
            {
                Mat("Button Green", new Color(0.2f, 0.8f, 0.4f), emission: new Color(0.2f, 1.2f, 0.5f)),
                Mat("Button Amber", new Color(0.9f, 0.6f, 0.15f), emission: new Color(1.3f, 0.8f, 0.15f)),
                Mat("Button Blue", new Color(0.2f, 0.55f, 0.9f), emission: new Color(0.25f, 0.8f, 1.5f)),
            };

            var deck = DeckTexture();
            floor.SetColor("_BaseColor", new Color(0.8f, 0.85f, 0.95f));
            floor.SetTexture("_BaseMap", deck);
            // The deck disc's top maps the texture once across its diameter; repeat it every DeckTile metres.
            float tiles = (RoomRadius + WallThickness) * 2f / DeckTile;
            floor.SetTextureScale("_BaseMap", new Vector2(tiles, tiles));
            floor.SetFloat("_Smoothness", 0.45f);
            floor.SetFloat("_Metallic", 0.3f);
            EditorUtility.SetDirty(floor);
        }

        static GameObject Dressing(string name, GameObject parent, Vector3 position, float yaw, Vector3 scale, Material mat)
        {
            var box = Box(name, parent, position, scale, mat, collider: false);
            box.transform.localRotation = Quaternion.Euler(0f, yaw, 0f);
            return box;
        }

        /// <summary>
        /// The inner face of the wall as one mesh with two sub-meshes: textured blue plates from the kick plate up to
        /// the belt (on window segments only the sill), and a darker band from the belt to the ceiling. UVs run in
        /// metres, so the texture is the same size on every plate. The boxes behind it keep the colliders.
        /// </summary>
        static Mesh WallMesh()
        {
            EnsureFolder(Root + "/Art/Meshes");
            var mesh = AssetDatabase.LoadAssetAtPath<Mesh>(WallMeshPath);
            if (mesh == null)
            {
                mesh = new Mesh { name = "RoomWall" };
                AssetDatabase.CreateAsset(mesh, WallMeshPath);
            }
            float step = 360f / WallSegments;
            float face = RoomRadius - 0.012f;
            float corner = face / Mathf.Cos(step / 2f * Mathf.Deg2Rad);
            float chord = 2f * face * Mathf.Tan(step / 2f * Mathf.Deg2Rad);
            var vertices = new System.Collections.Generic.List<Vector3>();
            var normals = new System.Collections.Generic.List<Vector3>();
            var uvs = new System.Collections.Generic.List<Vector2>();
            var plates = new System.Collections.Generic.List<int>();
            var band = new System.Collections.Generic.List<int>();

            void Quad(System.Collections.Generic.List<int> tris, int s, float y0, float y1)
            {
                float a0 = s * step, a1 = (s + 1) * step, mid = (s + 0.5f) * step;
                var normal = -OnCircle(mid, 1f);
                float u0 = s * chord / HullTile, u1 = (s + 1) * chord / HullTile;
                int v = vertices.Count;
                vertices.Add(OnCircle(a0, corner, y0)); vertices.Add(OnCircle(a0, corner, y1));
                vertices.Add(OnCircle(a1, corner, y1)); vertices.Add(OnCircle(a1, corner, y0));
                for (int i = 0; i < 4; i++) normals.Add(normal);
                uvs.Add(new Vector2(u0, y0 / HullTile)); uvs.Add(new Vector2(u0, y1 / HullTile));
                uvs.Add(new Vector2(u1, y1 / HullTile)); uvs.Add(new Vector2(u1, y0 / HullTile));
                // Wound so the face looks towards the centre of the room.
                tris.AddRange(new[] { v, v + 1, v + 2, v, v + 2, v + 3 });
            }

            const float kick = 0.12f;
            for (int s = 0; s < WallSegments; s++)
            {
                bool window = IsWindowSegment((s + 0.5f) * step);
                Quad(plates, s, kick, window ? WindowBottom : BeltHeight);
                Quad(band, s, window ? WindowTop : BeltHeight, Height);
            }
            mesh.Clear();
            mesh.SetVertices(vertices);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.subMeshCount = 2;
            mesh.SetTriangles(plates, 0);
            mesh.SetTriangles(band, 1);
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();
            EditorUtility.SetDirty(mesh);
            return mesh;
        }

        static void RoomDressing(GameObject root, Material accent)
        {
            float step = 360f / WallSegments;
            float inner = RoomRadius - 0.03f;
            var ribs = Group("Hull Ribs", root);
            var frames = Group("Window Frames", root);
            var lights = Group("Light Strips", root);
            // Half the angle a cover spans, plus a margin: no rib runs up behind a cover.
            float coverHalf = Mathf.Atan(CoverWidthPx * CoverScale / 2f / CoverRadius) * Mathf.Rad2Deg + 1.5f;

            var wall = Group("Wall Plates", root);
            wall.AddComponent<MeshFilter>().sharedMesh = WallMesh();
            var wallRenderer = wall.AddComponent<MeshRenderer>();
            wallRenderer.sharedMaterials = new[] { plateMat, plateDarkMat };
            wallRenderer.shadowCastingMode = ShadowCastingMode.Off;

            for (int s = 0; s < WallSegments; s++)
            {
                float edge = s * step, centre = edge + step / 2f;
                bool windowEdge = IsWindowSegment(edge - step / 2f) || IsWindowSegment(edge + step / 2f);
                bool behindCover = Enumerable.Range(0, CoverSteps.Length).Any(i => Mathf.Abs(Mathf.DeltaAngle(CoverAzimuth(i), edge)) < coverHalf);

                // Where two segments meet: a window mullion, or a rib up the solid wall.
                if (windowEdge)
                    Dressing($"Mullion {s:00}", frames, OnCircle(edge, inner - 0.02f, (WindowBottom + WindowTop) / 2f), edge,
                        new Vector3(0.1f, WindowTop - WindowBottom, 0.08f), trimMat);
                else if (!behindCover)
                    Dressing($"Rib {s:00}", ribs, OnCircle(edge, inner - 0.03f, Height / 2f), edge, new Vector3(0.14f, Height, 0.1f), ribMat);

                float chord = 2f * inner * Mathf.Tan(step / 2f * Mathf.Deg2Rad);
                if (IsWindowSegment(centre))
                {
                    Dressing($"Window Sill {s:00}", frames, OnCircle(centre, inner - 0.04f, WindowBottom), centre, new Vector3(chord, 0.06f, 0.14f), trimMat);
                    Dressing($"Window Top {s:00}", frames, OnCircle(centre, inner - 0.02f, WindowTop), centre, new Vector3(chord, 0.06f, 0.08f), trimMat);
                    // A warm strip under the glass, the colour of the nebula outside, against the cool cyan everywhere else.
                    Dressing($"Sill Light {s:00}", lights, OnCircle(centre, inner - 0.11f, WindowBottom - 0.05f), centre, new Vector3(chord, 0.02f, 0.01f), warmMat);
                }
                else
                {
                    // A belt rail where the blue plates meet the dark band, so the wall reads as two tiers of armour.
                    Dressing($"Belt {s:00}", ribs, OnCircle(centre, inner - 0.02f, BeltHeight), centre, new Vector3(chord, 0.07f, 0.05f), trimMat);
                }
                // A kick plate along the deck and a cove strip along the top of the wall, all the way round.
                Dressing($"Kick {s:00}", ribs, OnCircle(centre, inner - 0.01f, 0.06f), centre, new Vector3(chord, 0.12f, 0.04f), trimMat);
                Dressing($"Cove {s:00}", lights, OnCircle(centre, inner - 0.02f, Height - 0.15f), centre, new Vector3(chord, 0.04f, 0.03f), coveMat);
            }

            // A light ring on the ceiling and a glowing ring on the deck round the CubeSat stand.
            const int ringPieces = 24;
            for (int i = 0; i < ringPieces; i++)
            {
                float a = i * 360f / ringPieces;
                Dressing($"Ceiling Light {i:00}", lights, OnCircle(a, 2.6f, Height - 0.01f), a, new Vector3(0.62f, 0.02f, 0.3f), lightPanelMat);
                Dressing($"Deck Ring {i:00}", lights, OnCircle(a, 1.1f, 0.005f), a, new Vector3(0.29f, 0.01f, 0.04f), accent);

                // Ceiling beams: a radial one between each pair of light panels, and two rings of dark girders.
                float between = a + 360f / ringPieces / 2f;
                if (i % 2 == 0)
                    Dressing($"Ceiling Beam {i:00}", ribs, OnCircle(between, 2.6f, Height - 0.04f), between, new Vector3(0.14f, 0.07f, 2.0f), ribMat);
                // The inner ring glows the red of the nebula outside; the outer one is a dark girder.
                foreach (float r in new[] { 1.6f, 3.6f })
                {
                    float girder = 2f * r * Mathf.Tan(Mathf.PI / ringPieces) + 0.02f;
                    Dressing($"Ceiling Ring {r:0.0} {i:00}", ribs, OnCircle(a, r, Height - 0.04f), a, new Vector3(girder, 0.07f, 0.14f), r < 2f ? warmMat : ribMat);
                }
            }

            for (int i = 0; i < CoverSteps.Length; i++) CoverConsole(root, i);

            foreach (var r in lights.GetComponentsInChildren<MeshRenderer>()) r.shadowCastingMode = ShadowCastingMode.Off;
            foreach (var r in frames.GetComponentsInChildren<MeshRenderer>()) r.shadowCastingMode = ShadowCastingMode.Off;
            foreach (var r in ribs.GetComponentsInChildren<MeshRenderer>()) r.shadowCastingMode = ShadowCastingMode.Off;
        }

        /// <summary>
        /// An operator console (the Blender model Ship_Console) standing under each cover with its back to the wall,
        /// scaled to the cover's width. Its top, 1.07 m up, stays below the cover's frame.
        /// </summary>
        static void CoverConsole(GameObject root, int i)
        {
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(ConsoleModelPath);
            if (model == null) { Debug.LogWarning($"[ShipBuilder] {ConsoleModelPath} missing; no consoles."); return; }
            float azimuth = CoverAzimuth(i);
            var go = (GameObject)PrefabUtility.InstantiatePrefab(model);
            go.name = $"Console {i + 1}";
            go.transform.SetParent(root.transform, false);
            // The model faces +z with its back edge at the origin: turn it to face the room and put it against the wall.
            go.transform.SetLocalPositionAndRotation(OnCircle(azimuth, RoomRadius - 0.2f), Quaternion.Euler(0f, azimuth + 180f, 0f));
            float scale = CoverWidthPx * CoverScale / 1.24f;
            go.transform.localScale = new Vector3(scale, 1f, scale * 0.8f);
            foreach (var r in go.GetComponentsInChildren<MeshRenderer>())
            {
                r.shadowCastingMode = ShadowCastingMode.Off;
                var slots = r.sharedMaterials;
                for (int m = 0; m < slots.Length; m++)
                    slots[m] = slots[m] == null ? null : slots[m].name switch
                    {
                        "Dark" => consoleTopMat,
                        "Hull" => consoleMat,
                        "Metal" => ribMat,
                        "Panel" => consoleTopMat,
                        "Emissive" => buttonMats[(i + m) % buttonMats.Length],
                        _ => slots[m],
                    };
                r.sharedMaterials = slots;
            }
            var box = go.AddComponent<BoxCollider>();
            box.center = new Vector3(0f, 0.5f, 0.36f);
            box.size = new Vector3(1.24f, 1f, 0.7f);
        }

        // ---------- deck texture ----------

        /// <summary>
        /// Draws the deck texture: two by two steel plates with dark seams, a bevel, corner bolts and a diagonal tread,
        /// from a fixed seed so every rerun writes the same file. Imported repeating, with mipmaps.
        /// </summary>
        static Texture2D DeckTexture()
        {
            EnsureFolder(TexturesDir);
            const int size = 512, plate = size / 2, seam = 3, bolt = 5, boltInset = 16;
            var random = new System.Random(20261115);
            var tones = Enumerable.Range(0, 4).Select(_ => (float)(random.NextDouble() * 0.05 - 0.025)).ToArray();
            var pixels = new Color32[size * size];
            for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
            {
                int px = x % plate, py = y % plate;
                float v = 0.36f + tones[(x / plate) + 2 * (y / plate)] + (float)(random.NextDouble() * 0.03 - 0.015);

                // Diagonal tread: short raised dashes in alternating directions.
                int a = (x + y) % 24, b = (x - y + size) % 24;
                bool cellA = ((x / 12) + (y / 12)) % 2 == 0;
                if (cellA ? a < 3 && b > 4 && b < 20 : b < 3 && a > 4 && a < 20) v += 0.06f;
                else if (cellA ? a == 3 && b > 4 && b < 20 : b == 3 && a > 4 && a < 20) v -= 0.04f;

                int edge = Mathf.Min(Mathf.Min(px, plate - 1 - px), Mathf.Min(py, plate - 1 - py));
                if (edge < seam) v = 0.07f;
                else if (edge < seam + 2) v += (px < seam + 2 || py >= plate - seam - 2) ? 0.08f : -0.06f; // bevel lit from the top left

                foreach (int cx in new[] { boltInset, plate - 1 - boltInset })
                foreach (int cy in new[] { boltInset, plate - 1 - boltInset })
                {
                    float d = Mathf.Sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
                    if (d < bolt - 1.5f) v = 0.5f - d * 0.03f;
                    else if (d < bolt) v = 0.12f;
                }

                byte g = (byte)(Mathf.Clamp01(v) * 255f);
                byte blue = (byte)(Mathf.Clamp01(v * 1.08f) * 255f);
                pixels[y * size + x] = new Color32(g, g, blue, 255);
            }

            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
            texture.SetPixels32(pixels);
            texture.Apply();
            byte[] png = texture.EncodeToPNG();
            Object.DestroyImmediate(texture);

            string full = Path.GetFullPath(DeckTexturePath);
            if (!File.Exists(full) || !File.ReadAllBytes(full).SequenceEqual(png))
            {
                File.WriteAllBytes(full, png);
                AssetDatabase.ImportAsset(DeckTexturePath, ImportAssetOptions.ForceUpdate);
            }
            var importer = (TextureImporter)AssetImporter.GetAtPath(DeckTexturePath);
            if (importer.wrapMode != TextureWrapMode.Repeat || importer.anisoLevel != 4 || importer.maxTextureSize != 512)
            {
                importer.wrapMode = TextureWrapMode.Repeat;
                importer.mipmapEnabled = true;
                importer.anisoLevel = 4;
                importer.maxTextureSize = 512;
                importer.SaveAndReimport();
            }
            return AssetDatabase.LoadAssetAtPath<Texture2D>(DeckTexturePath);
        }
    }
}
