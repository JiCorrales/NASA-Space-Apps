// Every number of Act 1 on Mars, in one place, each with where it comes from.
//
// Source tags, as everywhere in the game:
// - nasa: read on a NASA page; the text names the page and, for the Mars research, the row id of
//   Resources/10-mars-surface/data/mars-surface-numbers.csv (for example "B24"). Catalog values name the source
//   recorded in Assets/_Project/Data/Resources/MissionCatalog.json.
// - derived: our arithmetic on NASA numbers; the text says which.
// - team: a rule or value of the game. NASA gives no budget for such a mission and no rule turning a CubeSat's
//   parts into map radius, warning time or supplies: those are the team's and are labelled so.
//
// Some values below are internal to the rules (launch faults, fault rates). They are never shown to the player.

import type { Group, Option, OptionStat, Source, Step } from "../../bridge/types";

export const nasa = (text: string): Source => ({ status: "nasa", text });
export const derived = (text: string): Source => ({ status: "derived", text });
export const team = (text = "Team value: a rule of the game, not NASA data"): Source => ({ status: "team", text });

const CSV = "Resources/10-mars-surface/data/mars-surface-numbers.csv";
const SOA = "NASA SmallSat SOA 2026 (NASA/TP-20260003140)";
const CDS = "CubeSat Design Specification rev 14.1 (Cal Poly, on nasa.gov)";

// ---------------------------------------------------------------- Mars constants

/** Solar irradiance at Mars, mean distance. Mars Fact Sheet, CSV row B24. */
export const SUN_MARS_WM2 = 586.2;
/** Solar irradiance at Earth. NASA Planetary Fact Sheet (the same figure the Earth version uses). */
export const SUN_EARTH_WM2 = 1361;
/** What a panel gives at Mars against Earth: 586.2 / 1361 = 0.43. */
export const MARS_SUN_FACTOR = SUN_MARS_WM2 / SUN_EARTH_WM2;
export const SUN_SOURCE = derived(
  `Mars Fact Sheet, ${CSV} row B24: 586.2 W/m2 at Mars against 1361 W/m2 at Earth, so a panel gives 43% of its Earth power`,
);

/** Earth to Mars distance, million km (CSV C01, C02) and one-way light time, minutes (C03, C04). */
export const EARTH_MARS_MKM = { min: 54.6, max: 401.4 };
export const LIGHT_MIN = { min: 3.03, max: 22.3 };
export const DISTANCE_SOURCE = nasa(`Mars Fact Sheet, ${CSV} rows C01 and C02: 54.6 to 401.4 million km from Earth`);
export const DELAY_SOURCE = derived(`${CSV} rows C03 and C04: distance over the speed of light, 3.0 to 22.3 minutes one way`);

/** The crew's flight: the direct transfer of the 2028 window in the NASA Trajectory Browser extract. */
export const TRANSFER = {
  launch: "2028-11-29", arrival: "2029-08-28", days: 272, minDays: 176, maxDays: 288,
  source: nasa(
    "NASA Trajectory Browser, Resources/09-future-work/data/trajectory-browser-transfers-2026-2036.csv: trajectory 20630, " +
    "2028-11-29 to 2029-08-28, 272 days; direct one-way transfers in the extract take 176 to 288 days",
  ),
};
/** Months from today (2026-11-15) to that launch: 24.5, rounded down. */
export const WINDOW_MONTHS = 24;
export const WINDOW_SOURCE = derived("From 2026-11-15 to the 2028-11-29 launch of the crew's cargo flight (NASA Trajectory Browser trajectory 20630): 24 months");

export const RELAY_SOURCE = nasa(`Mars Relay Network (NASA Science), ${CSV} rows C14 and C15: relay up to 2 Mbps, 2 to 4 passes per sol over a rover`);
export const PASS_SOURCE = nasa(`Mars Relay Network Handbook (JPL D-7187), ${CSV} rows C16 to C18: average passes of 10 (MRO), 14 (Odyssey) and 17 (TGO) minutes`);

// ---------------------------------------------------------------- the mission

