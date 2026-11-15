using System;
using UnityEngine;
using UnityEngine.XR;

namespace SpaceApps.Ship
{
    /// <summary>Enables the VR rig when an XR device is active, the desktop rig otherwise.</summary>
    public sealed class RigSelector : MonoBehaviour
    {
        public GameObject xrRig;
        public GameObject desktopRig;

        public bool XrActive { get; private set; }
        /// <summary>Raised with XrActive after every Apply.</summary>
        public event Action<bool> RigChanged;

        void Awake() => Apply(XRSettings.isDeviceActive);

        public void Apply(bool xrActive)
        {
            XrActive = xrActive;
            desktopRig.SetActive(!xrActive);
            xrRig.SetActive(xrActive);
            // One line in Player.log saying which scene started and in which mode, for checking builds without a headset.
            Debug.Log($"[RigSelector] Scene {gameObject.scene.name}: {(xrActive ? "VR rig, an XR device is active" : "keyboard and mouse rig, no XR device")}");
            RigChanged?.Invoke(xrActive);
        }
    }
}
