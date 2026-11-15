using System;
using System.Diagnostics;
using Debug = UnityEngine.Debug;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace SpaceApps.Editor.Build
{
    /// <summary>
    /// Headless WebGL build:
    /// Unity -batchmode -quit -projectPath . -buildTarget WebGL
    ///       -executeMethod SpaceApps.Editor.Build.WebGLBuild.Build -logFile build.log
    /// Output: Builds/WebGL. Exits non-zero on failure. It also builds the React page in web/ (pnpm) and copies it
    /// to Builds/WebGL/page, and uses the EarthWatch WebGL template, which loads that page over the canvas.
    /// </summary>
    public static class WebGLBuild
    {
        const string OutputPath = "Builds/WebGL";
        const string Template = "PROJECT:EarthWatch";

        public static void Build()
        {
            var scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray();
            if (scenes.Length == 0)
            {
                Debug.LogError("WebGLBuild: no enabled scenes in EditorBuildSettings.");
                EditorApplication.Exit(1);
                return;
            }

            if (!BuildPage()) { EditorApplication.Exit(1); return; }

            // GitHub Pages cannot send Content-Encoding headers, so ship uncompressed files.
            // Set only for this build and restored after, so ProjectSettings stays untouched.
            var previousCompression = PlayerSettings.WebGL.compressionFormat;
            var previousTemplate = PlayerSettings.WebGL.template;
            PlayerSettings.WebGL.template = Template;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;

            BuildReport report;
            try
            {
                report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
                {
                    scenes = scenes,
                    locationPathName = OutputPath,
                    target = BuildTarget.WebGL,
                    options = BuildOptions.None,
                });
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
                return;
            }
            finally
            {
                PlayerSettings.WebGL.compressionFormat = previousCompression;
                PlayerSettings.WebGL.template = previousTemplate;
            }

            var summary = report.summary;
            Debug.Log($"WebGLBuild: {summary.result}, {summary.totalErrors} errors, " +
                      $"{summary.totalSize / (1024 * 1024)} MB, {summary.totalTime}, scenes: {string.Join(", ", scenes)}");
            if (summary.result != BuildResult.Succeeded) { EditorApplication.Exit(1); return; }

            var page = Path.Combine(OutputPath, "page");
            if (Directory.Exists(page)) Directory.Delete(page, true);
            CopyDirectory("web/dist", page);
            Debug.Log($"WebGLBuild: page copied to {page}");
            EditorApplication.Exit(0);
        }

        // pnpm only (never npm). The lockfile is frozen so the build uses exactly the versions the team tested.
        static bool BuildPage()
        {
            var windows = Application.platform == RuntimePlatform.WindowsEditor;
            var info = new ProcessStartInfo(windows ? "cmd" : "sh")
            {
                WorkingDirectory = "web",
                Arguments = (windows ? "/c " : "-c \"") + "pnpm install --frozen-lockfile && pnpm build" + (windows ? "" : "\""),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            };
            using (var process = Process.Start(info))
            {
                var output = process.StandardOutput.ReadToEndAsync();
                var errors = process.StandardError.ReadToEnd();
                process.WaitForExit();
                Debug.Log("WebGLBuild: page build\n" + output.Result + errors);
                if (process.ExitCode != 0) Debug.LogError($"WebGLBuild: the page build failed (pnpm exit code {process.ExitCode}).");
                return process.ExitCode == 0;
            }
        }

        static void CopyDirectory(string from, string to)
        {
            Directory.CreateDirectory(to);
            foreach (var file in Directory.GetFiles(from)) File.Copy(file, Path.Combine(to, Path.GetFileName(file)), true);
            foreach (var dir in Directory.GetDirectories(from)) CopyDirectory(dir, Path.Combine(to, Path.GetFileName(dir)));
        }
    }
}
