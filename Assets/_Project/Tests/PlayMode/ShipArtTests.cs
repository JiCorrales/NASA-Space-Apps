using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpaceApps.UI;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>The ship's dressing: consoles, plating, light strips, the deck, windows and screen legibility.</summary>
    public sealed class ShipArtTests
    {
        [UnitySetUp]
        public IEnumerator LoadShip()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
        }

        static float ScreenBottom(StationScreen screen)
        {
            var corners = new Vector3[4];
            screen.GetComponentInChildren<Canvas>().GetComponent<RectTransform>().GetWorldCorners(corners);
            return corners.Min(c => c.y);
        }

        [Test]
        public void EveryStationHasAConsoleBelowItsScreen()
        {
            foreach (var screen in Ui.Screens())
            {
                var console = screen.transform.Find("Console");
                Assert.IsNotNull(console, $"no console at {screen.stationTitle}");
                Assert.IsNotNull(console.Find("Cabinet").GetComponent<Collider>(), "the cabinet stops players walking into the screen");
                Assert.Greater(console.GetComponentsInChildren<Renderer>().Count(r => r.name.StartsWith("Button")), 5, "lit buttons on the console");
                float top = console.GetComponentsInChildren<Renderer>().Max(r => r.bounds.max.y);
                Assert.Less(top, ScreenBottom(screen), $"the console at {screen.stationTitle} covers the bottom of its screen");
            }
        }

        // At 2 m, 0.75 degrees is about the size of 10 pt print held at reading distance.
        [Test]
        public void ScreenTextIsReadableFromTwoMetres()
        {
            foreach (var screen in Ui.Screens())
            foreach (var text in screen.GetComponentsInChildren<TMP_Text>(true))
            {
                float px = text.enableAutoSizing ? text.fontSizeMin : text.fontSize;
                float metres = px * text.transform.lossyScale.y;
                float degrees = 2f * Mathf.Atan(metres / 2f / 2f) * Mathf.Rad2Deg;
                Assert.GreaterOrEqual(degrees, 0.75f, $"{screen.stationTitle}/{text.name} is {degrees:0.00} degrees tall at 2 m");
            }
        }

        [Test]
        public void TheHullHasPlatesRibsAndLightStrips()
        {
            Assert.Greater(GameObject.Find("Wall_Left").GetComponentsInChildren<Transform>().Count(t => t.name.Contains(" Plate ")), 10);
            Assert.Greater(GameObject.Find("Wall_Right").GetComponentsInChildren<Transform>().Count(t => t.name.Contains(" Plate ")), 10);
            var ribs = GameObject.Find("Hull Ribs").GetComponentsInChildren<Transform>();
            Assert.IsTrue(ribs.Any(t => t.name.StartsWith("Rib Left")), "ribs on the left wall");
            Assert.IsTrue(ribs.Any(t => t.name.StartsWith("Rib Right")), "ribs on the right wall");
            Assert.IsTrue(ribs.Any(t => t.name.StartsWith("Beam")), "beams across the ceiling");
            Assert.IsNotNull(GameObject.Find("Cove Light Left"));
            Assert.IsNotNull(GameObject.Find("Cove Light Right"));
            Assert.Greater(GameObject.Find("Light Panels").transform.childCount, 10);
            var glow = GameObject.Find("Cove Light Left").GetComponent<Renderer>().sharedMaterial;
            Assert.IsTrue(glow.IsKeywordEnabled("_EMISSION"), "light strips glow");
        }

        [Test]
        public void DressingNeverBlocksWalkingOrClicks()
        {
            foreach (var group in new[] { "Hull Ribs", "Light Panels", "Ceiling Plates" })
                Assert.IsEmpty(GameObject.Find(group).GetComponentsInChildren<Collider>(), $"{group} has colliders");
            foreach (var wall in new[] { "Wall_Left", "Wall_Right" })
                Assert.IsEmpty(GameObject.Find(wall).GetComponentsInChildren<Collider>()
                    .Where(c => c.name.Contains(" Plate ") || c.name.Contains(" Kick ") || c.name.Contains(" Frame ") || c.name.Contains(" Mullion")),
                    $"{wall} dressing has colliders");
        }

        [Test]
        public void TheDeckIsTexturedAndRepeats()
        {
            var floor = GameObject.Find("Floor").GetComponentInChildren<Renderer>().sharedMaterial;
            var deck = floor.GetTexture("_BaseMap");
            Assert.IsNotNull(deck, "the floor has the deck plate texture");
            Assert.AreEqual(TextureWrapMode.Repeat, deck.wrapMode);
            Assert.Greater(floor.GetTextureScale("_BaseMap").x, 1f, "the plates repeat instead of stretching across the corridor");
        }

        [Test]
        public void SideWindowsOpenOntoSpace()
        {
            foreach (var wall in new[] { "Wall_Left", "Wall_Right" })
            {
                var sills = GameObject.Find(wall).GetComponentsInChildren<Transform>().Where(t => t.name.EndsWith(" Sill")).ToList();
                Assert.IsNotEmpty(sills, $"{wall} has no windows");
                foreach (var sill in sills)
                {
                    // From eye height in the middle of the corridor, through the middle of the window: nothing in the way.
                    var through = new Vector3(sill.position.x, 1.65f, sill.position.z);
                    var eye = new Vector3(0f, 1.65f, sill.position.z);
                    Assert.IsFalse(Physics.Raycast(eye, (through - eye).normalized, 100f), $"{sill.name}: the window is blocked");
                }
            }
        }
    }
}
