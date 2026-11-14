using System;
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
    /// Output: Builds/WebGL. Exits non-zero on failure.
    /// </summary>
    public static class WebGLBuild
    {
        const string OutputPath = "Builds/WebGL";

        public static void Build()
        {
            var scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray();
            if (scenes.Length == 0)
            {
                Debug.LogError("WebGLBuild: no enabled scenes in EditorBuildSettings.");
                EditorApplication.Exit(1);
                return;
            }

            // GitHub Pages cannot send Content-Encoding headers, so ship uncompressed files.
            // Set only for this build and restored after, so ProjectSettings stays untouched.
            var previousCompression = PlayerSettings.WebGL.compressionFormat;
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
            }

            var summary = report.summary;
            Debug.Log($"WebGLBuild: {summary.result}, {summary.totalErrors} errors, " +
                      $"{summary.totalSize / (1024 * 1024)} MB, {summary.totalTime}, scenes: {string.Join(", ", scenes)}");
            EditorApplication.Exit(summary.result == BuildResult.Succeeded ? 0 : 1);
        }
    }
}