export const MISSION = {
  id: "MR-1",
  name: "Mars Relay",
  summary:
    "A CubeSat rides along with the crew's cargo flight and orbits Mars for them, as NASA's two MarCO CubeSats rode with " +
    "InSight in 2018. It maps where they land, watches the sky for dust storms and relays their data to Earth.",
};

// ---------------------------------------------------------------- the options

/** What each option adds. Kept apart from the cards. Internal fields are used by the rules only. */
export interface Effect {
  massKg?: number; powerW?: number; costUsd?: number; months?: number;
  /** Panels: power at Mars, W, and battery, Wh. */
  panelW?: number; batteryWh?: number;
  /** Format: mass limit, kg. */
  maxMassKg?: number; units?: number;
  /** Storage, Mb. */
  storageMb?: number;
  /** Instrument: ground pixel from the low orbit, m; data made per sol, Mb; storm warning it gives, sols. */
  pixelM?: number; dataMb?: number; warnSols?: number;
  /** Radio: rate to Earth on a 34 m dish, kbps. Deployable parts must unfold in space. */
  earthKbps?: number; deploys?: boolean;
  /** Deep Space Network: hours per sol and gain over a 34 m dish. */
  dsnHours?: number; dsnGain?: number;
  /** Orbit: relay rate from the base, Mbps; pass length, min; passes per sol; share of sols with a pass; how much
   * coarser the map is than from the low orbit; propellant to get there, kg; extra warning, sols. */
  relayMbps?: number; passMin?: number; passes?: number; passSols?: number; pixelFactor?: number;
  propellantKg?: number; orbitWarn?: number;
  /** Pass plan: share of each pass given to relaying the crew's data; extra warning; extra map reach. */
  relayShare?: number; planWarn?: number; planMap?: number;
  /** Backup relay through the existing orbiters. */
  backup?: boolean;
  /** Launch: carries its own thruster and propellant (flies free). */
  ownThruster?: boolean;
}

const s = (label: string, value: number | string, unit: string): OptionStat => ({ label, value, unit });
const round1 = (n: number) => Math.round(n * 10) / 10;
const atMars = (w: number) => round1(w * MARS_SUN_FACTOR);

interface OptionDef { option: Option; fx: Effect }
const def = (id: string, name: string, summary: string, source: Source, stats: OptionStat[], fx: Effect): OptionDef =>
  ({ option: { id, name, summary, stats, source }, fx });

/** Bus: computer, harness, structure joints. Catalog "busMassKg", "busPowerW", "busCostUsd": team values. */
export const BUS: Effect = { massKg: 0.5, powerW: 1.0, costUsd: 50000, months: 4 };
export const BUS_SOURCE = team("Bus (computer, wiring, integration): catalog game-balance values, 0.5 kg, 1 W, 50,000 USD, 4 months");

/** Thruster dry mass for a satellite that flies free to Mars. Team value. */
export const THRUSTER_KG = 0.5;

export const REGION_DEFS: OptionDef[] = [
  def("jezero", "Jezero Crater", "Where Perseverance works. An old river delta: rock layers worth sampling.",
    nasa(`Perseverance MEDA page (NASA Science), ${CSV} row T10: air from -83 to -23 C; the page speaks of Mars in general`),
    [s("Air, night", -83, "C"), s("Air, day", -23, "C")], {}),
  def("gale", "Gale Crater", "Where Curiosity works. Clear in winter, dusty in spring and summer, windy in autumn.",
    nasa(`Curiosity REMS (JPL), ${CSV} rows T03 and T04: 15.9 C on a summer afternoon, -100 C on a winter night`),
    [s("Warmest", 15.9, "C"), s("Coldest", -100, "C")], {}),
  def("elysium", "Elysium Planitia", "Where InSight landed. Flat and open; its array fell from 5,000 to 500 Wh per sol under dust.",
    nasa(`InSight (JPL), ${CSV} rows T11, T12, D28 and D29: a sol from -17 to -95 C; 5,000 Wh per sol after landing, 500 in 2022`),
    [s("High", -17, "C"), s("Low", -95, "C")], {}),
];

