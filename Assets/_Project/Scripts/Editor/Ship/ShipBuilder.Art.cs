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

        static Material plateMat, ribMat, trimMat, lightPanelMat, coveMat;

        /// <summary>Creates the dressing materials and the deck texture; call before any prefab is built.</summary>
        static void ArtMaterials(Material floor)
        {
            plateMat = Mat("Hull Plate", new Color(0.6f, 0.63f, 0.67f));
            ribMat = Mat("Rib", new Color(0.2f, 0.22f, 0.25f));
            trimMat = Mat("Trim", new Color(0.1f, 0.11f, 0.13f));
            lightPanelMat = Mat("Light Panel", new Color(0.9f, 0.93f, 1f), emission: new Color(1.6f, 1.7f, 1.8f));
            coveMat = Mat("Cove Light", new Color(0.7f, 0.85f, 1f), emission: new Color(0.6f, 1.1f, 1.6f));

            var deck = DeckTexture();
            floor.SetColor("_BaseColor", Color.white);
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

        static void RoomDressing(GameObject root, Material accent)
        {
            float step = 360f / WallSegments;
            float inner = RoomRadius - 0.03f;
            var ribs = Group("Hull Ribs", root);
            var frames = Group("Window Frames", root);
            var lights = Group("Light Strips", root);
            // Half the angle a cover spans, plus a margin: no rib runs up behind a cover.
            float coverHalf = Mathf.Atan(CoverWidthPx * CoverScale / 2f / CoverRadius) * Mathf.Rad2Deg + 1.5f;

            for (int s = 0; s < WallSegments; s++)
            {
                float edge = s * step, centre = edge + step / 2f;
                bool windowEdge = IsWindowSegment(edge - step / 2f) || IsWindowSegment(edge + step / 2f);
                bool behindCover = Enumerable.Range(0, CoverSteps.Length).Any(i => Mathf.Abs(Mathf.DeltaAngle(CoverAzimuth(i), edge)) < coverHalf);

                // Where two segments meet: a window mullion, or a rib up the solid wall.
                if (windowEdge)
                    Dressing($"Mullion {s:00}", frames, OnCircle(edge, inner - 0.02f, (WindowBottom + WindowTop) / 2f), edge,
                        new Vector3(0.08f, WindowTop - WindowBottom, 0.06f), trimMat);
                else if (!behindCover)
                    Dressing($"Rib {s:00}", ribs, OnCircle(edge, inner - 0.03f, Height / 2f), edge, new Vector3(0.12f, Height, 0.08f), ribMat);

                float chord = 2f * inner * Mathf.Tan(step / 2f * Mathf.Deg2Rad);
                if (IsWindowSegment(centre))
                {
                    Dressing($"Window Sill {s:00}", frames, OnCircle(centre, inner - 0.04f, WindowBottom), centre, new Vector3(chord, 0.06f, 0.14f), trimMat);
                    Dressing($"Window Top {s:00}", frames, OnCircle(centre, inner - 0.02f, WindowTop), centre, new Vector3(chord, 0.06f, 0.08f), trimMat);
                    Dressing($"Sill Light {s:00}", lights, OnCircle(centre, inner - 0.11f, WindowBottom - 0.05f), centre, new Vector3(chord, 0.02f, 0.01f), accent);
                }
                // A kick plate along the deck and a cove strip along the top of the wall, all the way round.
                Dressing($"Kick {s:00}", ribs, OnCircle(centre, inner - 0.01f, 0.06f), centre, new Vector3(chord, 0.12f, 0.02f), trimMat);
                Dressing($"Cove {s:00}", lights, OnCircle(centre, inner - 0.02f, Height - 0.15f), centre, new Vector3(chord, 0.04f, 0.03f), coveMat);
            }

            // A light ring on the ceiling and a glowing ring on the deck round the CubeSat stand.
            const int ringPieces = 24;
            for (int i = 0; i < ringPieces; i++)
            {
                float a = i * 360f / ringPieces;
                Dressing($"Ceiling Light {i:00}", lights, OnCircle(a, 2.6f, Height - 0.01f), a, new Vector3(0.62f, 0.02f, 0.3f), lightPanelMat);
                Dressing($"Deck Ring {i:00}", lights, OnCircle(a, 1.1f, 0.005f), a, new Vector3(0.29f, 0.01f, 0.04f), accent);
            }
            foreach (var r in lights.GetComponentsInChildren<MeshRenderer>()) r.shadowCastingMode = ShadowCastingMode.Off;
            foreach (var r in frames.GetComponentsInChildren<MeshRenderer>()) r.shadowCastingMode = ShadowCastingMode.Off;
            foreach (var r in ribs.GetComponentsInChildren<MeshRenderer>()) r.shadowCastingMode = ShadowCastingMode.Off;
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
