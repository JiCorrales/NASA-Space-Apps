using System;
using System.Collections.Generic;
using System.Linq;
using System.Globalization;

namespace SpaceApps.Mission
{
    /// <summary>The six resources the challenge asks the game to show.</summary>
    public enum ResourceKind { Mass, Power, Budget, Data, Communications, Time }

    public enum Severity { Warning, Blocking }

    /// <summary>One resource: how much the design uses against how much it has. Units in <see cref="unit"/>.</summary>
    [Serializable]
    public class ResourceBudget
    {
        public ResourceKind kind;
        public string unit;
        public float used, available;

        /// <summary>Fraction left over: 0.2 means 20% spare, negative means over the limit.</summary>
        public float Margin => available > 0f ? (available - used) / available : (used > 0f ? -1f : 0f);
    }

    /// <summary>A problem with the design and a plain-language sentence saying why it hurts the mission.</summary>
    [Serializable]
    public class Issue
    {
        public string code;
        public ResourceKind resource;
        public Severity severity;
        public string message;
    }

    [Serializable]
    public class MissionReport
    {
        public List<ResourceBudget> resources = new List<ResourceBudget>();
        public List<Issue> issues = new List<Issue>();

        /// <summary>True when no issue is blocking: the mission can fly and meets its objective.</summary>
        public bool success;
        public float science;
        /// <summary>Chance the hardware works in orbit, raised by verification tests. The event deck can roll against it.</summary>
        public float reliability;
        public int score;

        public ResourceBudget Get(ResourceKind kind) => resources.FirstOrDefault(r => r.kind == kind) ?? new ResourceBudget { kind = kind };
        public bool Has(string code) => issues.Any(i => i.code == code);
    }

