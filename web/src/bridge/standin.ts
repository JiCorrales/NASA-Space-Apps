import { createFlightStandin } from "./flightStandin";
import type {
  GroupDef, Group, MissionCard, MissionState, Option, PageToUnity, Resource, ResourceKind, Issue, Source, Step,
  StepStatus, UnityToPage, World,
} from "./types";

// Fixture data for Earth Watch (EW-1). Values marked "team" are plausible, not yet checked.
// ponytail: resource numbers are a toy model; Unity is the real source of truth.

const nasa = (text: string): Source => ({ status: "nasa", text });
const derived = (text: string): Source => ({ status: "derived", text });
const team = (text = "Team value, not yet checked against a NASA source"): Source => ({ status: "team", text });

interface Fx { mass?: number; power?: number; cost?: number; data?: number; link?: number }
const opt = (
  id: string, name: string, summary: string, source: Source, stats: Option["stats"] = [],
): Option => ({ id, name, summary, stats, source });

/** What each option adds to the resources, kept apart from the contract. */
const FX: Record<string, Fx> = {
  "format:3u": { mass: 0 }, "format:6u": { mass: 0 },
  "power:fixed": { power: 8 }, "power:deploy": { power: 20 },
  "attitude:magnetorquers": { mass: 0.2, power: 1, cost: 20000 }, "attitude:reaction": { mass: 0.5, power: 3, cost: 90000 },
  "storage:small": { mass: 0.05, cost: 10000, data: 0 }, "storage:large": { mass: 0.1, cost: 25000, data: 0 },
  "instrument:rgb": { mass: 0.8, power: 4, cost: 150000, data: 40 }, "instrument:multi": { mass: 1.4, power: 7, cost: 320000, data: 120 },
  "radio:uhf": { mass: 0.1, power: 2, cost: 30000, link: 9 }, "radio:sband": { mass: 0.3, power: 5, cost: 80000, link: 80 },
  "groundStation:own": { cost: 40000 }, "groundStation:network": { cost: 120000 },
  "backupStation:none": {}, "backupStation:network": { cost: 60000 },
  "launch:nasa": { cost: 0 }, "launch:rideshare": { cost: 300000 },
  "tests:vibration": { cost: 40000 }, "tests:thermal": { cost: 60000 }, "tests:day": { cost: 30000 },
};
const BASE: Fx = { mass: 0.9, power: 2, cost: 250000 }; // bus, structure, computer

