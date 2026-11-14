using System.Collections.Generic;
using UnityEngine;

namespace SpaceApps.UI
{
    /// <summary>Six-resource panel: used versus available, red with a badge when over the limit.</summary>
    public sealed class ResourceDashboard : MonoBehaviour
    {
        public RectTransform rowsRoot;
        public ResourceRowView rowTemplate;

        public static readonly Color BarOk = new Color(0.25f, 0.75f, 0.55f);
        public static readonly Color BarOver = new Color(0.90f, 0.25f, 0.25f);
        static readonly Color TextOk = new Color(0.9f, 0.93f, 1f);

        readonly List<ResourceRowView> rows = new List<ResourceRowView>();
        public IResourceDashboardViewModel ViewModel { get; private set; }
        public IReadOnlyList<ResourceRowView> Rows => rows;

        void Awake() => rowTemplate.gameObject.SetActive(false);

        void Start()
        {
            if (ViewModel == null) Bind(new PlaceholderResourceViewModel());
        }

        void OnDestroy()
        {
            if (ViewModel != null) ViewModel.Changed -= Refresh;
        }

        public void Bind(IResourceDashboardViewModel viewModel)
        {
            if (ViewModel != null) ViewModel.Changed -= Refresh;
            ViewModel = viewModel;
            ViewModel.Changed += Refresh;
            Refresh();
        }

        public bool IsOverLimitShown(int row) => rows[row].overLimitBadge.activeSelf;

        void Refresh()
        {
            var resources = ViewModel.Resources;
            while (rows.Count < resources.Count) rows.Add(Instantiate(rowTemplate, rowsRoot));

            for (int i = 0; i < rows.Count; i++)
            {
                bool used = i < resources.Count;
                rows[i].gameObject.SetActive(used);
                if (!used) continue;
                var r = resources[i];
                bool over = r.IsOverLimit;
                float ratio = r.Available > 0f ? Mathf.Clamp01(r.Used / r.Available) : 1f;
                rows[i].nameText.text = r.Name;
                rows[i].valueText.text = $"{r.Used:0.#} / {r.Available:0.#} {r.Unit}";
                rows[i].valueText.color = over ? BarOver : TextOk;
                rows[i].barFill.anchorMax = new Vector2(ratio, 1f);
                rows[i].barFillImage.color = over ? BarOver : BarOk;
                rows[i].overLimitBadge.SetActive(over);
            }
        }
    }
}
