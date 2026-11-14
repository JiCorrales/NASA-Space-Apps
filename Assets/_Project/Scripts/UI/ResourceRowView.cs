using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceApps.UI
{
    /// <summary>References inside one dashboard row; filled by ResourceDashboard.</summary>
    public sealed class ResourceRowView : MonoBehaviour
    {
        public TMP_Text nameText;
        public TMP_Text valueText;
        public RectTransform barFill;
        public Image barFillImage;
        public GameObject overLimitBadge;
    }
}
