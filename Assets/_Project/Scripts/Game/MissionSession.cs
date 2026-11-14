using System;
using SpaceApps.Mission;

namespace SpaceApps.Game
{
    /// <summary>The player's mission: one catalog, the design so far and its latest evaluation.</summary>
    public sealed class MissionSession
    {
        public MissionCatalog Catalog { get; }
        public MissionDesign Design { get; private set; } = new MissionDesign();
        public MissionReport Report { get; private set; }

        /// <summary>Raised after every change, once the report is up to date.</summary>
        public event Action Changed;

        public MissionSession(MissionCatalog catalog)
        {
            Catalog = catalog;
            Evaluate();
        }

        public void Change(Action<MissionDesign> edit)
        {
            edit(Design);
            Evaluate();
        }

        public void Reset()
        {
            Design = new MissionDesign();
            Evaluate();
        }

        void Evaluate()
        {
            Report = MissionEvaluator.Evaluate(Catalog, Design);
            Changed?.Invoke();
        }
    }
}
