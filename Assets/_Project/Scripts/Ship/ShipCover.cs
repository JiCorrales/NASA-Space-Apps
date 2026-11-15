using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceApps.Ship
{
    /// <summary>
    /// One of the six covers on the control room wall: a large step number, the step name and its state, in colour and
    /// in words. The step's real interface is the web page drawn over the canvas; the cover only says where it is.
    /// </summary>
    public sealed class ShipCover : MonoBehaviour
    {
        public const string Locked = "locked", Open = "open", Done = "done", Problem = "problem";

        public static readonly Color LockedColor = new Color(0.45f, 0.48f, 0.52f);
        public static readonly Color OpenColor = new Color(0.2f, 0.85f, 1f);
        public static readonly Color DoneColor = new Color(0.3f, 0.9f, 0.45f);
        public static readonly Color ProblemColor = new Color(1f, 0.3f, 0.28f);
        static readonly Color NameLit = new Color(0.92f, 0.95f, 1f);
        static readonly Color NameDim = new Color(0.62f, 0.65f, 0.7f);
        static readonly Color OnBar = new Color(0.03f, 0.05f, 0.08f);

        [Header("Set by the ship builder")]
        public string step;
        public int number;
        public string stepName;

        [Header("Parts")]
        public TMP_Text numberText;
        public TMP_Text nameText;
        public TMP_Text stateText;
        public Image border;
        public Image stateBar;

        [SerializeField] string status = Locked;

        public string Status => status;
        /// <summary>Open, done and problem covers open their step when clicked; locked ones do nothing.</summary>
        public bool Clickable => status != Locked;

        void Awake() => Refresh();

        public static bool IsStatus(string value) => value == Locked || value == Open || value == Done || value == Problem;

        public static Color ColorOf(string status) => status switch
        {
            Open => OpenColor,
            Done => DoneColor,
            Problem => ProblemColor,
            _ => LockedColor,
        };

        public static string LabelOf(string status) => status switch
        {
            Open => "OPEN",
            Done => "DONE",
            Problem => "PROBLEM",
            _ => "LOCKED",
        };

        public void SetStatus(string value)
        {
            status = value;
            Refresh();
        }

        public void Refresh()
        {
            var color = ColorOf(status);
            if (numberText != null) { numberText.text = number.ToString(); numberText.color = color; }
            if (nameText != null) { nameText.text = stepName; nameText.color = status == Locked ? NameDim : NameLit; }
            if (stateText != null) { stateText.text = LabelOf(status); stateText.color = OnBar; }
            if (border != null) border.color = color;
            if (stateBar != null) stateBar.color = color;
        }
    }
}
