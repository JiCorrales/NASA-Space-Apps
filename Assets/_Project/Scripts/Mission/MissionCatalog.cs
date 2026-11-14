using System;
using System.Linq;
using UnityEngine;

namespace SpaceApps.Mission
{
    /// <summary>A catalog number with where it came from. Status: nasa-verified, derived or game-balance.</summary>
    [Serializable]
    public class Num
    {
        public float value;
        public string source;
        public string status;

        public static implicit operator float(Num n) => n.value;
    }

    /// <summary>Common part of every catalog option.</summary>
    [Serializable]
    public class Entry
    {
        public string id, name;
    }

    [Serializable]
    public class CatalogConstants
    {
        public Num nasaLaunchCoverUsd, reserveFraction, minDevelopmentMonths, baselineMonths;
        public Num busMassKg, busUnits, busPowerW, busCostUsd, batteryDepthOfDischarge;
        public Num baseReliability, maxReliability, preferredOrbitBonus, healthyMarginMax;
    }

    [Serializable]
    public class Objective : Entry
    {
        public string summary;
        public string[] requiredTags, allowedOrbits, preferredOrbits;
        public Num minScience, budgetUsd, deadlineMonths, missionMonths;
    }

    [Serializable]
    public class CubeSatFormat : Entry
    {
        public Num units, maxMassKg, structureMassKg, costUsd, devMonths;
        public string[] dispensers;
    }

    [Serializable]
    public class Instrument : Entry
    {
        public string[] tags;
        public bool isImager;
        public Num massKg, units, powerW, dutyCycle, dataMbPerDay, costUsd, science, devMonths;
    }

    [Serializable]
    public class PowerOption : Entry
    {
        public bool deployable;
        public Num panelW, batteryWh, massKg, costUsd, minUnits;
    }

    [Serializable]
    public class Radio : Entry
    {
        public string band;
        public Num frequencyMHz, rateKbps, txPowerW, massKg, costUsd;
    }

    [Serializable]
    public class GroundStation : Entry
    {
        public string[] bands;
        /// <summary>How many antennas; daily contact is this times the orbit's contactMinutesPerDay.</summary>
        public Num stationCount, costUsd, months;
    }

    [Serializable]
    public class LaunchOption : Entry
    {
        /// <summary>True when NASA's CubeSat Launch Initiative provides this launch, so NASA pays up to the launch cover.</summary>
        public bool nasaCovered;
        /// <summary>The real rocket behind this option and what it can lift to orbit (NASA LSP data).</summary>
        public string vehicle, summary;
        public Num vehicleCapacityKg;
        public string[] orbits, dispensers;
        public Num pricePerUnitUsd, maxMassKg, waitMonths;
    }

    [Serializable]
    public class Orbit : Entry
    {
        public string summary;
        public Num altitudeKm, inclinationDeg, sunlitFraction, eclipseMinutes, lifetimeMonths;
        /// <summary>Minutes per day one mid-latitude ground station can talk to the satellite in this orbit.</summary>
        public Num contactMinutesPerDay;
    }

    [Serializable]
    public class VerificationTest : Entry
    {
        public string summary, mandatorySource;
        public bool mandatory;
        public Num costUsd, months, reliabilityBonus;
    }

    [Serializable]
    public class Licence : Entry
    {
        public string summary;
        public bool imagerOnly;
        public Num months, costUsd;
    }

    /// <summary>Raises an event's chance when the named condition holds for the design (see MissionSimulator).</summary>
    [Serializable]
    public class EventModifier
    {
        public string condition;
        public Num chance;
    }

    /// <summary>A random event card. Phase: development, testing, licensing, delivery, launch or operations.
    /// Outcome: empty, launch-lost or mission-lost.</summary>
    [Serializable]
    public class EventCard : Entry
    {
        public string phase, description, descriptionSource, descriptionStatus, outcome, mitigation;
        public Num baseChance, delayMonths, costUsd, scienceLoss;
        public EventModifier[] modifiers;
    }

    /// <summary>A difficulty level: scales the objective's budget and deadline and the event deck's chances.</summary>
    [Serializable]
    public class Difficulty : Entry
    {
        public string summary;
        public Num budgetScale, deadlineScale, eventChanceScale;
    }

    /// <summary>Every option the player can pick, loaded from Resources/MissionCatalog.json.</summary>
    [Serializable]
    public class MissionCatalog
    {
        public CatalogConstants constants;
        public Objective[] objectives;
        public CubeSatFormat[] formats;
        public Instrument[] instruments;
        public PowerOption[] power;
        public Radio[] radios;
        public GroundStation[] groundStations;
        public LaunchOption[] launches;
        public Orbit[] orbits;
        public VerificationTest[] tests;
        public Licence[] licences;
        public EventCard[] events;
        public Difficulty[] difficulties;

        public const string ResourcePath = "MissionCatalog";

        public static MissionCatalog Load()
        {
            var asset = Resources.Load<TextAsset>(ResourcePath);
            if (asset == null) throw new InvalidOperationException($"Resources/{ResourcePath}.json not found");
            return FromJson(asset.text);
        }

        public static MissionCatalog FromJson(string json) => JsonUtility.FromJson<MissionCatalog>(json);

        /// <summary>Find an entry by id in one of the arrays above; null when missing.</summary>
        /// <summary>The design's difficulty level, or null for the plain catalog values.</summary>
        public Difficulty DifficultyOf(MissionDesign design) => Find(difficulties, design?.difficulty);

        public static T Find<T>(T[] items, string id) where T : Entry =>
            items?.FirstOrDefault(i => i.id == id);
    }
}
