using System;
using System.Collections.Generic;

namespace SpaceApps.Mission
{
    /// <summary>The player's choices, as catalog ids. Serializable so a design can be saved or shared.</summary>
    [Serializable]
    public class MissionDesign
    {
        public string objective, format, power, radio, groundStation, launch, orbit;
        public List<string> instruments = new List<string>();
        public List<string> tests = new List<string>();

        public MissionDesign Clone()
        {
            var copy = (MissionDesign)MemberwiseClone();
            copy.instruments = new List<string>(instruments);
            copy.tests = new List<string>(tests);
            return copy;
        }
    }
}
