using UnityEngine;

namespace SpaceApps.Ship
{
    /// <summary>
    /// Uses an Asset Store skybox (not in the repository, see CREDITS.md) as the sky seen through the windows when
    /// one is installed, and does nothing when none is: the scene keeps its own Earth and star field. The materials
    /// are found by name in a Resources folder, so a missing package is a null, never a missing reference.
    /// Order of preference: the Earth sky of "Earth &amp; Planets skyboxes", then the nebula of "SpaceSkies Free".
    /// </summary>
    public sealed class SpaceSky : MonoBehaviour
    {
        /// <summary>SpaceSkies Free: a nebula and stars. The scene's own Earth stays in front of it.</summary>
        public const string ResourceName = "SpaceSkiesSky";
        /// <summary>Earth &amp; Planets skyboxes: the Earth is painted into the sky, so the scene's Earth is hidden.</summary>
        public const string EarthSkyResourceName = "EarthPlanetsSky";

        /// <summary>Set to false to keep the nebula and the scene's own Earth even when the Earth sky is installed.</summary>
        public static bool PreferEarthSky = true;

        [Tooltip("The scene's own star field, hidden while a skybox is in use.")]
        public Renderer fallbackStars;

        [Tooltip("Degrees the nebula skybox is turned about the vertical axis. The red nebula of the Pink skybox faces +z by default; the windows look towards -z.")]
        public float rotation = 180f;

        [Tooltip("Degrees the Earth skybox is turned about the vertical axis. Its Earth is on the front face (+z); the windows look towards -z.")]
        public float earthSkyRotation = 180f;

        /// <summary>The sky material that will be used, or null when no package is installed.</summary>
        public static Material LoadPreferred(out bool earthInSky)
        {
            var earth = PreferEarthSky ? Resources.Load<Material>(EarthSkyResourceName) : null;
            earthInSky = earth != null;
            return earth != null ? earth : Resources.Load<Material>(ResourceName);
        }

        void Start()
        {
            var sky = LoadPreferred(out bool earthInSky);
            if (sky == null)
            {
                Debug.Log("[SpaceSky] No Asset Store sky installed: using the star field.");
                return;
            }
            // Turn the sky on the shared material, not a copy: the pack's material is the one RenderSettings must hold.
            // (In the editor this also changes the ignored package file; in a build it is only the loaded copy.)
            float turn = earthInSky ? earthSkyRotation : rotation;
            if (sky.HasProperty("_Rotation") && !Mathf.Approximately(sky.GetFloat("_Rotation"), turn))
                sky.SetFloat("_Rotation", turn);
            RenderSettings.skybox = sky;
            // Both rigs are in the scene (one inactive), so include inactive cameras.
            foreach (var cam in FindObjectsByType<Camera>(FindObjectsInactive.Include))
                cam.clearFlags = CameraClearFlags.Skybox;
            if (fallbackStars != null) fallbackStars.enabled = false;
            if (earthInSky)
            {
                // Two Earths would show: the sky has its own.
                var earth = transform.Find("Earth");
                if (earth != null && earth.TryGetComponent<Renderer>(out var r)) r.enabled = false;
            }
            Debug.Log($"[SpaceSky] Using the {sky.name} skybox.");
        }
    }
}