    /// <summary>Pure, deterministic check of a design against the catalog. No randomness, no Unity state.</summary>
    public static class MissionEvaluator
    {
        /// <summary>Evaluates a finished or unfinished design. A missing choice adds nothing, checks that need it
        /// are skipped, and an "incomplete-design" issue names what is still to choose.</summary>
        public static MissionReport Evaluate(MissionCatalog catalog, MissionDesign design)
        {
            var report = new MissionReport();
            var c = catalog.constants;

            var objective = MissionCatalog.Find(catalog.objectives, design.objective);
            var format = MissionCatalog.Find(catalog.formats, design.format);
            var power = MissionCatalog.Find(catalog.power, design.power);
            var radio = MissionCatalog.Find(catalog.radios, design.radio);
            var station = MissionCatalog.Find(catalog.groundStations, design.groundStation);
            var launch = MissionCatalog.Find(catalog.launches, design.launch);
            var orbit = MissionCatalog.Find(catalog.orbits, design.orbit);
            var instruments = (design.instruments ?? new List<string>()).Select(id => MissionCatalog.Find(catalog.instruments, id)).Where(i => i != null).ToList();
            var tests = (design.tests ?? new List<string>()).Select(id => MissionCatalog.Find(catalog.tests, id)).Where(t => t != null).ToList();

            var missing = new List<string>();
            if (objective == null) missing.Add("mission objective");
            if (format == null) missing.Add("CubeSat format");
            if (instruments.Count == 0) missing.Add("instruments");
            if (power == null) missing.Add("power system");
            if (radio == null) missing.Add("radio");
            if (station == null) missing.Add("ground station");
            if (launch == null) missing.Add("launch");
            if (orbit == null) missing.Add("orbit");
            if (missing.Count > 0)
                Add(report, "incomplete-design", ResourceKind.Time, Severity.Blocking,
                    Inv($"Still to choose: {string.Join(", ", missing)}."));

            // Mass: the format sets the limit, and the launcher may set a lower one.
            float mass = c.busMassKg + (format?.structureMassKg.value ?? 0f) + (power?.massKg.value ?? 0f) +
                         (radio?.massKg.value ?? 0f) + instruments.Sum(i => i.massKg.value);
            float massLimit = format != null && launch != null ? Math.Min(format.maxMassKg.value, launch.maxMassKg.value)
                            : format?.maxMassKg.value ?? launch?.maxMassKg.value ?? 0f;
            Resource(report, ResourceKind.Mass, "kg", mass, massLimit);
            if (format != null && mass > format.maxMassKg)
                Add(report, "mass-over-format", ResourceKind.Mass, Severity.Blocking,
                    Inv($"The satellite weighs {mass:0.##} kg but a {format.name} may weigh at most {format.maxMassKg.value:0.##} kg, so the launch provider will not accept it."));
            else if (launch != null && mass > launch.maxMassKg)
                Add(report, "mass-over-launcher", ResourceKind.Mass, Severity.Blocking,
                    Inv($"The {launch.name} can carry at most {launch.maxMassKg.value:0.##} kg per satellite, and this one weighs {mass:0.##} kg."));

            float units = c.busUnits + instruments.Sum(i => i.units.value);
            if (format != null && units > format.units)
                Add(report, "volume-over-format", ResourceKind.Mass, Severity.Blocking,
                    Inv($"The parts need {units:0.##}U of space but a {format.name} has {format.units.value:0}U. If it does not fit, it does not fly."));
            if (format != null && power != null && format.units < power.minUnits)
                Add(report, "power-needs-bigger-format", ResourceKind.Power, Severity.Blocking,
                    Inv($"{power.name} need at least a {power.minUnits.value:0}U body to mount on."));

            // Communications: minutes of contact per day with the ground station.
            bool bandMatch = radio != null && station != null && station.bands.Contains(radio.band);
            float contactMinutes = station != null ? station.passesPerDay * station.minutesPerPass : 0f;
            float downlinkMb = bandMatch ? radio.rateKbps * contactMinutes * 60f / 8f / 1000f : 0f;
            float dataMb = instruments.Sum(i => i.dataMbPerDay.value);
            float neededMinutes = radio != null && radio.rateKbps > 0 ? dataMb * 8f * 1000f / (radio.rateKbps * 60f) : 0f;
            Resource(report, ResourceKind.Communications, "min/day", neededMinutes, bandMatch ? contactMinutes : 0f);
            if (radio != null && station != null && !bandMatch)
                Add(report, "station-band-mismatch", ResourceKind.Communications, Severity.Blocking,
                    Inv($"The {station.name} cannot listen on the {radio.name}'s band. Launching with an inadequate ground station is a mission killer."));

            // Data: what the instruments produce against what the link can bring down each day.
            Resource(report, ResourceKind.Data, "MB/day", dataMb, downlinkMb);
            float downlinkFraction = dataMb <= 0f ? 1f : Math.Min(1f, downlinkMb / dataMb);
            if (bandMatch && dataMb > downlinkMb)
                Add(report, "data-overflow", ResourceKind.Data, Severity.Warning,
                    Inv($"The instruments make {dataMb:0.#} MB a day but only {downlinkMb:0.#} MB can be sent down, so {(1f - downlinkFraction) * 100f:0}% of the science never reaches Earth. A faster radio or more ground stations would help."));

            // Power: orbit-average generation against the average load, and the battery through eclipse.
            // Before an orbit is chosen the panels show their full sunlit output.
            float txDuty = contactMinutes / 1440f;
            float load = c.busPowerW + instruments.Sum(i => i.powerW * i.dutyCycle) + (radio != null ? radio.txPowerW * txDuty : 0f);
            float generated = power != null ? power.panelW * (orbit?.sunlitFraction.value ?? 1f) : 0f;
            Resource(report, ResourceKind.Power, "W", load, generated);
            if (power != null && orbit != null)
            {
                if (load > generated)
                    Add(report, "power-deficit", ResourceKind.Power, Severity.Blocking,
                        Inv($"The satellite needs {load:0.##} W on average but its panels give {generated:0.##} W over an orbit, because the Sun is hidden {(1f - orbit.sunlitFraction.value) * 100f:0}% of the time. The batteries would drain and the satellite would shut down."));
                float eclipseWh = load * orbit.eclipseMinutes / 60f;
                float batteryWh = power.batteryWh * c.batteryDepthOfDischarge;
                if (eclipseWh > batteryWh)
                    Add(report, "battery-eclipse", ResourceKind.Power, Severity.Blocking,
                        Inv($"Each eclipse uses {eclipseWh:0.##} Wh but the battery can safely give {batteryWh:0.##} Wh, so the satellite browns out in Earth's shadow."));
            }

            // Budget: NASA pays launch up to the cover; the team pays everything else and keeps a reserve.
            float launchPrice = launch != null && format != null ? launch.pricePerUnitUsd * format.units : 0f;
            float launchToTeam = Math.Max(0f, launchPrice - c.nasaLaunchCoverUsd);
            bool imager = instruments.Any(i => i.isImager);
            var licences = catalog.licences.Where(l => !l.imagerOnly || imager).ToList();
            float cost = c.busCostUsd + (format?.costUsd.value ?? 0f) + (power?.costUsd.value ?? 0f) + (radio?.costUsd.value ?? 0f) +
                         (station?.costUsd.value ?? 0f) + launchToTeam + instruments.Sum(i => i.costUsd.value) +
                         tests.Sum(t => t.costUsd.value) + licences.Sum(l => l.costUsd.value);
            float budget = objective?.budgetUsd.value ?? 0f;
            Resource(report, ResourceKind.Budget, "USD", cost, budget);
            if (objective != null && cost > budget)
                Add(report, "over-budget", ResourceKind.Budget, Severity.Blocking,
                    Inv($"The mission costs ${cost:N0} but the budget is ${budget:N0}.") +
                    (launchToTeam > 0 ? Inv($" NASA covers launch only up to ${c.nasaLaunchCoverUsd.value:N0}, so the team pays ${launchToTeam:N0} of it.") : ""));
            else if (objective != null && cost > budget * (1f - c.reserveFraction))
                Add(report, "no-reserve", ResourceKind.Budget, Severity.Warning,
                    Inv($"Less than {c.reserveFraction.value * 100f:0}% of the budget is left in reserve. NASA advises keeping at least that much for surprises."));

            // Time: hardware, licences and the ground station run in parallel, then the launch wait.
            float hardware = Math.Max(format?.devMonths.value ?? 0f, instruments.Count > 0 ? instruments.Max(i => i.devMonths.value) : 0f) +
                             tests.Sum(t => t.months.value);
            float licenceMonths = licences.Sum(l => l.months.value); // NOAA must finish before the FCC does.
            float development = Math.Max(Math.Max(c.minDevelopmentMonths.value, hardware), Math.Max(licenceMonths, station?.months.value ?? 0f));
            float months = c.baselineMonths + development + (launch?.waitMonths.value ?? 0f);
            float deadline = objective?.deadlineMonths.value ?? 0f;
            Resource(report, ResourceKind.Time, "months", months, deadline);
            if (objective != null && months > deadline)
                Add(report, "schedule-overrun", ResourceKind.Time, Severity.Blocking,
                    Inv($"The mission reaches orbit after {months:0.#} months, later than the {deadline:0}-month deadline.") +
                    (licenceMonths >= development ? " The licences are the slowest step: a camera needs a NOAA licence before the FCC can finish the radio one." : ""));
            if (objective != null && orbit != null && orbit.lifetimeMonths < objective.missionMonths)
                Add(report, "orbit-lifetime", ResourceKind.Time, Severity.Blocking,
                    Inv($"In {orbit.name} air drag brings the satellite down after about {orbit.lifetimeMonths.value:0} months, but the mission needs {objective.missionMonths.value:0}."));

            // Compatibility between the launcher, the orbit and the objective.
            if (launch != null && orbit != null && !launch.orbits.Contains(orbit.id))
                Add(report, "launcher-orbit", ResourceKind.Mass, Severity.Blocking,
                    Inv($"The {launch.name} does not go to {orbit.name}."));
            if (launch != null && format != null && !launch.dispensers.Intersect(format.dispensers).Any())
                Add(report, "launcher-dispenser", ResourceKind.Mass, Severity.Blocking,
                    Inv($"The {launch.name} has no dispenser that holds a {format.name}."));
            if (objective != null && orbit != null && !objective.allowedOrbits.Contains(orbit.id))
                Add(report, "orbit-objective", ResourceKind.Data, Severity.Blocking,
                    Inv($"{orbit.name} cannot serve the {objective.name} objective."));

            foreach (var t in catalog.tests.Where(t => t.mandatory && !tests.Contains(t)))
                Add(report, "missing-test", ResourceKind.Time, Severity.Blocking,
                    Inv($"{t.name} is missing. {t.summary}"));

            // Science: instruments that match the objective, boosted in the preferred orbit, cut by lost data.
            // Only instruments that serve the objective count; before an objective is chosen, all of them do.
            var serving = objective == null ? instruments : instruments.Where(i => i.tags.Intersect(objective.requiredTags).Any()).ToList();
            float bonus = objective != null && orbit != null && objective.preferredOrbits.Contains(orbit.id) ? c.preferredOrbitBonus.value : 1f;
            report.science = serving.Sum(i => i.science.value) * bonus * (radio != null && station != null ? downlinkFraction : 1f);
            if (objective != null && instruments.Count > 0)
            {
                if (serving.Count == 0)
                    Add(report, "missing-instrument", ResourceKind.Data, Severity.Blocking,
                        Inv($"No instrument can measure what the {objective.name} objective needs ({string.Join(", ", objective.requiredTags)})."));
                else if (missing.Count == 0 && report.science < objective.minScience)
                    Add(report, "science-short", ResourceKind.Data, Severity.Blocking,
                        Inv($"The mission returns {report.science:0} science points but the objective needs {objective.minScience.value:0}."));
            }

            report.reliability = Math.Min(c.maxReliability.value, c.baseReliability + tests.Sum(t => t.reliabilityBonus.value));
            report.success = report.issues.All(i => i.severity != Severity.Blocking);
            report.score = Score(report, c);
            return report;
        }

