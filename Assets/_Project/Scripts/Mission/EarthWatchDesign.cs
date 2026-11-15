using System;
using System.Collections.Generic;
using System.Linq;

namespace SpaceApps.Mission
{
    /// <summary>The player's Earth Watch design, as catalog ids. A null id means "not chosen yet".</summary>
    [Serializable]
    public class EarthWatchDesign
    {
        /// <summary>The single-choice decision groups, in the order the contract lists them.</summary>
        public static readonly string[] SingleGroups =
            { "region", "orbit", "revisit", "format", "power", "attitude", "storage", "instrument", "radio", "groundStation", "backupStation", "launch" };

        public const string TestsGroup = "tests";
        public const string ObjectiveId = "earth-watch";

        public string region, orbit, revisit, format, power, attitude, storage, instrument, radio, groundStation, backupStation, launch;
        public List<string> tests = new List<string>();

        public string Get(string group)
        {
            switch (group)
            {
                case "region": return region;
                case "orbit": return orbit;
                case "revisit": return revisit;
                case "format": return format;
                case "power": return power;
                case "attitude": return attitude;
                case "storage": return storage;
                case "instrument": return instrument;
                case "radio": return radio;
                case "groundStation": return groundStation;
                case "backupStation": return backupStation;
                case "launch": return launch;
                default: return null;
            }
        }

        /// <summary>Sets a single-choice group; returns false for an unknown group.</summary>
        public bool Set(string group, string id)
        {
            switch (group)
            {
                case "region": region = id; break;
                case "orbit": orbit = id; break;
                case "revisit": revisit = id; break;
                case "format": format = id; break;
                case "power": power = id; break;
                case "attitude": attitude = id; break;
                case "storage": storage = id; break;
                case "instrument": instrument = id; break;
                case "radio": radio = id; break;
                case "groundStation": groundStation = id; break;
                case "backupStation": backupStation = id; break;
                case "launch": launch = id; break;
                default: return false;
            }
            return true;
        }

        public EarthWatchDesign Clone()
        {
            var copy = (EarthWatchDesign)MemberwiseClone();
            copy.tests = new List<string>(tests);
            return copy;
        }

        /// <summary>The design in the shape <see cref="MissionEvaluator"/> understands.</summary>
        public MissionDesign ToMissionDesign() => new MissionDesign
        {
            objective = ObjectiveId, format = format, power = power, radio = radio, groundStation = groundStation,
            launch = launch, orbit = orbit,
            instruments = instrument == null ? new List<string>() : new List<string> { instrument },
            tests = new List<string>(tests),
        };

        /// <summary>Mass, volume, power and cost of the parts the evaluator's own groups do not cover.</summary>
        public DesignExtras Extras(MissionCatalog catalog)
        {
            var ew = catalog.earthWatch;
            var att = MissionCatalog.Find(ew.attitudes, attitude);
            var sto = MissionCatalog.Find(ew.storages, storage);
            var bak = MissionCatalog.Find(ew.backupStations, backupStation);
            return new DesignExtras
            {
                massKg = (att?.massKg.value ?? 0f) + (sto?.massKg.value ?? 0f),
                units = att?.units.value ?? 0f,
                powerW = att?.powerW.value ?? 0f,
                costUsd = (att?.costUsd.value ?? 0f) + (sto?.costUsd.value ?? 0f) + (bak?.costUsd.value ?? 0f),
            };
        }

        /// <summary>Every group that has no choice yet.</summary>
        public List<string> Missing() => SingleGroups.Where(g => Get(g) == null).ToList();
    }
}