export const ORBIT_DEFS: OptionDef[] = [
  def("low-sso", "Low Sun-synchronous orbit, 300 km",
    "Like Mars Reconnaissance Orbiter's: close to the ground, short passes, the sharpest maps. Getting this low takes the most propellant.",
    PASS_SOURCE,
    [s("Passes", 2, "per sol"), s("Pass", 10, "min"), s("Map", "sharpest", ""), s("Propellant", 1.6, "kg")],
    { relayMbps: 2, passMin: 10, passes: 2, passSols: 0.85, pixelFactor: 1, propellantKg: 1.6, orbitWarn: 0 }),
  def("high-circular", "Higher circular orbit, 1,500 km",
    "Longer and more passes over the base, maps a little coarser, less propellant to reach.",
    team("Team values; NASA's relay orbiters average 10 to 17 minute passes (CSV C16 to C18) from lower orbits"),
    [s("Passes", 3, "per sol"), s("Pass", 25, "min"), s("Map", "x1.6 coarser", ""), s("Propellant", 1.0, "kg")],
    { relayMbps: 1, passMin: 25, passes: 3, passSols: 1, pixelFactor: 1.6, propellantKg: 1.0, orbitWarn: 0 }),
  def("areostationary", "Areostationary orbit, 17,000 km",
    "Turns with Mars and stays over the base all sol, watching the sky without a break. Far away: slow relay, coarse maps, the most propellant.",
    derived("Height from the sidereal day, 24.62 h (Mars Fact Sheet, CSV row B02), and Mars' GM; no NASA spacecraft has used this orbit. Rate and radio hours are team values"),
    [s("In view", "all sol", ""), s("Radio on", 4, "h per sol"), s("Map", "x50 coarser", ""), s("Propellant", 2.2, "kg")],
    { relayMbps: 0.128, passMin: 240, passes: 1, passSols: 1, pixelFactor: 50, propellantKg: 2.2, orbitWarn: 1 }),
];

export const PLAN_DEFS: OptionDef[] = [
  def("relay", "Relay first", "Each pass goes to taking the crew's data up. The camera works only when the radio is idle.",
    team("Team rule: share of each pass given to relaying"), [s("Relay", 100, "% of pass")], { relayShare: 1, planWarn: -1, planMap: 0 }),
  def("balanced", "Half relay, half watching", "Each pass is split between the crew's data and imaging the ground and sky.",
    team("Team rule: share of each pass given to relaying"), [s("Relay", 60, "% of pass")], { relayShare: 0.6, planWarn: 0, planMap: 1 }),
  def("watch", "Watch the sky first", "Each pass images the region and the sky around it first; the crew's data goes up with what is left.",
    team("Team rule: share of each pass given to relaying"), [s("Relay", 30, "% of pass")], { relayShare: 0.3, planWarn: 1, planMap: 2 }),
];

export const FORMAT_DEFS: OptionDef[] = [
  def("3u", "3U CubeSat", "10 x 10 x 34 cm. Little room: small panels, one instrument.",
    nasa(`${CDS}, Table 1: 3U at most 6.00 kg; structure 0.352 kg (${SOA}, Table 6-1)`),
    [s("Mass limit", 6, "kg"), s("Structure", 0.35, "kg")],
    { maxMassKg: 6, units: 3, massKg: 0.352, costUsd: 30000, months: 0 }),
  def("6u", "6U CubeSat", "Two 3U side by side, the size MarCO flew to Mars. Room for big panels and a bigger antenna.",
    nasa(`${CDS}, Table 1: 6U at most 12.00 kg; structure 0.92 kg (${SOA}, Table 6-1)`),
    [s("Mass limit", 12, "kg"), s("Structure", 0.92, "kg")],
    { maxMassKg: 12, units: 6, massKg: 0.92, costUsd: 60000, months: 2 }),
];

