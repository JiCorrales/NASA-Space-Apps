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
        [Header("Set by the ship builder")]
        public int stationNumber;
        public string stationTitle;
        [TextArea] public string explanation;

        [Header("Parts")]
        public TMP_Text titleText;
        public TMP_Text explanationText;
        public RectTransform stepsRoot;
        public StepTabView stepTemplate;
        public RectTransform optionsRoot;
        public OptionRowView optionTemplate;
        public TMP_Text detailsText;
        public TMP_Text statusText;
        public RectTransform actionsRoot;
        public StepTabView actionTemplate;
        public GameObject doneBadge;
        public TMP_Text numberText;

        public static readonly Color RowIdle = new Color(0.12f, 0.17f, 0.25f);
        public static readonly Color RowSelected = new Color(0.10f, 0.45f, 0.65f);
        public static readonly Color ProblemColor = new Color(1f, 0.45f, 0.4f);
        public static readonly Color DoneColor = new Color(0.37f, 0.88f, 0.63f);
        static readonly Color ActionColor = new Color(0.15f, 0.6f, 0.4f);
        static readonly Color StatusOk = new Color(0.9f, 0.93f, 1f);

        readonly List<OptionRowView> rows = new List<OptionRowView>();
        readonly List<StepTabView> tabs = new List<StepTabView>();
        readonly List<StepTabView> actions = new List<StepTabView>();
        public IStationViewModel ViewModel { get; private set; }
        public IReadOnlyList<OptionRowView> Rows => rows;
        public IReadOnlyList<StepTabView> Tabs => tabs;
        public IReadOnlyList<StepTabView> ActionButtons => actions;

        void Awake()
        {
            optionTemplate.gameObject.SetActive(false);
            stepTemplate.gameObject.SetActive(false);
            actionTemplate.gameObject.SetActive(false);
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
            explanationText.text = vm.MultiSelect ? vm.Explanation + " <i>Choose any number.</i>" : vm.Explanation;

            var steps = vm.Steps;
            stepsRoot.gameObject.SetActive(steps.Count > 1);
            Grow(tabs, steps.Count, stepTemplate, stepsRoot, (tab, i) => tab.button.onClick.AddListener(() => ViewModel?.SelectStep(i)));
            for (int i = 0; i < tabs.Count; i++)
            {
                bool used = i < steps.Count;
                tabs[i].gameObject.SetActive(used);
                if (!used) continue;
                tabs[i].label.text = steps[i];
                tabs[i].background.color = i == vm.StepIndex ? RowSelected : RowIdle;
            }

            var options = vm.Options;
            Grow(rows, options.Count, optionTemplate, optionsRoot, (row, i) => row.button.onClick.AddListener(() => ViewModel?.Select(i)));
            for (int i = 0; i < rows.Count; i++)
            {
                bool used = i < options.Count;
                rows[i].gameObject.SetActive(used);
                if (!used) continue;
                var option = options[i];
                rows[i].nameText.text = option.Name;
                rows[i].descriptionText.text = option.Description;
                rows[i].statsText.text = string.Join("  ", option.Stats.Select(s => $"{s.Label} <b>{s.Value}</b>"));
                rows[i].sourceText.text = option.Source;
                rows[i].background.color = option.Selected ? RowSelected : RowIdle;
            }

            optionsRoot.gameObject.SetActive(options.Count > 0);
            detailsText.gameObject.SetActive(options.Count == 0);
            detailsText.text = vm.Details;

            statusText.text = vm.Status;
            statusText.color = vm.StatusIsProblem ? ProblemColor : StatusOk;

            var labels = vm.Actions;
            Grow(actions, labels.Count, actionTemplate, actionsRoot, (button, i) => button.button.onClick.AddListener(() => ViewModel?.Act(i)));
            for (int i = 0; i < actions.Count; i++)
            {
                bool used = i < labels.Count;
                actions[i].gameObject.SetActive(used);
                if (!used) continue;
                actions[i].label.text = labels[i];
                actions[i].background.color = ActionColor;
            }

            doneBadge.SetActive(vm.IsDone);
            numberText.text = stationNumber.ToString();
            numberText.color = vm.IsDone ? DoneColor : StatusOk;
        }

        static void Grow<T>(List<T> list, int count, T template, Transform parent, System.Action<T, int> wire) where T : Component
        {
            while (list.Count < count)
            {
                var item = Instantiate(template, parent);
                wire(item, list.Count);
                list.Add(item);
            }
        }
    }
}