const groups: GroupDef[] = [
  { group: "region", step: "goals", multi: false, options: [
    opt("costa-rica", "Costa Rica forests", "Watch tropical forest cover week by week.", team("Story choice; numbers do not change")),
    opt("amazon", "The Amazon", "Track clearing along the forest edge.", team("Story choice; numbers do not change")),
    opt("arctic", "Arctic sea ice", "Follow the ice edge through the seasons.", team("Story choice; numbers do not change")),
  ] },
  { group: "orbit", step: "concept", multi: false, options: [
    opt("leo-sso", "Sun-synchronous, 500 km", "Passes over the region at the same local time each week.", derived("Computed in Tools/orbits/"),
      [{ label: "Period", value: 94.6, unit: "min" }, { label: "Eclipse", value: 35, unit: "%" }]),
    opt("leo-iss", "ISS-like, 410 km", "Lower and cheaper to reach, lighting changes between passes.", derived("Computed in Tools/orbits/"),
      [{ label: "Period", value: 92.6, unit: "min" }, { label: "Eclipse", value: 37, unit: "%" }]),
  ] },
  { group: "revisit", step: "concept", multi: false, options: [
    opt("weekly", "Once a week", "One image of the region every 7 days.", nasa("Mission need: 52 weekly images"), [{ label: "Images", value: 52, unit: "per year" }]),
    opt("twice", "Twice a week", "More images, more data to send down.", team(), [{ label: "Images", value: 104, unit: "per year" }]),
  ] },
  { group: "format", step: "design", multi: false, options: [
    opt("3u", "3U CubeSat", "10 x 10 x 34 cm.", nasa("NASA CubeSat 101"), [{ label: "Mass limit", value: 4, unit: "kg" }]),
    opt("6u", "6U CubeSat", "Room for a bigger instrument.", nasa("NASA CubeSat 101"), [{ label: "Mass limit", value: 12, unit: "kg" }]),
  ] },
  { group: "power", step: "design", multi: false, options: [
    opt("fixed", "Body-mounted panels", "Simple, no moving parts.", team(), [{ label: "Power", value: 8, unit: "W" }]),
    opt("deploy", "Deployable panels", "More power, one more thing that can fail.", team(), [{ label: "Power", value: 20, unit: "W" }]),
  ] },
  { group: "attitude", step: "design", multi: false, options: [
    opt("magnetorquers", "Magnetorquers", "Cheap and light, slow to point.", team(), [{ label: "Pointing", value: 5, unit: "deg" }]),
    opt("reaction", "Reaction wheels", "Precise pointing for sharp images.", team(), [{ label: "Pointing", value: 0.1, unit: "deg" }]),
  ] },
  { group: "storage", step: "design", multi: false, options: [
    opt("small", "Small storage", "Holds about a week of images.", team(), [{ label: "Capacity", value: 2, unit: "GB" }]),
    opt("large", "Large storage", "Rides out a missed ground contact.", team(), [{ label: "Capacity", value: 16, unit: "GB" }]),
  ] },
  { group: "instrument", step: "design", multi: false, options: [
    opt("rgb", "RGB camera", "Natural colour images.", team(), [{ label: "Image", value: 40, unit: "MB" }]),
    opt("multi", "Multispectral camera", "Shows vegetation health.", team(), [{ label: "Image", value: 120, unit: "MB" }]),
  ] },
  { group: "radio", step: "design", multi: false, options: [
    opt("uhf", "UHF radio", "Low rate, forgiving of pointing.", team(), [{ label: "Rate", value: 9.6, unit: "kbps" }]),
    opt("sband", "S-band radio", "High rate, needs good pointing.", team(), [{ label: "Rate", value: 2, unit: "Mbps" }]),
  ] },
  { group: "groundStation", step: "design", multi: false, options: [
    opt("own", "Own station", "One station we run.", team(), [{ label: "Contacts", value: 4, unit: "per day" }]),
    opt("network", "Commercial network", "Many stations, paid per pass.", team(), [{ label: "Contacts", value: 12, unit: "per day" }]),
  ] },
  { group: "backupStation", step: "design", multi: false, options: [
    opt("none", "No backup", "Cheapest; a failure loses contacts.", team()),
    opt("network", "Backup network", "Takes over when the main station fails.", team()),
  ] },
  { group: "launch", step: "design", multi: false, options: [
    opt("nasa", "NASA-provided launch", "Covers up to 300,000 USD of launch cost.", nasa("NASA CubeSat 101"), [{ label: "Wait", value: 18, unit: "months" }]),
    opt("rideshare", "Commercial rideshare", "Faster, you pay.", team(), [{ label: "Wait", value: 9, unit: "months" }]),
  ] },
  { group: "tests", step: "build", multi: true, options: [
    opt("vibration", "Vibration", "Survives launch shaking.", nasa("NASA CubeSat 101")),
    opt("thermal", "Thermal vacuum", "Survives hot and cold in space.", nasa("NASA CubeSat 101")),
    opt("day", "Day in the life", "Runs a full operations day on the ground.", nasa("NASA CubeSat 101")),
  ] },
];

// Mission select. Sunlight is the solar irradiance from the NASA Planetary Fact Sheet; the signal is the loss
// against a satellite at 500 km (inverse square of the distance to Earth). null = the team has not collected it.
const factSheet = nasa("NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet): solar irradiance");
const signalFrom = (distance: string) =>
  derived(`Inverse square of the distance to Earth (${distance}) against a satellite at 500 km`);
