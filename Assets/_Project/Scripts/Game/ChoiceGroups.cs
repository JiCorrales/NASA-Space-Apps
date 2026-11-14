using System;
using System.Collections.Generic;
using System.Linq;
using SpaceApps.Mission;
using SpaceApps.UI;
using static SpaceApps.Game.Format;
using M = SpaceApps.Mission;

namespace SpaceApps.Game
{
    /// <summary>One decision of the design: which catalog entries it offers and which design field it sets.</summary>
    sealed class ChoiceGroup
    {
        public string Name;
        public bool Multi;
        public Func<MissionCatalog, IEnumerable<Entry>> Entries;
        /// <summary>Description, stats and source line of one entry.</summary>
        public Func<MissionCatalog, Entry, (string description, StatValue[] stats, string source)> Describe;
        /// <summary>Single-select: read and write the design field.</summary>
        public Func<MissionDesign, string> Get;
        public Action<MissionDesign, string> Set;
        /// <summary>Multi-select: the design list to toggle ids in.</summary>
        public Func<MissionDesign, List<string>> List;

        public bool IsSelected(MissionDesign d, string id) => Multi ? List(d).Contains(id) : Get(d) == id;

        public void Choose(MissionDesign d, string id)
        {
            if (!Multi) { Set(d, id); return; }
            var list = List(d);
            if (!list.Remove(id)) list.Add(id);
        }

        public string Chosen(MissionCatalog c, MissionDesign d)
        {
            var names = Entries(c).Where(e => IsSelected(d, e.id)).Select(e => e.name).ToList();
            return names.Count == 0 ? "none" : string.Join(", ", names);
        }

        static StatValue S(string label, string value) => new StatValue(label, value);

        static string OrbitNames(MissionCatalog c, IEnumerable<string> ids) =>
            string.Join(", ", ids.Select(id => MissionCatalog.Find(c.orbits, id)?.name ?? id));

        public static readonly ChoiceGroup Objective = new ChoiceGroup
        {
            Name = "Objective",
            Entries = c => c.objectives,
            Get = d => d.objective, Set = (d, id) => d.objective = id,
            Describe = (c, e) =>
            {
                var o = (M.Objective)e;
                return (o.summary,
                    new[] { S("Budget", Usd(o.budgetUsd)), S("Deadline", N(o.deadlineMonths) + " mo"), S("Min science", N(o.minScience)) },
                    Source(o.budgetUsd, o.deadlineMonths, o.minScience, o.missionMonths));
            },
        };

        public static readonly ChoiceGroup Format = new ChoiceGroup
        {
            Name = "Format",
            Entries = c => c.formats,
            Get = d => d.format, Set = (d, id) => d.format = id,
            Describe = (c, e) =>
            {
                var f = (M.CubeSatFormat)e;
                return ($"Room for {N(f.units)}U of parts. Fits dispensers: {string.Join(", ", f.dispensers)}.",
                    new[] { S("Max", N(f.maxMassKg) + " kg"), S("Cost", Usd(f.costUsd)), S("Build", N(f.devMonths) + " mo") },
                    Source(f.units, f.maxMassKg, f.structureMassKg, f.costUsd, f.devMonths));
            },
        };

        public static readonly ChoiceGroup Power = new ChoiceGroup
        {
            Name = "Power",
            Entries = c => c.power,
            Get = d => d.power, Set = (d, id) => d.power = id,
            Describe = (c, e) =>
            {
                var p = (M.PowerOption)e;
                return ($"Needs at least a {N(p.minUnits)}U body.",
                    new[] { S("Panels", N(p.panelW) + " W"), S("Battery", N(p.batteryWh) + " Wh"), S("Mass", N(p.massKg) + " kg"), S("Cost", Usd(p.costUsd)) },
                    Source(p.panelW, p.batteryWh, p.massKg, p.costUsd, p.minUnits));
            },
        };

