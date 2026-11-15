using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace SpaceApps.Editor.Build
{
    /// <summary>
    /// Headless 64-bit Windows build, the one that runs in a Meta Quest over Link (OpenXR) and with keyboard and mouse:
    /// Unity -batchmode -quit -projectPath . -buildTarget Win64
    ///       -executeMethod SpaceApps.Editor.Build.WindowsBuild.Build [-windowsBuildOutput &lt;folder&gt;] -logFile build.log
    /// Output: Builds/Windows/SpaceMissionDesignGame.exe, or the given folder. Exits non-zero on failure,
    /// including when the OpenXR loader is missing from the player, because the headset would then never start.
    /// </summary>
    public static class WindowsBuild
    {
        const string DefaultFolder = "Builds/Windows";
        const string ExeName = "SpaceMissionDesignGame.exe";
        const string OpenXrLoader = "openxr_loader.dll";

        public static void Build()
        {
            var scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray();
            if (scenes.Length == 0)
            {
                Debug.LogError("WindowsBuild: no enabled scenes in EditorBuildSettings.");
                EditorApplication.Exit(1);
                return;
            }

            string folder = Path.GetFullPath(Argument("-windowsBuildOutput") ?? DefaultFolder);
            string exe = Path.Combine(folder, ExeName);

            // The project asks for IL2CPP, which needs the Windows IL2CPP module and a C++ toolchain on the build PC.
            // Mono needs neither and runs OpenXR the same way. Set only for this build and restored after,
            // so ProjectSettings stays untouched.
            var standalone = UnityEditor.Build.NamedBuildTarget.Standalone;
            var previousBackend = PlayerSettings.GetScriptingBackend(standalone);
            PlayerSettings.SetScriptingBackend(standalone, ScriptingImplementation.Mono2x);

            BuildReport report;
            try
            {
                report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
                {
                    scenes = scenes,
                    locationPathName = exe,
                    target = BuildTarget.StandaloneWindows64,
                    targetGroup = BuildTargetGroup.Standalone,
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
                PlayerSettings.SetScriptingBackend(standalone, previousBackend);
            }

            var summary = report.summary;
            Debug.Log($"WindowsBuild: {summary.result}, {summary.totalErrors} errors, " +
                      $"{summary.totalSize / (1024 * 1024)} MB, {summary.totalTime}, scenes: {string.Join(", ", scenes)}, output: {exe}");
            if (summary.result != BuildResult.Succeeded)
            {
                EditorApplication.Exit(1);
                return;
            }

            // Without the loader the player cannot reach the OpenXR runtime (Meta Horizon Link) and always starts on the desktop.
            var loader = Directory.Exists(folder)
                ? Directory.GetFiles(folder, OpenXrLoader, SearchOption.AllDirectories).FirstOrDefault()
                : null;
            if (loader == null)
            {
                Debug.LogError($"WindowsBuild: {OpenXrLoader} is not in {folder}; enable OpenXR for Standalone in XR Plug-in Management.");
                EditorApplication.Exit(1);
                return;
            }
            Debug.Log($"WindowsBuild: OpenXR loader at {loader}");
            EditorApplication.Exit(0);
        }

        /// <summary>The value after a command-line flag, or null.</summary>
        static string Argument(string flag)
        {
            var args = Environment.GetCommandLineArgs();
            int i = Array.IndexOf(args, flag);
            return i >= 0 && i + 1 < args.Length ? args[i + 1] : null;
        }
    }
}
