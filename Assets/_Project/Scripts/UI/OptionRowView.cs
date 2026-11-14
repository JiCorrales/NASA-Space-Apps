using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceApps.UI
{
    /// <summary>References inside one option card; filled by StationScreen.</summary>
    public sealed class OptionRowView : MonoBehaviour
    {
        public Button button;
        public Image background;
        public TMP_Text nameText;
        public TMP_Text descriptionText;
        public TMP_Text statsText;
        public TMP_Text sourceText;
    }
}