        public static readonly ChoiceGroup Instruments = new ChoiceGroup
        {
            Name = "Instruments",
            Multi = true,
            Entries = c => c.instruments,
            List = d => d.instruments,
            Describe = (c, e) =>
            {
                var i = (M.Instrument)e;
                return ($"Measures {string.Join(", ", i.tags)}." + (i.isImager ? " A camera needs a NOAA licence." : ""),
                    new[] { S("Mass", N(i.massKg) + " kg"), S("Power", N(i.powerW) + " W"), S("Data", N(i.dataMbPerDay) + " MB/d"), S("Cost", Usd(i.costUsd)), S("Sci", N(i.science)) },
                    Source(i.massKg, i.units, i.powerW, i.dutyCycle, i.dataMbPerDay, i.costUsd, i.science, i.devMonths));
            },
        };

        public static readonly ChoiceGroup Radio = new ChoiceGroup
        {
            Name = "Radio",
            Entries = c => c.radios,
            Get = d => d.radio, Set = (d, id) => d.radio = id,
            Describe = (c, e) =>
            {
                var r = (M.Radio)e;
                return ($"{r.band} band at {N(r.frequencyMHz)} MHz.",
                    new[] { S("Rate", N(r.rateKbps) + " kbps"), S("Transmit", N(r.txPowerW) + " W"), S("Mass", N(r.massKg) + " kg"), S("Cost", Usd(r.costUsd)) },
                    Source(r.frequencyMHz, r.rateKbps, r.txPowerW, r.massKg, r.costUsd));
            },
        };

        public static readonly ChoiceGroup GroundStation = new ChoiceGroup
        {
            Name = "Ground station",
            Entries = c => c.groundStations,
            Get = d => d.groundStation, Set = (d, id) => d.groundStation = id,
            Describe = (c, e) =>
            {
                var g = (M.GroundStation)e;
                return ($"Listens on: {string.Join(", ", g.bands)}.",
                    new[] { S("Antennas", N(g.stationCount)), S("Cost", Usd(g.costUsd)), S("Setup", N(g.months) + " mo") },
                    Source(g.stationCount, g.costUsd, g.months));
            },
        };

        public static readonly ChoiceGroup Launch = new ChoiceGroup
        {
            Name = "Launch",
            Entries = c => c.launches,
            Get = d => d.launch, Set = (d, id) => d.launch = id,
            Describe = (c, e) =>
            {
                var l = (M.LaunchOption)e;
                return ($"Goes to: {OrbitNames(c, l.orbits)}." + (l.nasaCovered ? " NASA pays the launch up to its cover." : ""),
                    new[] { S("Price", Usd(l.pricePerUnitUsd) + "/U"), S("Max", N(l.maxMassKg) + " kg"), S("Wait", N(l.waitMonths) + " mo") },
                    Source(l.pricePerUnitUsd, l.maxMassKg, l.waitMonths));
            },
        };

        public static readonly ChoiceGroup Orbit = new ChoiceGroup
        {
            Name = "Orbit",
            Entries = c => c.orbits,
            Get = d => d.orbit, Set = (d, id) => d.orbit = id,
            Describe = (c, e) =>
            {
                var o = (M.Orbit)e;
                return (o.summary,
                    new[] { S("Altitude", N(o.altitudeKm) + " km"), S("Sunlit", Pct(o.sunlitFraction)), S("Contact", N(o.contactMinutesPerDay) + " min/d"), S("Lifetime", N(o.lifetimeMonths) + " mo") },
                    Source(o.altitudeKm, o.inclinationDeg, o.sunlitFraction, o.eclipseMinutes, o.lifetimeMonths, o.contactMinutesPerDay));
            },
        };

        public static readonly ChoiceGroup Tests = new ChoiceGroup
        {
            Name = "Tests",
            Multi = true,
            Entries = c => c.tests,
            List = d => d.tests,
            Describe = (c, e) =>
            {
                var t = (M.VerificationTest)e;
                string source = t.mandatory && !string.IsNullOrEmpty(t.mandatorySource)
                    ? "<color=#7fd4ff>Required</color>: " + t.mandatorySource
                    : Source(t.costUsd, t.months, t.reliabilityBonus);
                return ((t.mandatory ? "<b>Required.</b> " : "") + t.summary,
                    new[] { S("Cost", Usd(t.costUsd)), S("Time", N(t.months) + " mo"), S("Reliability", "+" + Pct(t.reliabilityBonus)) },
                    source);
            },
        };
    }
}