const worlds: World[] = [
  { id: "earth", name: "Earth", open: true,
    sunlight: { value: 1361, unit: "W/m2", source: factSheet }, signal: null, travel: null },
  { id: "moon", name: "Moon", open: false,
    sunlight: { value: 1361, unit: "W/m2, same as Earth", source: factSheet },
    signal: { value: -58, unit: "dB", source: signalFrom("384,400 km") },
    travel: { value: 3, unit: "days", source: nasa("NASA Apollo missions: about 3 days from Earth to the Moon") } },
  { id: "mars", name: "Mars", open: false,
    sunlight: { value: 586, unit: "W/m2, 43% of Earth", source: factSheet },
    signal: { value: -113, unit: "dB", source: signalFrom("225 million km, average") },
    travel: { value: 7, unit: "months", source: nasa("NASA Mars Exploration: the trip to Mars takes about seven months") } },
  { id: "venus", name: "Venus", open: false,
    sunlight: { value: 2601, unit: "W/m2, 191% of Earth", source: factSheet },
    signal: null,
    travel: { value: 4, unit: "months", source: team("Team estimate, not yet checked against a NASA source") } },
  { id: "jupiter", name: "Jupiter", open: false,
    sunlight: { value: 50, unit: "W/m2, 4% of Earth", source: factSheet },
    signal: null,
    travel: { value: 5, unit: "years", source: nasa("NASA Juno: launched 2011, reached Jupiter in 2016") } },
];
const missions: MissionCard[] = [
  { id: "EW-1", world: "earth", name: "Earth Watch", open: true,
    summary: "A 3U CubeSat photographs one region once a week for 52 weeks.",
    who: "Scientists and rangers who look after the region, and the people who live there.",
    why: "A picture every week shows change early: forest cleared, a fire scar, ice breaking up. They can act in time, and an image counts only when it reaches them." },
  { id: "radiation-survey", world: "earth", name: "Radiation survey", open: false,
    summary: "Measure the radiation dose a spacecraft receives in low Earth orbit.",
    who: "Spacecraft engineers.", why: "To design electronics that last in orbit." },
  { id: "space-weather", world: "earth", name: "Space weather watch", open: false,
    summary: "Track how solar storms disturb Earth's magnetic field.",
    who: "Power grid and satellite operators.", why: "To get warning before a storm reaches Earth." },
  { id: "cloud-ice", world: "earth", name: "Cloud ice survey", open: false,
    summary: "Measure the ice high in clouds at every hour of the day.",
    who: "Weather and climate modellers.", why: "Cloud ice is one of the largest unknowns in their models." },
];

/** Toy rule: the tests that verify each requirement. Unity decides this for real. */
const VERIFIED_BY: Record<string, string[]> = { images: ["day", "thermal"], deadline: ["vibration"] };

const STEPS: Step[] = ["goals", "concept", "requirements", "design", "build", "fly"];

function initial(): MissionState {
  return {
    mission: {
      id: "EW-1", name: "Earth Watch",
      summary: "A 3U CubeSat photographs one region of Earth once a week for 52 weeks. An image counts only when it reaches the scientists.",
    },
    steps: STEPS.map((step, i) => ({ step, status: i === 0 ? "open" : "locked" })),
    design: { tests: [] },
    groups,
    requirements: [
      { id: "images", label: "Weekly images delivered", value: 45, unit: "of 52", min: 26, max: 52, check: "Counted in the simulated year",
        source: team("A rule of the game; NASA gives no minimum") },
      { id: "deadline", label: "Months to reach orbit", value: 24, unit: "months", min: 9, max: 36, check: "Launch option wait time",
        source: nasa("NASA CubeSat 101: 9 months at the fastest, 18 to 24 typical") },
      { id: "reserve", label: "Budget reserve", value: 10, unit: "%", min: 0, max: 30, check: "Reserve set in build and verify",
        source: nasa("NASA CubeSat 101: reserves of at least 10% of the budget") },
    ],
    resources: [], issues: [], attempts: [],
    worlds, missions, reserve: 0.1,
  };
}

