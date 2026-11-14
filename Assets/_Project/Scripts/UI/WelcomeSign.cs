using TMPro;
using UnityEngine;

namespace SpaceApps.UI
{
    /// <summary>The sign at the spawn point: what the game is, the goal and the controls.</summary>
    public sealed class WelcomeSign : MonoBehaviour
    {
        public TMP_Text titleText;
        public TMP_Text bodyText;
        public TMP_Text controlsText;

        public void Show(string title, string body, string controls)
        {
            titleText.text = title;
            bodyText.text = body;
            controlsText.text = controls;
        }
    }
}