export const POWER_DEFS: OptionDef[] = [
  def("body", "Body-mounted cells", "Cells on the sides of the body. Nothing to unfold.",
    derived(`${SOA}, Table 3-2: 8.1 W at Earth for a 3U; times 0.43 at Mars (CSV B24). Battery 20 Wh: team value`),
    [s("At Mars", atMars(8.1), "W"), s("At Earth", 8.1, "W"), s("Battery", 20, "Wh")],
    { panelW: atMars(8.1), batteryWh: 20, massKg: 0.28, costUsd: 20000, months: 0 }),
  def("deploy", "Deployable panels", "Two wings that unfold once in space.",
    derived(`${SOA}, Table 3-2: 14.4 W at Earth; times 0.43 at Mars (CSV B24). Battery 40 Wh: NASA IceCube (NTRS 20210012947)`),
    [s("At Mars", atMars(14.4), "W"), s("At Earth", 14.4, "W"), s("Battery", 40, "Wh")],
    { panelW: atMars(14.4), batteryWh: 40, massKg: 0.47, costUsd: 50000, months: 1, deploys: true }),
  def("large", "Large deployable panels", "A big wing for a 6U, unfolded once in space.",
    derived(`${SOA}, Table 3-2: 28 W at Earth for a 6U wing; times 0.43 at Mars (CSV B24). Battery 80 Wh: team value`),
    [s("At Mars", atMars(28), "W"), s("At Earth", 28, "W"), s("Battery", 80, "Wh")],
    { panelW: atMars(28), batteryWh: 80, massKg: 0.92, costUsd: 100000, months: 1, deploys: true }),
];

export const ATTITUDE_DEFS: OptionDef[] = [
  def("wheels", "Reaction wheels and sun sensors", "Points to about a degree. Cold-gas jets unload the wheels.",
    team("Team values for pointing, mass, power and cost"),
    [s("Pointing", 1, "deg"), s("Mass", 0.6, "kg"), s("Power", 1.5, "W")],
    { massKg: 0.6, powerW: 1.5, costUsd: 60000, months: 1 }),
  def("star", "Reaction wheels and star tracker", "Points to a twentieth of a degree: sharp images and a steady antenna.",
    team("Team values for pointing, mass, power and cost"),
    [s("Pointing", 0.05, "deg"), s("Mass", 0.9, "kg"), s("Power", 2.5, "W")],
    { massKg: 0.9, powerW: 2.5, costUsd: 140000, months: 2 }),
];

export const STORAGE_DEFS: OptionDef[] = [
  def("small", "Small storage", "Holds about two sols of the crew's data.", team("Team values"),
    [s("Capacity", 4000, "Mb")], { storageMb: 4000, massKg: 0.05, costUsd: 10000, months: 0 }),
  def("large", "Large storage", "Holds more than a week of the crew's data through missed passes.", team("Team values"),
    [s("Capacity", 32000, "Mb")], { storageMb: 32000, massKg: 0.1, costUsd: 25000, months: 0 }),
];

export const INSTRUMENT_DEFS: OptionDef[] = [
  def("weather-camera", "Wide-angle weather camera", "Sees the whole disc of Mars on every orbit, like MRO's MARCI: dust storms show from far away.",
    nasa(`MRO MARCI images the entire planet every day (PDS Imaging Node, ${CSV} row O03). Pixel, data, mass, power and cost of this CubeSat camera: team values`),
    [s("Pixel", 1000, "m"), s("Data", 150, "Mb per sol"), s("Power", 1.5, "W")],
    { pixelM: 1000, dataMb: 150, warnSols: 2, massKg: 0.4, powerW: 1.5, costUsd: 120000, months: 2 }),
  def("mapping-multi", "Narrow-angle mapping camera", "Maps the ground around the base in detail, like a small cousin of MRO's CTX (6 m per pixel).",
    nasa(`MRO CTX: 6 m per pixel, 30 km wide (PDS Imaging Node, ${CSV} row O02). Pixel, data, mass, power and cost of this CubeSat camera: team values`),
    [s("Pixel", 10, "m"), s("Data", 600, "Mb per sol"), s("Power", 4, "W")],
    { pixelM: 10, dataMb: 600, warnSols: 1, massKg: 1.2, powerW: 4, costUsd: 300000, months: 3 }),
  def("sounder", "Camera and temperature sounder", "A wide camera plus an infrared sounder that reads the warming air of a storm, like MRO's MCS.",
    nasa(`MRO MCS measures temperature profiles and saw the November 2012 storm warm the air (JPL, ${CSV} row O05). Pixel, data, mass, power and cost: team values`),
    [s("Pixel", 500, "m"), s("Data", 250, "Mb per sol"), s("Power", 4.5, "W")],
    { pixelM: 500, dataMb: 250, warnSols: 3, massKg: 1.6, powerW: 4.5, costUsd: 380000, months: 3 }),
];

