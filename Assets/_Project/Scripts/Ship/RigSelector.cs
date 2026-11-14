using UnityEngine;
using UnityEngine.XR;

namespace SpaceApps.Ship
{
    /// <summary>Enables the VR rig when an XR device is active, the desktop rig otherwise.</summary>
    public sealed class RigSelector : MonoBehaviour
    {
        public GameObject xrRig;
        public GameObject desktopRig;

        void Awake() => Apply(XRSettings.isDeviceActive);

        public void Apply(bool xrActive)
        {
            desktopRig.SetActive(!xrActive);
            xrRig.SetActive(xrActive);
        }
    }
}
