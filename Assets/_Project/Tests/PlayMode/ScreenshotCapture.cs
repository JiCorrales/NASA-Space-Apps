using System;
using System.Collections;
using System.IO;
using System.Linq;
using Object = UnityEngine.Object;
using NUnit.Framework;
using SpaceApps.Game;
using SpaceApps.Mission;
using SpaceApps.UI;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>
    /// Visual proof, not a check. Run it on purpose with
    /// -testFilter SpaceApps.Tests.PlayMode.ScreenshotCapture and SHIP_SCREENSHOT_DIR set.
    /// </summary>
    [Explicit]
    public sealed class ScreenshotCapture
    {
        [UnityTest]
        public IEnumerator CaptureDesktopViews()
        {
            string dir = Environment.GetEnvironmentVariable("SHIP_SCREENSHOT_DIR");
            Assume.That(dir, Is.Not.Null.And.Not.Empty, "set SHIP_SCREENSHOT_DIR");
            Directory.CreateDirectory(dir);

            // SHIP_QUALITY picks a quality level by name, e.g. "High" (the WebGL default) or "Ultra" (standalone).
            string quality = Environment.GetEnvironmentVariable("SHIP_QUALITY");
            if (!string.IsNullOrEmpty(quality))
                QualitySettings.SetQualityLevel(Array.IndexOf(QualitySettings.names, quality), true);

            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            var session = Object.FindFirstObjectByType<MissionGame>().Session;

            yield return Shot(Path.Combine(dir, "spawn-welcome.png"));

            // A failing design: an S-band radio the amateur UHF ground station cannot hear.
            session.Change(d =>
            {
                d.objective = "earth-imaging"; d.format = "3u"; d.power = "body-3u"; d.radio = "s-band";
                d.groundStation = "amateur-uhf"; d.launch = "nasa-rideshare"; d.orbit = "sso-550";
                d.instruments.Add("camera-basic");
                d.tests.AddRange(session.Catalog.tests.Where(t => t.mandatory).Select(t => t.id));
            });
            yield return ShotOf(Ui.Screen("Instruments"), Path.Combine(dir, "station-instruments.png"));
            yield return ShotOf(Ui.Screen("Communications"), Path.Combine(dir, "station-communications-problem.png"));
            yield return ShotOf(Ui.Screen("Requirements"), Path.Combine(dir, "station-requirements.png"));
            yield return ShotOf(Object.FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None).First(), Path.Combine(dir, "dashboard.png"), 1.4f);
            yield return ShotOf(Ui.Screen("Mission Control"), Path.Combine(dir, "mission-control-fail.png"));

            session.Change(d => d.groundStation = "university-sband");
            var control = Ui.Screen("Mission Control");
            yield return ShotOf(control, Path.Combine(dir, "mission-control-pass.png"));

            // The ship itself, with the finished design on the satellite and orbit displays.
            yield return ShotFrom(new Vector3(0f, 1.6f, 1.5f), new Vector3(0f, 1.4f, 12f), Path.Combine(dir, "corridor.png"));
            var sill = GameObject.Find("Wall_Left").GetComponentsInChildren<Transform>().First(t => t.name.EndsWith(" Sill"));
            var earth = GameObject.Find("Space Outside/Earth").transform.position;
            var atWindow = new Vector3(sill.position.x + 1.3f, 1.65f, sill.position.z);
            yield return ShotFrom(atWindow, atWindow + (earth - atWindow).normalized, Path.Combine(dir, "window-earth.png"));
            var satellite = Object.FindFirstObjectByType<SatelliteModel>().transform.position;
            yield return ShotFrom(satellite + new Vector3(0.6f, 0.35f, -0.9f), satellite, Path.Combine(dir, "satellite-display.png"));
            var orbit = Object.FindFirstObjectByType<OrbitDisplay>().transform.position;
            yield return ShotFrom(orbit + new Vector3(0.5f, 0.15f, -1.3f), orbit, Path.Combine(dir, "orbit-display.png"));
            var console = Ui.Screen("Spacecraft").transform.Find("Console");
            var screenAt = Ui.Screen("Spacecraft").transform;
            yield return ShotFrom(screenAt.position - screenAt.forward * 2f + Vector3.down * 0.05f, console.position + Vector3.up * 0.5f, Path.Combine(dir, "station-console.png"));

            // Flights: pick seeds the simulator says end in success and in failure for this design.
            var flight = Object.FindFirstObjectByType<MissionGame>().Flight;
            int Seed(System.Func<MissionOutcome, bool> wanted) => Enumerable.Range(1, 2000)
                .First(seed => wanted(MissionSimulator.Run(session.Catalog, session.Design.Clone(), seed).outcome));
            int good = Seed(o => o == MissionOutcome.FullSuccess);
            int bad = Seed(o => o == MissionOutcome.Lost || o == MissionOutcome.Partial);

            flight.Launch(bad);
            flight.Step();
            flight.Step();
            yield return ShotOf(control, Path.Combine(dir, "mission-control-playback.png"));
            flight.SkipToEnd();
            yield return ShotOf(control, Path.Combine(dir, "mission-control-outcome-failure.png"));
            flight.Launch(good);
            flight.SkipToEnd();
            yield return ShotOf(control, Path.Combine(dir, "mission-control-outcome-success.png"));
        }

        static IEnumerator ShotOf(Component target, string path, float distance = 1.9f)
        {
            var t = target.transform;
            Camera.main.transform.SetPositionAndRotation(t.position - t.forward * distance, Quaternion.LookRotation(t.forward));
            yield return Shot(path);
        }

        static IEnumerator ShotFrom(Vector3 from, Vector3 lookAt, string path)
        {
            Camera.main.transform.SetPositionAndRotation(from, Quaternion.LookRotation(lookAt - from));
            yield return Shot(path);
        }

        static IEnumerator Shot(string path)
        {
            var cam = Camera.main;
            var rt = new RenderTexture(1600, 900, 24);
            cam.targetTexture = rt;
            yield return null;
            yield return null;
            RenderTexture.active = rt;
            var tex = new Texture2D(rt.width, rt.height, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, rt.width, rt.height), 0, 0);
            tex.Apply();
            File.WriteAllBytes(path, tex.EncodeToPNG());
            RenderTexture.active = null;
            cam.targetTexture = null;
            UnityEngine.Object.Destroy(rt);
            UnityEngine.Object.Destroy(tex);
            Debug.Log($"[ScreenshotCapture] wrote {path}");
        }
    }
}
