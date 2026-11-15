using System;
using System.Collections.Generic;

namespace SpaceApps.Mission
{
    /// <summary>A measured value for a world's card, with where it comes from. Value is a number or a range, ready to show.</summary>
    [Serializable] public class MeasureInfo { public string value, unit; public SourceInfo source; }

    /// <summary>A world on the mission select. A null measure is a value the team has not collected: the page says "data coming".</summary>
    [Serializable]
    public class WorldInfo
    {
        public string id, name;
        public bool open;
        public MeasureInfo sunlight, signal, travel;
    }

    /// <summary>A mission on the mission select. Empty who or why is shown as "data coming".</summary>
    [Serializable] public class MissionCardInfo { public string id, world, name, summary, who, why; public bool open; }

    /// <summary>The worlds and missions of step 1. Every number comes from the research data in Resources/ (JPL Horizons
    /// and the NASA Ames Trajectory Browser); nothing here is typed in from memory. Anything not found there is null.</summary>
    public static class WorldsData
    {
        /// <summary>Resources/00-challenge/sintesis-reto.md: solar constant at 1 AU.</summary>
        public const float SolarConstantWm2 = 1361f;
        /// <summary>The satellite the signal loss is measured against: a CubeSat in a 500 km orbit.</summary>
        public const float ReferenceKm = 500f;

        // Resources/09-future-work/data/horizons-elements-2026-11-14.csv: semi-major axis around the Sun (AU), and the
        // Moon's around the Earth (km).
        public const float EarthAu = 1.000532451820628f, VenusAu = 0.723337506270087f, MarsAu = 1.523744139097473f, JupiterAu = 5.202130244665783f;
        public const float MoonKm = 382599.9f;

        // Resources/09-future-work/data/trajectory-browser-transfers-2026-2036.csv: duration of the one-way direct
        // (Earth to the planet) rendezvous trajectories, launches 2026 to 2036, shortest and longest.
        public static readonly int[] VenusDays = { 112, 192 }, MarsDays = { 176, 288 }, JupiterDays = { 448, 512 };

        public static List<WorldInfo> Worlds() => new List<WorldInfo>
        {
            new WorldInfo { id = "earth", name = "Earth", open = true, sunlight = Sunlight(EarthAu) },
            new WorldInfo { id = "moon", name = "Moon", open = false, sunlight = Sunlight(EarthAu), signal = Signal(MoonKm) },
            new WorldInfo { id = "mars", name = "Mars", open = false, sunlight = Sunlight(MarsAu), travel = Travel("Mars", MarsDays) },
            new WorldInfo { id = "venus", name = "Venus", open = false, sunlight = Sunlight(VenusAu), travel = Travel("Venus", VenusDays) },
            new WorldInfo { id = "jupiter", name = "Jupiter", open = false, sunlight = Sunlight(JupiterAu), travel = Travel("Jupiter", JupiterDays) },
        };

        public static List<MissionCardInfo> Missions(MissionInfo earthWatch) => new List<MissionCardInfo>
        {
            new MissionCardInfo
            {
                id = earthWatch.id, world = "earth", name = earthWatch.name, summary = earthWatch.summary, open = true,
                who = "Scientists who study how one region of Earth changes through a year: its forests, the Amazon basin or the Arctic sea ice.",
                why = "A picture every week shows the change as it happens, and a year of them shows the seasons come and go. An image only helps them once it has reached them, so it counts only after it is sent down during a ground pass.",
            },
            new MissionCardInfo
            {
                id = "space-weather", world = "earth", name = "Space weather watch", open = false,
                summary = "Track the solar storms that disturb Earth's magnetic field, using NASA's record of them.",
                who = "", why = "",
            },
        };

        static MeasureInfo Sunlight(float au)
        {
            float w = (float)Math.Round(SolarConstantWm2 / (au * au));
            return new MeasureInfo
            {
                value = w.ToString("0"), unit = "W/m2",
                source = new SourceInfo { status = "derived", text = $"The solar constant, {SolarConstantWm2:0} W/m2 at 1 AU, divided by the square of the distance to the Sun ({au:0.000} AU, NASA JPL Horizons, 2026-11-14)." },
            };
        }

        // Radio signal falls with the square of the distance, so the loss against the reference orbit is 20 log10(d0 / d).
        static MeasureInfo Signal(float km) => new MeasureInfo
        {
            value = ((float)Math.Round(20.0 * Math.Log10(ReferenceKm / km))).ToString("0"), unit = "dB",
            source = new SourceInfo { status = "derived", text = $"Inverse square of the distance: {km:#,0} km from Earth (NASA JPL Horizons) against a satellite at {ReferenceKm:0} km." },
        };

        static MeasureInfo Travel(string planet, int[] days) => new MeasureInfo
        {
            value = $"{days[0]} to {days[1]}", unit = "days",
            source = new SourceInfo { status = "nasa", text = $"NASA Ames Trajectory Browser: one-way direct trips from Earth to {planet}, launches 2026 to 2036." },
        };
    }
}
