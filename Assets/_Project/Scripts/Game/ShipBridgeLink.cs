using SpaceApps.Bridging;
using SpaceApps.Ship;
using UnityEngine;

namespace SpaceApps.Game
{
    /// <summary>
    /// Joins the ship to the page bridge (docs/bridge.md): a clicked cover opens its screen, the page's
    /// <c>close</c> or the ship releasing the view closes it, and the covers show the session's step statuses.
    /// Creates itself at load. It rebinds when the ship scene or the bridge is replaced, so tests and scene
    /// reloads need no setup.
    /// </summary>
    public sealed class ShipBridgeLink : MonoBehaviour
    {
        ShipScreens screens;
        Bridge bridge;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Ensure()
        {
            if (FindFirstObjectByType<ShipBridgeLink>() == null) DontDestroyOnLoad(new GameObject(nameof(ShipBridgeLink), typeof(ShipBridgeLink)));
        }

        void Update()
        {
            if (screens == ShipScreens.Current && bridge == Bridge.Instance) return;
            // ponytail: an unbound side stays null, so a half-present pair is retried every frame (two lookups, cheap).
            Unbind();
            screens = null;
            bridge = null;
            if (ShipScreens.Current == null || Bridge.Instance == null) return;
            screens = ShipScreens.Current;
            bridge = Bridge.Instance;
            screens.CoverActivated += bridge.OpenScreen;
            screens.ViewReleased += bridge.CloseScreen;
            bridge.CloseRequested += screens.ReleaseView;
            bridge.Session.StateChanged += ShowStatuses;
            // In a browser the page owns Escape (it sends close); the ship's own Escape would release twice.
            screens.escapeReleases = Application.platform != RuntimePlatform.WebGLPlayer;
            ShowStatuses();
        }

        void OnDestroy() => Unbind();

        void Unbind()
        {
            if (screens == null || bridge == null) return;
            screens.CoverActivated -= bridge.OpenScreen;
            screens.ViewReleased -= bridge.CloseScreen;
            bridge.CloseRequested -= screens.ReleaseView;
            bridge.Session.StateChanged -= ShowStatuses;
        }

        void ShowStatuses()
        {
            foreach (var step in ShipScreens.Steps) screens.SetCoverStatus(step, bridge.Session.StatusOf(step));
        }
    }
}
