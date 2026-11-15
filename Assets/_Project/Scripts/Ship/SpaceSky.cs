using UnityEngine;

namespace SpaceApps.Ship
{
    /// <summary>
    /// Uses the SpaceSkies Free skybox (Unity Asset Store, not in the repository, see CREDITS.md) as the sky seen
    /// through the windows when it is present, and does nothing when it is not: the scene keeps its own star field.
    /// The material is found by name in a Resources folder, so a missing package is a null, never a missing reference.
    /// </summary>
    public sealed class SpaceSky : MonoBehaviour
    {
        public const string ResourceName = "SpaceSkiesSky";

        [Tooltip("The scene's own star field, hidden while the skybox is in use.")]
        public Renderer fallbackStars;

        [Tooltip("Degrees the skybox is turned about the vertical axis. The red nebula of the Pink skybox faces +z by default; the windows look towards -z.")]
        public float rotation = 180f;

        void Start()
        {
            var sky = Resources.Load<Material>(ResourceName);
            if (sky == null)
            {
                Debug.Log($"[SpaceSky] No {ResourceName} material (SpaceSkies Free not installed): using the star field.");
                return;
            }
            // Turn the sky on the shared material, not a copy: the pack's material is the one RenderSettings must hold.
            // (In the editor this also changes the ignored package file; in a build it is only the loaded copy.)
            if (sky.HasProperty("_Rotation") && !Mathf.Approximately(sky.GetFloat("_Rotation"), rotation))
                sky.SetFloat("_Rotation", rotation);
            RenderSettings.skybox = sky;
            // Both rigs are in the scene (one inactive), so include inactive cameras.
            foreach (var cam in FindObjectsByType<Camera>(FindObjectsInactive.Include))
                cam.clearFlags = CameraClearFlags.Skybox;
            if (fallbackStars != null) fallbackStars.enabled = false;
            Debug.Log($"[SpaceSky] Using the {sky.name} skybox from SpaceSkies Free.");
        }
    }
}
