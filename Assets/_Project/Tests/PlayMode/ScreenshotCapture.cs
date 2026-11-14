using System;
using System.Collections;
using System.IO;
using System.Linq;
using NUnit.Framework;
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

            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            var cam = Camera.main;
            var screens = UnityEngine.Object.FindObjectsByType<StationScreen>(FindObjectsSortMode.None)
                .OrderBy(s => s.transform.position.z).ToArray();
            screens[1].ViewModel.Select(1);

            yield return Shot(cam, Path.Combine(dir, "corridor.png"));

            var s = screens[1].transform;
            cam.transform.SetPositionAndRotation(s.position - s.forward * 1.6f, Quaternion.LookRotation(s.forward));
            yield return Shot(cam, Path.Combine(dir, "station-screen.png"));

            var d = UnityEngine.Object.FindFirstObjectByType<ResourceDashboard>().transform;
            cam.transform.SetPositionAndRotation(d.position - d.forward * 1.7f, Quaternion.LookRotation(d.forward));
            yield return Shot(cam, Path.Combine(dir, "dashboard.png"));
        }

        static IEnumerator Shot(Camera cam, string path)
        {
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