export const RADIO_DEFS: OptionDef[] = [
  def("uhf-patch", "UHF relay and X-band patch", "UHF to talk to the crew, a flat X-band patch to reach Earth, 55 to 401 million km away.",
    team(`UHF from the base up to 2 Mbps (${CSV} row C14). Rate to Earth, mass, power and cost: team values`),
    [s("To Earth", 8, "kbps on 34 m"), s("Mass", 0.4, "kg"), s("Power", 2, "W")],
    { earthKbps: 8, massKg: 0.4, powerW: 2, costUsd: 80000, months: 1 }),
  def("uhf-reflectarray", "UHF relay and X-band high-gain antenna", "UHF for the crew and a flat high-gain antenna that unfolds in space, as MarCO's did.",
    team(`UHF from the base up to 2 Mbps (${CSV} row C14). Rate to Earth, mass, power and cost: team values`),
    [s("To Earth", 32, "kbps on 34 m"), s("Mass", 1.0, "kg"), s("Power", 3, "W")],
    { earthKbps: 32, massKg: 1.0, powerW: 3, costUsd: 200000, months: 2, deploys: true }),
];

const DSN = nasa("DSN Telecommunications Link Design Handbook 810-005 (JPL): 34 m and 70 m antennas at Goldstone, Madrid and Canberra; antenna time is shared between missions. Hours and prices: team values");
export const DSN_DEFS: OptionDef[] = [
  def("dsn34-1h", "Deep Space Network: 34 m dish, 1 hour per sol", "The least antenna time the network books.", DSN,
    [s("Time", 1, "h per sol"), s("Dish", 34, "m")], { dsnHours: 1, dsnGain: 1, costUsd: 150000 }),
  def("dsn34-4h", "Deep Space Network: 34 m dish, 4 hours per sol", "Four hours of a 34 m dish every sol.", DSN,
    [s("Time", 4, "h per sol"), s("Dish", 34, "m")], { dsnHours: 4, dsnGain: 1, costUsd: 450000 }),
  def("dsn70-2h", "Deep Space Network: 70 m dish, 2 hours per sol", "The biggest dishes hear about 4 times as much per hour.",
    derived("Gain of a 70 m over a 34 m dish: (70 / 34) squared = 4.2 (DSN 810-005). Hours and price: team values"),
    [s("Time", 2, "h per sol"), s("Dish", 70, "m"), s("Gain", 4.2, "x")], { dsnHours: 2, dsnGain: 4.2, costUsd: 600000 }),
];

export const BACKUP_DEFS: OptionDef[] = [
  def("none", "No backup relay", "When a pass is missed, the crew's data waits for the next one.", team("No cost"), [], { backup: false }),
  def("orbiters", "Existing orbiters as backup", "Booked time on the orbiters already at Mars, which carry over 99% of rover data today.",
    nasa(`Mars Relay Network Handbook (JPL), ${CSV} row C12: over 99% of rover data returns through orbiter relay. Price: team value`),
    [s("Cost", 100000, "USD")], { backup: true, costUsd: 100000 }),
];

export const LAUNCH_DEFS: OptionDef[] = [
  def("cargo-free", "Ride along, fly free", "Leaves the cargo ship after launch and crosses to Mars on its own, as MarCO did with InSight. Needs its own thruster and propellant.",
    team("Ride-along price and thruster mass (0.5 kg): team values. The crossing: NASA Trajectory Browser, 272 days"),
    [s("Cost", 300000, "USD"), s("Thruster", THRUSTER_KG, "kg")], { costUsd: 300000, ownThruster: true }),
  def("cargo-carried", "Ride along, carried to orbit", "Stays on the cargo ship's cruise stage and is released in Mars orbit. No propellant, but it has to be delivered 3 months earlier.",
    team("Ride-along price and the 3 months of integration: team values"),
    [s("Cost", 500000, "USD"), s("Ready", 3, "months earlier")], { costUsd: 500000, months: 3, ownThruster: false }),
];

