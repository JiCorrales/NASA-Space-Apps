using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace SpaceApps.Ship.Editor
{
    /// <summary>
    /// The ship's dressing, built from primitives and URP materials: hull plating with ribs, light strips,
    /// a plated deck (a texture this builder draws), window frames and consoles under the station screens.
    /// Nothing here has a collider, except the console cabinet, so the walls and floor still decide where players walk.
    /// </summary>
    public static partial class ShipBuilder
    {
        const string TexturesDir = Root + "/Art/Textures";
        const string DeckTexturePath = TexturesDir + "/DeckPlates.png";
        /// <summary>Metres of deck covered by one copy of the deck texture (two by two plates of 0.75 m).</summary>
        const float DeckTile = 1.5f;
        const float RibSpacing = 1.5f;
        const float CoveHeight = 2.88f;

        static Material plateMat, ribMat, trimMat, lightPanelMat, coveMat, consoleMat, consoleTopMat;
        static Material[] buttonMats;

        /// <summary>Creates the dressing materials and the deck texture; call before any prefab is built.</summary>
        static void ArtMaterials(Material floor)
        {
            plateMat = Mat("Hull Plate", new Color(0.6f, 0.63f, 0.67f));
            ribMat = Mat("Rib", new Color(0.2f, 0.22f, 0.25f));
            trimMat = Mat("Trim", new Color(0.1f, 0.11f, 0.13f));
            lightPanelMat = Mat("Light Panel", new Color(0.9f, 0.93f, 1f), emission: new Color(1.6f, 1.7f, 1.8f));
            coveMat = Mat("Cove Light", new Color(0.7f, 0.85f, 1f), emission: new Color(0.6f, 1.1f, 1.6f));
            consoleMat = Mat("Console", new Color(0.24f, 0.26f, 0.3f));
            consoleTopMat = Mat("Console Top", new Color(0.1f, 0.11f, 0.14f));
            buttonMats = new[]
            {
                Mat("Button Green", new Color(0.2f, 0.8f, 0.4f), emission: new Color(0.2f, 1.2f, 0.5f)),
                Mat("Button Amber", new Color(0.9f, 0.6f, 0.15f), emission: new Color(1.3f, 0.8f, 0.15f)),
                Mat("Button Blue", new Color(0.2f, 0.55f, 0.9f), emission: new Color(0.25f, 0.8f, 1.5f)),
            };

            var deck = DeckTexture();
            floor.SetColor("_BaseColor", Color.white);
            floor.SetTexture("_BaseMap", deck);
            // Floor pieces are one station long and the corridor wide; the texture repeats every DeckTile metres.
            floor.SetTextureScale("_BaseMap", new Vector2((HalfWidth * 2f + WallThickness * 2f) / DeckTile, StationSpacing / DeckTile));
            floor.SetFloat("_Smoothness", 0.45f);
            floor.SetFloat("_Metallic", 0.3f);
            EditorUtility.SetDirty(floor);
        }

        // ---------- hull ----------

        /// <summary>Ribs, ceiling plates, ceiling light panels and cove light strips for a corridor of this length.</summary>
        static void HullDressing(GameObject root, float length, float[] lightZs)
        {
            var leftMounts = Mounts(left: true);
            var rightMounts = Mounts(left: false);
            // Ribs stay clear of screens, dashboards and window openings, and frame both sides of every window.
            var leftWindows = Windows(leftMounts, length);
            var rightWindows = Windows(rightMounts, length);
            leftMounts.AddRange(leftWindows);
            rightMounts.AddRange(rightWindows);
            bool Covered(List<(float from, float to)> mounts, float z) => mounts.Any(m => z > m.from - 0.1f && z < m.to + 0.1f);
            bool NearLight(float z) => lightZs.Any(l => Mathf.Abs(l - z) < 0.6f);

            var ribs = Group("Hull Ribs", root);
            for (float z = RibSpacing; z < length - 0.5f; z += RibSpacing)
            {
                // A rib runs up each wall where no screen hangs and across the ceiling between light panels.
                if (!Covered(leftMounts, z))
                    Box($"Rib Left {z:0.0}", ribs, new Vector3(-HalfWidth + 0.03f, 1.41f, z), new Vector3(0.06f, 2.82f, 0.12f), ribMat, collider: false);
                if (!Covered(rightMounts, z))
                    Box($"Rib Right {z:0.0}", ribs, new Vector3(HalfWidth - 0.03f, 1.41f, z), new Vector3(0.06f, 2.82f, 0.12f), ribMat, collider: false);
                if (!NearLight(z))
                    Box($"Beam {z:0.0}", ribs, new Vector3(0f, Height - 0.04f, z), new Vector3(HalfWidth * 2f, 0.06f, 0.12f), ribMat, collider: false);
            }

            foreach (var (from, to) in leftWindows)
            foreach (float z in new[] { from - 0.06f, to + 0.06f })
                Box($"Rib Left Window {z:0.00}", ribs, new Vector3(-HalfWidth + 0.03f, 1.41f, z), new Vector3(0.06f, 2.82f, 0.12f), ribMat, collider: false);
            foreach (var (from, to) in rightWindows)
            foreach (float z in new[] { from - 0.06f, to + 0.06f })
                Box($"Rib Right Window {z:0.00}", ribs, new Vector3(HalfWidth - 0.03f, 1.41f, z), new Vector3(0.06f, 2.82f, 0.12f), ribMat, collider: false);

            var ceiling = Group("Ceiling Plates", root);
            int pieces = Mathf.CeilToInt(length / StationSpacing);
            for (int i = 0; i < pieces; i++)
            {
                float z0 = i * StationSpacing + 0.04f, z1 = Mathf.Min(length, (i + 1) * StationSpacing) - 0.04f;
                foreach (float side in new[] { -1f, 1f })
                    Box($"Ceiling Plate {i} {(side < 0 ? "L" : "R")}", ceiling, new Vector3(side * (HalfWidth + 0.2f) / 2f, Height - 0.005f, (z0 + z1) / 2f),
                        new Vector3(HalfWidth - 0.24f, 0.01f, z1 - z0), plateMat, collider: false);
            }

            var lights = Group("Light Panels", root);
            foreach (float z in lightZs)
            foreach (float side in new[] { -1f, 1f })
                Box($"Light Panel {z:0} {(side < 0 ? "L" : "R")}", lights, new Vector3(side * 1.0f, Height - 0.02f, z), new Vector3(0.5f, 0.02f, 0.8f), lightPanelMat, collider: false);

            // Cove strips along the top of both walls, the length of the corridor.
            Box("Cove Light Left", lights, new Vector3(-HalfWidth + 0.015f, CoveHeight, length / 2f), new Vector3(0.03f, 0.04f, length - 0.4f), coveMat, collider: false);
            Box("Cove Light Right", lights, new Vector3(HalfWidth - 0.015f, CoveHeight, length / 2f), new Vector3(0.03f, 0.04f, length - 0.4f), coveMat, collider: false);
        }

        /// <summary>
        /// Plates on the inner face of a wall stretch from z0 to z1 and height y0 to y1: a dark kick plate at the floor,
        /// then rows of lighter plates whose gaps show the darker hull as seams. Stretches over 1.6 m get two plates per row.
        /// </summary>
        static void WallPlates(GameObject wall, float wallX, float z0, float z1, float y0, float y1)
        {
            if (z1 - z0 < 0.3f) return;
            float inward = -Mathf.Sign(wallX);
            float face = wallX + inward * WallThickness / 2f;
            var rows = new List<(float from, float to)> { (0.14f, 0.98f), (1.04f, 2.2f), (2.26f, 2.82f) };
            if (y0 <= 0f)
                Box($"{wall.name} Kick {z0:0.00}", wall, new Vector3(face + inward * 0.01f, 0.06f, (z0 + z1) / 2f), new Vector3(0.02f, 0.12f, z1 - z0), trimMat, collider: false);

            int columns = z1 - z0 > 1.6f ? 2 : 1;
            float width = (z1 - z0) / columns;
            foreach (var (from, to) in rows)
            {
                float a = Mathf.Max(from, y0), b = Mathf.Min(to, y1);
                if (b - a < 0.1f) continue;
                for (int c = 0; c < columns; c++)
                {
                    float za = z0 + c * width + 0.03f, zb = z0 + (c + 1) * width - 0.03f;
                    Box($"{wall.name} Plate {za:0.00} {a:0.00}", wall, new Vector3(face + inward * 0.005f, (a + b) / 2f, (za + zb) / 2f),
                        new Vector3(0.01f, b - a, zb - za), plateMat, collider: false);
                }
            }
        }

        /// <summary>A dark frame around a side window opening from z0 to z1, between WindowBottom and WindowTop.</summary>
        static void WindowFrame(GameObject wall, float wallX, float z0, float z1, string name)
        {
            float inward = -Mathf.Sign(wallX);
            float x = wallX + inward * (WallThickness / 2f + 0.02f);
            float h = WindowTop - WindowBottom;
            Box($"{name} Frame Left", wall, new Vector3(x, (WindowBottom + WindowTop) / 2f, z0 + 0.03f), new Vector3(0.04f, h, 0.06f), trimMat, collider: false);
            Box($"{name} Frame Right", wall, new Vector3(x, (WindowBottom + WindowTop) / 2f, z1 - 0.03f), new Vector3(0.04f, h, 0.06f), trimMat, collider: false);
            Box($"{name} Frame Top", wall, new Vector3(x, WindowTop - 0.03f, (z0 + z1) / 2f), new Vector3(0.04f, 0.06f, z1 - z0), trimMat, collider: false);
            // A mullion splits long windows into panes, like a real pressure window.
            if (z1 - z0 > 2f)
                Box($"{name} Mullion", wall, new Vector3(x, (WindowBottom + WindowTop) / 2f, (z0 + z1) / 2f), new Vector3(0.04f, h, 0.05f), trimMat, collider: false);
        }

        /// <summary>The same frame for the wide window in the far wall, which faces -z.</summary>
        static void FrontWindowFrame(GameObject front, float z, float pane)
        {
            float h = WindowTop - WindowBottom, zf = z - WallThickness / 2f - 0.02f;
            Box("Front Frame Left", front, new Vector3(-pane + 0.03f, (WindowBottom + WindowTop) / 2f, zf), new Vector3(0.06f, h, 0.04f), trimMat, collider: false);
            Box("Front Frame Right", front, new Vector3(pane - 0.03f, (WindowBottom + WindowTop) / 2f, zf), new Vector3(0.06f, h, 0.04f), trimMat, collider: false);
            Box("Front Frame Top", front, new Vector3(0f, WindowTop - 0.03f, zf), new Vector3(2f * pane, 0.06f, 0.04f), trimMat, collider: false);
            Box("Front Frame Bottom", front, new Vector3(0f, WindowBottom + 0.03f, zf), new Vector3(2f * pane, 0.06f, 0.04f), trimMat, collider: false);
            Box("Front Mullion", front, new Vector3(0f, (WindowBottom + WindowTop) / 2f, zf), new Vector3(0.05f, h, 0.04f), trimMat, collider: false);
        }

        // ---------- console ----------

        /// <summary>
        /// The console under a station screen, in the screen's local space (-z faces the player, the floor is at
        /// -ScreenHeight): a cabinet with a kick recess, a sloped top with rows of lit buttons, kept below the screen
        /// so it never sits between the player and the screen's lowest buttons.
        /// </summary>
        static void Console(GameObject root)
        {
            float floorY = -ScreenHeight;
            var console = Group("Console", root);
            // The cabinet keeps the old desk's collider, so players still stop in front of the screen.
            Box("Cabinet", console, new Vector3(0f, floorY + 0.42f, -0.2f), new Vector3(1.3f, 0.6f, 0.36f), consoleMat);
            Box("Kick", console, new Vector3(0f, floorY + 0.06f, -0.17f), new Vector3(1.24f, 0.12f, 0.3f), trimMat, collider: false);
            Box("Edge Light", console, new Vector3(0f, floorY + 0.7f, -0.385f), new Vector3(1.26f, 0.015f, 0.01f), coveMat, collider: false);

            // The sloped top, tilted 15 degrees towards the player; buttons are its children so they tilt with it.
            // Its back edge stays below the screen's bottom edge (0.81 m under the screen centre).
            var top = Group("Top", console);
            top.transform.localPosition = new Vector3(0f, floorY + 0.74f, -0.2f);
            top.transform.localRotation = Quaternion.Euler(-15f, 0f, 0f);
            Box("Panel", top, Vector3.zero, new Vector3(1.32f, 0.04f, 0.44f), consoleTopMat, collider: false);
            var random = new System.Random(7);
            for (int row = 0; row < 3; row++)
            for (int col = 0; col < 9; col++)
            {
                if (random.NextDouble() < 0.25) continue; // gaps, so the rows do not read as a grid of identical keys
                var mat = buttonMats[random.Next(buttonMats.Length)];
                Box($"Button {row}{col}", top, new Vector3(-0.48f + col * 0.12f, 0.025f, -0.12f + row * 0.1f), new Vector3(0.06f, 0.012f, 0.05f), mat, collider: false);
            }
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