        // A failed mission scores at most FailedScoreCap; a successful one always scores more.
        const int FailedScoreCap = 25;

        // Success is worth most; science and a healthy margin on each resource add to it; reliability scales it.
        static int Score(MissionReport r, CatalogConstants c)
        {
            if (!r.success) return Math.Min(FailedScoreCap, (int)Math.Round(r.science * 0.5f));
            float efficiency = r.resources.Sum(b =>
                b.Margin < 0f ? 0f : b.Margin < c.reserveFraction ? 5f : b.Margin <= c.healthyMarginMax ? 10f : 6f);
            return Math.Max(FailedScoreCap + 1, (int)Math.Round((100f + r.science * 2f + efficiency) * r.reliability));
        }

        /// <summary>Formats with the invariant culture, so messages read the same on every machine and in WebGL.</summary>
        internal static string Inv(FormattableString s) => s.ToString(CultureInfo.InvariantCulture);

        static void Resource(MissionReport r, ResourceKind kind, string unit, float used, float available) =>
            r.resources.Add(new ResourceBudget { kind = kind, unit = unit, used = used, available = available });

        static void Add(MissionReport r, string code, ResourceKind kind, Severity severity, string message) =>
            r.issues.Add(new Issue { code = code, resource = kind, severity = severity, message = message });
    }
}