/** Tests, and the requirements each one verifies. */
export const TEST_DEFS: OptionDef[] = [
  def("vibration", "Vibration", "Shakes the satellite as the launch will. Verifies: mass at launch. The cargo flight accepts no payload without it.",
    nasa("CubeSat 101 (NASA CSLI, 2017), section 6.9.2: required for every launch. Cost and time: catalog team values"),
    [s("Cost", 20000, "USD"), s("Time", 1, "month")], { costUsd: 20000, months: 1 }),
  def("thermal", "Thermal vacuum", "Runs the satellite through the cold and vacuum of space. Verifies: storm warning time.",
    nasa("CubeSat 101 (NASA CSLI, 2017), section 6.9.3. Cost and time: catalog team values"),
    [s("Cost", 25000, "USD"), s("Time", 1, "month")], { costUsd: 25000, months: 1 }),
  def("deploy", "Deployment test", "Unfolds the panels and the antenna on the ground. Verifies: data relayed per sol.",
    team("Cost and time: team values"), [s("Cost", 15000, "USD"), s("Time", 0.5, "month")], { costUsd: 15000, months: 0.5 }),
  def("ditl", "Day in the life", "Runs one full sol of operations on the ground. Verifies: map detail, storm warning time and data relayed per sol.",
    nasa("CubeSat 101 (NASA CSLI, 2017), section 2.11. Cost and time: catalog team values"),
    [s("Cost", 2000, "USD"), s("Time", 0.5, "month")], { costUsd: 2000, months: 0.5 }),
];

/** The decision groups, in order, with the step each belongs to. */
export const GROUP_DEFS: { group: Group; step: Step; multi: boolean; defs: OptionDef[] }[] = [
  { group: "region", step: "goals", multi: false, defs: REGION_DEFS },
  { group: "orbit", step: "concept", multi: false, defs: ORBIT_DEFS },
  { group: "revisit", step: "concept", multi: false, defs: PLAN_DEFS },
  { group: "format", step: "design", multi: false, defs: FORMAT_DEFS },
  { group: "power", step: "design", multi: false, defs: POWER_DEFS },
  { group: "attitude", step: "design", multi: false, defs: ATTITUDE_DEFS },
  { group: "storage", step: "design", multi: false, defs: STORAGE_DEFS },
  { group: "instrument", step: "design", multi: false, defs: INSTRUMENT_DEFS },
  { group: "radio", step: "design", multi: false, defs: RADIO_DEFS },
  { group: "groundStation", step: "design", multi: false, defs: DSN_DEFS },
  { group: "backupStation", step: "design", multi: false, defs: BACKUP_DEFS },
  { group: "launch", step: "design", multi: false, defs: LAUNCH_DEFS },
  { group: "tests", step: "build", multi: true, defs: TEST_DEFS },
];

/** The effect of one chosen option. */
export function effectOf(group: string, id: string): Effect | undefined {
  return GROUP_DEFS.find((g) => g.group === group)?.defs.find((d) => d.option.id === id)?.fx;
}

/** How the screens name the groups and questions in the Mars version. */
export const MARS_LABELS = {
  groups: {
    region: "Landing region", orbit: "Orbit around Mars", revisit: "What it does on each pass", storage: "Data storage",
    groundStation: "Deep Space Network time", backupStation: "Backup relay", launch: "Ride to Mars",
  } as Partial<Record<Group, string>>,
  questions: {
    orbit: "Where will the satellite orbit Mars?",
    revisit: "What does it do when it passes over the base?",
  } as Partial<Record<Group, string>>,
  back: "Back to the mission board",
};

// ---------------------------------------------------------------- requirements

export interface RequirementDef {
  id: string; label: string; value: number; unit: string; min: number; max: number; check: string; source: Source;
  /** Tests that must be run for it to count as verified. */
  verifiedBy: string[];
}

export const BUDGET_DEFAULT_USD = 2_500_000;

