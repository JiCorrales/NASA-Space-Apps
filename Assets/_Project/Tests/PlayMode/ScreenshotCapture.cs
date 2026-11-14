using System;
using System.Collections;
using System.IO;
using System.Linq;
using Object = UnityEngine.Object;
using NUnit.Framework;
using SpaceApps.Game;
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

            yield return Shot(Path.Combine(dir, "corridor.png"));

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
            yield return ShotOf(Ui.Screen("Mission Control"), Path.Combine(dir, "mission-control-pass.png"));
        }

        static IEnumerator ShotOf(Component target, string path, float distance = 1.9f)
        {
            var t = target.transform;
            Camera.main.transform.SetPositionAndRotation(t.position - t.forward * distance, Quaternion.LookRotation(t.forward));
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
