using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SpaceApps.Ship
{
    /// <summary>
    /// The six covers and the view lock. Clicking a cover that is not locked locks the view (the rig stops moving and
    /// looking, the cursor is free for the web page drawn over the canvas) and raises CoverActivated with its step id.
    /// ReleaseView gives control back. The web bridge needs this class only, never the covers themselves.
    /// </summary>
    public sealed class ShipScreens : MonoBehaviour
    {
        /// <summary>Step ids in cover order, left to right from the spawn point (docs/bridge.md).</summary>
        public static readonly string[] Steps = { "goals", "concept", "requirements", "design", "build", "fly" };

        /// <summary>The ShipScreens of the loaded ship, for code that holds no scene reference (the bridge).</summary>
        public static ShipScreens Current { get; private set; }

        [Tooltip("Covers in step order. Set by the ship builder.")]
        public ShipCover[] covers;
        [Tooltip("The keyboard-and-mouse rig the view lock freezes. Set by the ship builder.")]
        public DesktopRig rig;
        [Tooltip("Escape releases the view. The web bridge may turn this off and call ReleaseView itself.")]
        public bool escapeReleases = true;
        [Tooltip("Furthest click distance in metres; the room is 10 m across.")]
        public float reach = 15f;

        /// <summary>The player clicked a cover that is not locked; the argument is its step id. The view is already locked.</summary>
        public event Action<string> CoverActivated;
        /// <summary>The view was released, by ReleaseView or by Escape.</summary>
        public event Action ViewReleased;

        public bool ViewLocked { get; private set; }
        /// <summary>The step whose cover locked the view, or null.</summary>
        public string ActiveStep { get; private set; }
        public IReadOnlyList<ShipCover> Covers => covers;

        void Awake() => Current = this;

        void OnDestroy()
        {
            if (Current == this) Current = null;
        }

        void Update()
        {
            if (ViewLocked)
            {
                var keys = Keyboard.current;
                if (escapeReleases && keys != null && keys.escapeKey.wasPressedThisFrame) ReleaseView();
                return;
            }
            var mouse = Mouse.current;
            if (mouse != null && mouse.leftButton.wasPressedThisFrame) ClickAt(mouse.position.ReadValue());
        }

        public ShipCover Cover(string step) => covers.FirstOrDefault(c => c != null && c.step == step);

        /// <summary>Sets a cover's state: locked, open, done or problem. An unknown step or state is logged and ignored.</summary>
        public void SetCoverStatus(string step, string status)
        {
            var cover = Cover(step);
            if (cover == null) { Debug.LogWarning($"[ShipScreens] No cover for step '{step}'."); return; }
            if (!ShipCover.IsStatus(status)) { Debug.LogWarning($"[ShipScreens] Unknown status '{status}' for step '{step}'."); return; }
            cover.SetStatus(status);
        }

        /// <summary>Unlocks the view: movement and look come back. Does nothing when the view is not locked.</summary>
        public void ReleaseView()
        {
            if (!ViewLocked) return;
            ViewLocked = false;
            ActiveStep = null;
            if (rig != null) rig.InputLocked = false;
            ViewReleased?.Invoke();
        }

        /// <summary>
        /// What a left click at this screen position does: if the first thing under it is a cover that is not locked,
        /// the view locks and CoverActivated is raised. Returns whether a cover was activated.
        /// </summary>
        public bool ClickAt(Vector2 screenPosition)
        {
            if (ViewLocked) return false;
            var cam = Camera.main;
            if (cam == null) return false;
            var ray = cam.ScreenPointToRay(screenPosition);
            if (!Physics.Raycast(ray, out var hit, reach, Physics.DefaultRaycastLayers, QueryTriggerInteraction.Collide)) return false;
            var cover = hit.collider.GetComponentInParent<ShipCover>();
            return cover != null && Activate(cover);
        }

        /// <summary>Activates a cover as a click would. Locked covers do nothing.</summary>
        public bool Activate(ShipCover cover)
        {
            if (ViewLocked || cover == null || !cover.Clickable) return false;
            ViewLocked = true;
            ActiveStep = cover.step;
            if (rig != null) rig.InputLocked = true;
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            CoverActivated?.Invoke(cover.step);
            return true;
        }
    }
}