export const REQUIREMENT_DEFS: RequirementDef[] = [
  { id: "mapDetail", label: "Map detail: ground size of one pixel", value: 50, unit: "m", min: 5, max: 1000,
    check: "The instrument's pixel seen from the chosen orbit; shown by the day in the life test",
    source: team("The crew's need, set by the team"), verifiedBy: ["ditl"] },
  { id: "warning", label: "Storm warning before it reaches the base", value: 2, unit: "sols", min: 0, max: 4,
    check: "What the instrument, the orbit and the pass plan see ahead; shown by the thermal vacuum and day in the life tests",
    source: team("The crew's need, set by the team; NASA states no warning lead time given to rover teams (CSV row O06, not found)"),
    verifiedBy: ["thermal", "ditl"] },
  { id: "dataPerSol", label: "Data relayed to Earth per sol", value: 200, unit: "Mb", min: 50, max: 1000,
    check: "The smaller of what the passes take up and what the Deep Space Network takes down; shown by the deployment and day in the life tests",
    source: team("The crew's need, set by the team. For scale: MRO relays 447.5 Mb per day on average (CSV row C22)"),
    verifiedBy: ["deploy", "ditl"] },
  { id: "deadline", label: "Ready for the cargo flight", value: WINDOW_MONTHS, unit: "months", min: 12, max: WINDOW_MONTHS,
    check: "Months to build and test the design against this deadline", source: WINDOW_SOURCE, verifiedBy: [] },
  { id: "budget", label: "Total budget", value: BUDGET_DEFAULT_USD, unit: "USD", min: 1_000_000, max: 4_000_000,
    check: "The cost of every part, test and service, plus the reserve", source: team("NASA publishes no budget for such a mission: the team's"),
    verifiedBy: [] },
  { id: "mass", label: "Satellite mass at launch", value: 12, unit: "kg", min: 4, max: 14,
    check: "The sum of the parts and propellant, also within the format's limit; shown by the vibration test",
    source: nasa(`${CDS}, Table 1: a 6U is at most 12.00 kg`), verifiedBy: ["vibration"] },
  { id: "reserve", label: "Budget reserve", value: 10, unit: "%", min: 0, max: 30,
    check: "The reserve set in build and verify", source: nasa("CubeSat 101 (NASA CSLI, 2017), section 2.2: reserves of at least 10% of the budget"),
    verifiedBy: [] },
];

// ---------------------------------------------------------------- rules turning the design into what the crew gets

/** Team rules for capabilitiesFromDesign. None of these is NASA data. */
export const CAPABILITY_RULES = {
  /** Map radius in tiles for a ground pixel up to `pixelM`. */
  mapRadius: [{ pixelM: 15, tiles: 8 }, { pixelM: 60, tiles: 6 }, { pixelM: 600, tiles: 4 }, { pixelM: 2000, tiles: 3 }, { pixelM: Infinity, tiles: 2 }],
  /** How far reading the maps can extend the known radius. */
  mapGrowth: 4,
  maxWarningSols: 4,
  /** Fault rate per sol with no tests and simple pointing; each test and the star tracker take some off. */
  faultBase: 0.08, faultPerTest: 0.015, faultStar: 0.01, faultMin: 0.01,
  /** Budget left that buys one crew-day of supplies; one spare part; the first spare comes free. */
  usdPerSupplyDay: 40000, usdPerSpare: 250000,
  /** Building materials: a fixed allocation plus 10 kg of the cargo flight per kg of mass margin left. */
  materialsBaseKg: 40, materialsPerMarginKg: 10,
  /** The backup relay fills the sols without a pass of our own. */
  backupPassSols: 1,
};
export const CAPABILITY_SOURCE = team("The rules turning the design into maps, warnings, links and supplies are the team's");

// ---------------------------------------------------------------- launch rules (internal, never shown)

export const LAUNCH_RULES = {
  /** A rocket can fail through no fault of the design. Internal team value. */
  vehicleLoss: 0.06,
  weatherHold: 0.3,
  /** Deployables that were never unfolded on the ground do not unfold in space; with the deployment test, rarely. */
  undeployedUntested: 0.5, undeployedTested: 0.03,
  stations: ["RANGE", "WEATHER", "VEHICLE", "PAYLOAD", "DSN", "FLIGHT"] as const,
};
