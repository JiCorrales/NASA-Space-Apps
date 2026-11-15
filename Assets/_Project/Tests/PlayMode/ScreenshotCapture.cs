using System;
using System.Collections;
using System.IO;
using NUnit.Framework;
using SpaceApps.Game;
using SpaceApps.Ship;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using Object = UnityEngine.Object;

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
            var screens = Object.FindFirstObjectByType<ShipScreens>();
            var cam = Camera.main;
            var eye = cam.transform.position; // the spawn point's eye; the camera moves below
            Debug.Log($"[ScreenshotCapture] quality level {QualitySettings.names[QualitySettings.GetQualityLevel()]}, pipeline {(QualitySettings.renderPipeline ? QualitySettings.renderPipeline.name : "default")}");

            // What the player sees on arrival, untouched: the first run, only step 1 open.
            yield return Shot(Path.Combine(dir, "spawn.png"));

            // Every state on the wall at once, with a CubeSat on the stand.
            Object.FindFirstObjectByType<MissionGame>().Session.Change(d => { d.format = "3u"; d.power = "deployable-3u"; d.radio = "s-band"; });
            screens.SetCoverStatus("goals", "done");
            screens.SetCoverStatus("concept", "done");
            screens.SetCoverStatus("requirements", "problem");
            screens.SetCoverStatus("design", "open");
            yield return Shot(Path.Combine(dir, "spawn-all-states.png"));

            // One cover up close, 1.6 m in front of it at eye height.
            var cover = screens.Cover("design").transform;
            var from = cover.position - cover.forward * 1.6f;
            from.y = 1.6f;
            cam.transform.SetPositionAndRotation(from, Quaternion.LookRotation(cover.position - from));
            yield return Shot(Path.Combine(dir, "cover-design-close.png"));
            cover = screens.Cover("requirements").transform;
            from = cover.position - cover.forward * 1.6f;
            from.y = 1.6f;
            cam.transform.SetPositionAndRotation(from, Quaternion.LookRotation(cover.position - from));
            yield return Shot(Path.Combine(dir, "cover-requirements-problem-close.png"));

            // Turned round at the spawn point: the windows, the Earth and the stars.
            cam.transform.SetPositionAndRotation(eye, Quaternion.Euler(8f, 180f, 0f));
            yield return Shot(Path.Combine(dir, "windows-behind.png"));

            // The CubeSat stand from beside it.
            var sat = Object.FindFirstObjectByType<SatelliteModel>().transform.position;
            cam.transform.SetPositionAndRotation(sat + new Vector3(0.7f, 0.45f, -1.1f), Quaternion.LookRotation(sat + Vector3.up * 0.15f - (sat + new Vector3(0.7f, 0.45f, -1.1f))));
            yield return Shot(Path.Combine(dir, "cubesat-stand.png"));
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
            Object.Destroy(rt);
            Object.Destroy(tex);
            Debug.Log($"[ScreenshotCapture] wrote {path}");
        }
    }
}
