using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace SpaceApps.UI
{
    /// <summary>World-space station screen. Draws an IStationViewModel and forwards clicks to it.</summary>
    public sealed class StationScreen : MonoBehaviour
    {
        [Header("Placeholder content until Bind is called")]
        public string stationTitle;
        [TextArea] public string explanation;

        [Header("Parts")]
        public TMP_Text titleText;
        public TMP_Text explanationText;
        public RectTransform optionsRoot;
        public OptionRowView optionTemplate;
        public TMP_Text selectionText;
        public Button confirmButton;
        public TMP_Text confirmLabel;

        public static readonly Color RowIdle = new Color(0.12f, 0.17f, 0.25f);
        public static readonly Color RowSelected = new Color(0.10f, 0.45f, 0.65f);

        readonly List<OptionRowView> rows = new List<OptionRowView>();
        public IStationViewModel ViewModel { get; private set; }
        public IReadOnlyList<OptionRowView> Rows => rows;

        void Awake()
        {
            optionTemplate.gameObject.SetActive(false);
            confirmButton.onClick.AddListener(() => ViewModel?.Confirm());
        }

        void Start()
        {
            if (ViewModel == null) Bind(new PlaceholderStationViewModel(stationTitle, explanation));
        }

        void OnDestroy()
        {
            if (ViewModel != null) ViewModel.Changed -= Refresh;
        }

        public void Bind(IStationViewModel viewModel)
        {
            if (ViewModel != null) ViewModel.Changed -= Refresh;
            ViewModel = viewModel;
            ViewModel.Changed += Refresh;
            Refresh();
        }

        void Refresh()
        {
            var vm = ViewModel;
            titleText.text = vm.Title;
            explanationText.text = vm.Explanation;

            while (rows.Count < vm.Options.Count)
            {
                var row = Instantiate(optionTemplate, optionsRoot);
                int index = rows.Count;
                row.button.onClick.AddListener(() => ViewModel?.Select(index));
                rows.Add(row);
            }

            for (int i = 0; i < rows.Count; i++)
            {
                bool used = i < vm.Options.Count;
                rows[i].gameObject.SetActive(used);
                if (!used) continue;
                var option = vm.Options[i];
                rows[i].nameText.text = option.Name;
                rows[i].descriptionText.text = option.Description;
                rows[i].statsText.text = string.Join("   ", option.Stats.Select(s => $"{s.Label} <b>{s.Value}</b>"));
                rows[i].background.color = i == vm.SelectedIndex ? RowSelected : RowIdle;
            }

            bool hasSelection = vm.SelectedIndex >= 0 && vm.SelectedIndex < vm.Options.Count;
            selectionText.text = !hasSelection ? "Select an option"
                : (vm.IsConfirmed ? "Confirmed: " : "Selected: ") + vm.Options[vm.SelectedIndex].Name;
            confirmButton.interactable = hasSelection && !vm.IsConfirmed;
            confirmLabel.text = vm.IsConfirmed ? "Confirmed" : "Confirm";
        }
    }
}