function recompute(s: MissionState): MissionState {
  const picked = Object.entries(s.design).flatMap(([g, v]) =>
    (Array.isArray(v) ? v : v ? [v] : []).map((id) => `${g}:${id}`));
  const sum = (k: keyof Fx) => picked.reduce((t, p) => t + (FX[p]?.[k] ?? 0), 0) + (BASE[k] ?? 0);
  const has = (g: Group) => Boolean(s.design[g]) && (s.design[g] as unknown[]).length !== 0;
  const pick = (g: Group) => s.design[g] as string | undefined;
  const spec = (g: Group, label: string) =>
    groups.find((x) => x.group === g)?.options.find((o) => o.id === pick(g))?.stats.find((t) => t.label === label)?.value as number | undefined;
  const reserve = (s.reserve ?? 0.1) * 100;
  const resources: Resource[] = [
    { kind: "mass", used: round(sum("mass")), available: spec("format", "Mass limit") ?? 0, unit: "kg", known: has("format"),
      source: nasa("NASA CubeSat 101: the mass limit of the chosen format") },
    { kind: "power", used: round(sum("power")), available: spec("power", "Power") ?? 0, unit: "W", known: has("power"),
      source: team("Power of the chosen panels; team value") },
    { kind: "budget", used: sum("cost"), available: Math.round(1_500_000 * (1 - reserve / 100)), unit: "USD", known: true,
      source: team("Total budget is the team's: NASA publishes none for this kind of CubeSat. Minus the reserve") },
    { kind: "data", used: sum("data"), available: has("storage") ? (pick("storage") === "large" ? 16000 : 2000) : 0, unit: "MB", known: has("storage"),
      source: team("Capacity of the chosen storage; team value") },
    { kind: "communications", used: sum("data"), available: sum("link"), unit: "MB/day", known: has("radio"),
      source: derived("Rate of the chosen radio over the daily contacts") },
    { kind: "time", used: (spec("launch", "Wait") ?? 0), available: 24, unit: "months", known: true,
      source: nasa("NASA CubeSat 101: 18 to 24 months is typical to reach orbit") },
  ];
  const issues: Issue[] = [];
  const over = (kind: ResourceKind, step: Step, label: string) => {
    const r = resources.find((x) => x.kind === kind)!;
    if (r.known && r.used > r.available)
      issues.push({ code: `${kind}.over`, severity: "critical", resource: kind, step, message: `${label} is over its limit: ${r.used} of ${r.available} ${r.unit}.` });
  };
  over("mass", "design", "Mass"); over("power", "design", "Power"); over("budget", "design", "Budget");
  if (has("instrument") && has("radio") && pick("storage") === "small" && pick("instrument") === "multi")
    issues.push({ code: "data.tight", severity: "warning", resource: "data", step: "design", message: "Small storage will fill quickly with multispectral images." });
  if (has("groundStation") && !has("backupStation"))
    issues.push({ code: "backup.unset", severity: "info", resource: null, step: "design", message: "No backup ground station chosen yet." });
  const tests = (s.design.tests as string[] | undefined) ?? [];
  const minReserve = s.requirements.find((r) => r.id === "reserve")?.value ?? 0;
  const requirements = s.requirements.map((r) => ({
    ...r,
    verified: r.id === "reserve" ? reserve >= r.value : (VERIFIED_BY[r.id] ?? []).every((t) => tests.includes(t)),
  }));
  if (reserve < minReserve)
    issues.push({ code: "reserve.low", severity: "warning", resource: "budget", step: "build",
      message: `The reserve is ${Math.round(reserve)}%, below the ${minReserve}% the requirements ask for.` });
  return { ...s, requirements, resources, issues };
}
const round = (n: number) => Math.round(n * 100) / 100;

export function createStandin(emit: (m: UnityToPage) => void) {
  let state = recompute(initial());
  const flight = createFlightStandin(emit, { vehicle: () => {
    const id = state.design.launch;
    return typeof id === "string" ? id : null;
  } });
  const push = () => emit({ type: "state", payload: state });
  const setStatus = (step: Step, status: StepStatus) => {
    state = { ...state, steps: state.steps.map((s) => (s.step === step ? { ...s, status } : s)) };
  };

  function handle(msg: PageToUnity) {
    switch (msg.type) {
      case "ready": push(); return;
      case "choose":
        state = recompute({ ...state, design: { ...state.design, [msg.payload.group]: msg.payload.id } });
        push(); return;
      case "toggle": {
        const cur = (state.design[msg.payload.group] as string[] | undefined) ?? [];
        const next = cur.includes(msg.payload.id) ? cur.filter((i) => i !== msg.payload.id) : [...cur, msg.payload.id];
        state = recompute({ ...state, design: { ...state.design, [msg.payload.group]: next } });
        push(); return;
      }
      case "setRequirement":
        state = recompute({ ...state, requirements: state.requirements.map((r) =>
          r.id === msg.payload.id ? { ...r, value: Math.min(r.max, Math.max(r.min, msg.payload.value)) } : r) });
        push(); return;
      case "setReserve":
        // The reserve requirement is the minimum asked for; this is the reserve actually kept.
        state = recompute({ ...state, reserve: Math.min(1, Math.max(0, msg.payload.fraction)) });
        push(); return;
      case "completeStep": {
        setStatus(msg.payload.step, "done");
        const next = STEPS[STEPS.indexOf(msg.payload.step) + 1];
        if (next) setStatus(next, "open");
        push(); return;
      }
      case "close": emit({ type: "closeScreen", payload: {} }); return;
      case "fly": case "command": flight.handle(msg); return; // replays the recorded flight
    }
  }
  return { handle };
}
