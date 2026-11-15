// The Mars session: plays the part Unity plays in the Earth version. It holds the design, answers the screens'
// messages and produces the MissionState they draw, so the five screens work unchanged. Pure logic, no drawing.

import type {
  Group, Issue, MissionCard, MissionState, PageToUnity, Requirement, Resource, ResourceKind, Step, StepStatus, World,
} from "../../bridge/types";
import {
  BUS_SOURCE, DELAY_SOURCE, GROUP_DEFS, LIGHT_MIN, MISSION, REQUIREMENT_DEFS, SUN_EARTH_WM2, SUN_MARS_WM2, SUN_SOURCE,
  TRANSFER, WINDOW_SOURCE, derived, nasa, team,
} from "./data";
import { defaultRequirements, evaluate, meets, HELD_SOLS, type Evaluation, type Requirements } from "./model";
import { capabilitiesFromDesign } from "./capabilities";
import { planLaunch, type LaunchPlan } from "./launchSequence";
import type { Act1Design, Act1Extras, RelayCapabilities } from "./types";

export const STEPS: Step[] = ["goals", "concept", "requirements", "design", "build", "fly"];
const STEP_NAME: Record<Step, string> = {
  goals: "Need and goals", concept: "Concept", requirements: "Requirements", design: "Design", build: "Build and verify", fly: "Launch and landing",
};
export const stepName = (s: Step) => STEP_NAME[s];

const GROUP_NAME: Partial<Record<Group, string>> = {
  region: "Landing region", orbit: "Orbit around Mars", revisit: "What it does on each pass", format: "Format", power: "Power",
  attitude: "Attitude control", storage: "Data storage", instrument: "Instrument", radio: "Radio",
  groundStation: "Deep Space Network time", backupStation: "Backup relay", launch: "Ride to Mars",
};

const factSheet = nasa("NASA Planetary Fact Sheet: solar irradiance");
const WORLDS: World[] = [
  { id: "mars", name: "Mars", open: true,
    sunlight: { value: SUN_MARS_WM2, unit: "W/m2, 43% of Earth", source: SUN_SOURCE },
    signal: { value: `${LIGHT_MIN.min.toFixed(0)} to ${LIGHT_MIN.max.toFixed(0)}`, unit: "min delay one way", source: DELAY_SOURCE },
    travel: { value: `${TRANSFER.minDays} to ${TRANSFER.maxDays}`, unit: "days", source: TRANSFER.source } },
  { id: "earth", name: "Earth", open: false,
    sunlight: { value: SUN_EARTH_WM2, unit: "W/m2", source: factSheet }, signal: null, travel: null },
  { id: "moon", name: "Moon", open: false,
    sunlight: { value: SUN_EARTH_WM2, unit: "W/m2, same as Earth", source: factSheet }, signal: null,
    travel: { value: 3, unit: "days", source: nasa("NASA Apollo missions: about 3 days from Earth to the Moon") } },
  { id: "venus", name: "Venus", open: false,
    sunlight: { value: 2601, unit: "W/m2, 191% of Earth", source: factSheet }, signal: null, travel: null },
  { id: "jupiter", name: "Jupiter", open: false,
    sunlight: { value: 50, unit: "W/m2, 4% of Earth", source: factSheet }, signal: null,
    travel: { value: 5, unit: "years", source: nasa("NASA Juno: launched 2011, reached Jupiter in 2016") } },
];
const MISSIONS: MissionCard[] = [
  { id: MISSION.id, world: "mars", name: MISSION.name, open: true, summary: "A CubeSat that orbits Mars for the four of you.",
    who: "The four of you, on the surface for 30 sols, and the team on Earth that waits for your data.",
    why: "From orbit it maps where you land, sees dust storms coming and carries your data home. Without it the crew sees only what is around them and talks to Earth only through their own small antenna." },
  { id: "sample-courier", world: "mars", name: "Sample courier", open: false, summary: "Carry rock samples from the surface back to orbit.", who: "", why: "" },
];

export interface LaunchRecord {
  number: number;
  seed: number;
  outcome: "ok" | "lost" | "scrubbed";
  cause: string;
  design: Act1Design;
}

/** Fresh state of the Mars session. */
interface Inner {
  design: Act1Design;
  req: Requirements;
  reserve: number;
  finished: Set<Step>;
  launches: LaunchRecord[];
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 1 }));

export class MarsSession {
  private s: Inner;
  private listeners = new Set<(state: MissionState) => void>();
  private onClose: (() => void) | null = null;

  constructor(init?: { design?: Act1Design; requirements?: Requirements; reserve?: number; finished?: Step[] }) {
    this.s = {
      design: { tests: [], ...(init?.design ?? {}) },
      req: { ...defaultRequirements(), ...(init?.requirements ?? {}) },
      reserve: init?.reserve ?? 0.1,
      finished: new Set(init?.finished ?? []),
      launches: [],
    };
  }

  /** Called on every new state. Returns the unsubscribe function. */
  subscribe(fn: (state: MissionState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  /** Called when a screen sends `close` (back to the board, Escape). */
  setOnClose(fn: (() => void) | null): void { this.onClose = fn; }

  private push() { const st = this.state(); this.listeners.forEach((l) => l(st)); }

  /** Answers one message from a screen, as Unity does. */
  handle(msg: PageToUnity): void {
    const s = this.s;
    switch (msg.type) {
      case "ready": break;
      case "choose": {
        const def = GROUP_DEFS.find((g) => g.group === msg.payload.group);
        if (!def || def.multi || !def.defs.some((d) => d.option.id === msg.payload.id)) return;
        s.design = { ...s.design, [msg.payload.group]: msg.payload.id };
        break;
      }
      case "toggle": {
        const def = GROUP_DEFS.find((g) => g.group === msg.payload.group);
        if (!def || !def.multi || !def.defs.some((d) => d.option.id === msg.payload.id)) return;
        const cur = (s.design[msg.payload.group] as string[] | undefined) ?? [];
        const next = cur.includes(msg.payload.id) ? cur.filter((i) => i !== msg.payload.id) : [...cur, msg.payload.id];
        s.design = { ...s.design, [msg.payload.group]: next };
        break;
      }
      case "setRequirement": {
        const r = REQUIREMENT_DEFS.find((x) => x.id === msg.payload.id);
        if (!r || !Number.isFinite(msg.payload.value)) return;
        s.req = { ...s.req, [r.id]: clamp(msg.payload.value, r.min, r.max) };
        break;
      }
      case "setReserve":
        if (!Number.isFinite(msg.payload.fraction)) return;
        s.reserve = clamp(msg.payload.fraction, 0, 1);
        break;
      case "completeStep": {
        const i = STEPS.indexOf(msg.payload.step);
        if (i < 0 || this.statusOf(msg.payload.step) === "locked") return;
        s.finished.add(msg.payload.step);
        break;
      }
      case "close": this.onClose?.(); return;
      case "fly": case "command": return; // the Mars launch is driven by launch(), not by the Earth flight messages
    }
    this.push();
  }

  /** A `send` for the screens. */
  readonly send = <T extends PageToUnity["type"]>(type: T, payload: Extract<PageToUnity, { type: T }>["payload"]) =>
    this.handle({ type, payload } as PageToUnity);

  get design(): Act1Design { return this.s.design; }
  get reserve(): number { return this.s.reserve; }
  get requirements(): Requirements { return { ...this.s.req }; }
  get launches(): LaunchRecord[] { return [...this.s.launches]; }
  evaluation(): Evaluation { return evaluate(this.s.design, this.s.req, this.s.reserve); }

  extras(): Act1Extras {
    const e = this.evaluation();
    return { reserve: this.s.reserve, massMarginKg: Math.max(0, Math.round((e.massLimitKg - e.massKg) * 100) / 100) };
  }
  capabilities(): RelayCapabilities {
    return capabilitiesFromDesign(this.s.design, this.extras(), this.s.req.budget);
  }

  /** Plays the launch for this design with a seed; the result is kept as an attempt. */
  launch(seed: number): LaunchPlan {
    const plan = planLaunch(this.s.design, this.s.req, this.s.reserve, seed);
    this.s.launches.push({ number: this.s.launches.length + 1, seed, outcome: plan.outcome, cause: plan.cause, design: { ...this.s.design } });
    if (plan.outcome === "ok") this.s.finished.add("fly");
    this.push();
    return plan;
  }

  /** Locked, open, done or problem, by the Earth version's rules. */
  statusOf(step: Step): StepStatus {
    const i = STEPS.indexOf(step);
    if (this.s.finished.has(step)) return this.problemsOf(step) ? "problem" : "done";
    if (step === "fly" && this.s.launches.some((l) => l.outcome !== "ok")) return "problem";
    return i === 0 || this.s.finished.has(STEPS[i - 1]!) ? "open" : "locked";
  }

  private problemsOf(step: Step): boolean {
    const e = this.evaluation();
    if (GROUP_DEFS.some((g) => g.step === step && !g.multi && e.missing.includes(g.group))) return true;
    return this.issues(e).some((x) => x.step === step && x.severity === "critical");
  }

  private issues(e: Evaluation): Issue[] {
    const s = this.s;
    const out: Issue[] = [];
    const add = (code: string, severity: Issue["severity"], resource: ResourceKind | null, step: Step, message: string) =>
      out.push({ code, severity, resource, step, message });
    // A skipped choice, reported on the step where it is made, once that step was finished.
    for (const g of GROUP_DEFS) {
      if (g.multi || !e.missing.includes(g.group) || !s.finished.has(g.step)) continue;
      add(`${g.group}.missing`, "warning", null, g.step, `Not chosen yet: ${GROUP_NAME[g.group] ?? g.group}.`);
    }
    const has = (g: string) => !e.missing.includes(g);
    if (has("format") && e.massKg > e.massLimitKg)
      add("mass.over", "critical", "mass", "design", `Mass is over its limit: ${fmt(e.massKg)} of ${fmt(e.massLimitKg)} kg.`);
    if (has("power") && e.powerW > e.panelW)
      add("power.over", "critical", "power", "design", `Power is over what the panels give at Mars: ${fmt(e.powerW)} of ${fmt(e.panelW)} W.`);
    if (e.costUsd > e.budgetUsd)
      add("budget.over", "critical", "budget", "design", `The design costs ${fmt(e.costUsd)} USD, more than the whole budget of ${fmt(e.budgetUsd)} USD.`);
    else if (e.costUsd > e.budgetAvailableUsd)
      add("budget.reserve", "warning", "budget", "design", `The design costs ${fmt(e.costUsd)} USD and eats into the reserve: ${fmt(e.budgetAvailableUsd)} USD are free to spend.`);
    if (e.months > e.deadlineMonths)
      add("time.over", "critical", "time", "design", `Building and testing take ${fmt(e.months)} months; the cargo flight leaves in ${fmt(e.deadlineMonths)}.`);
    if (s.design.power === "large" && s.design.format === "3u")
      add("power.format", "critical", "power", "design", "Large deployable panels are made for a 6U; a 3U cannot carry them.");
    if (has("storage") && e.heldMb > e.storageMb)
      add("data.storage", "warning", "data", "design", `Storage holds ${fmt(e.storageMb)} Mb; ${HELD_SOLS} sols of data come to ${fmt(e.heldMb)} Mb.`);
    // What the design gives against what the crew asked for.
    const m = meets(e, s.req, s.reserve);
    if (has("instrument") && !m.mapDetail)
      add("req.mapDetail", "warning", null, "design", `Map detail: the design shows ${fmt(e.pixelM)} m per pixel; the requirement is ${fmt(s.req.mapDetail!)} m.`);
    if (has("instrument") && !m.warning)
      add("req.warning", "warning", null, "design", `Storm warning: the design sees ${e.warningSols} sols ahead; the requirement is ${s.req.warning} sols.`);
    if (has("radio") && has("groundStation") && has("orbit") && !m.dataPerSol)
      add("req.dataPerSol", "warning", "communications", "design",
        `Data to Earth: the design relays ${fmt(e.earthMbPerSol)} Mb per sol (passes ${fmt(e.relayMbPerSol)}, Deep Space Network ${fmt(e.dsnMbPerSol)}); the requirement is ${fmt(s.req.dataPerSol!)} Mb.`);
    if (!(e.tests.includes("vibration")) && s.finished.has("build"))
      add("tests.vibration", "warning", null, "build", "No vibration test chosen: the cargo flight accepts no payload without one.");
    if (!m.reserve)
      add("reserve.low", "warning", "budget", "build", `The reserve is ${Math.round(s.reserve * 100)}%, below the ${s.req.reserve}% the requirements ask for.`);
    return out;
  }

  private resources(e: Evaluation): Resource[] {
    const has = (g: string) => !this.s.design[g] ? false : true;
    return [
      { kind: "mass", used: e.massKg, available: e.massLimitKg, unit: "kg", known: has("format"),
        source: nasa("CubeSat Design Specification rev 14.1, Table 1: the chosen format's limit, or the mass requirement if lower. Parts: SOA 2026 and team values") },
      { kind: "power", used: e.powerW, available: e.panelW, unit: "W at Mars", known: has("power"), source: SUN_SOURCE },
      { kind: "budget", used: e.costUsd, available: e.budgetAvailableUsd, unit: "USD", known: true,
        source: team("The total budget is the team's, minus the reserve; NASA publishes none for such a mission") },
      { kind: "data", used: e.heldMb, available: e.storageMb, unit: "Mb", known: has("storage"),
        source: team(`Team rule: storage holds ${HELD_SOLS} sols of the instrument's and the crew's data, for missed passes`) },
      { kind: "communications", used: this.s.req.dataPerSol ?? 0, available: e.earthMbPerSol, unit: "Mb per sol",
        known: has("radio") && has("groundStation") && has("orbit"),
        source: derived("The smaller of the passes (UHF up to 2 Mbps, CSV row C14) and the Deep Space Network hours times the radio's rate (team values)") },
      { kind: "time", used: e.months, available: e.deadlineMonths, unit: "months", known: true, source: WINDOW_SOURCE },
    ];
  }

  private requirementsOut(e: Evaluation): Requirement[] {
    const m = meets(e, this.s.req, this.s.reserve);
    const tests = e.tests;
    const checked = this.s.finished.has("build") || tests.length > 0;
    return REQUIREMENT_DEFS.map((r) => ({
      id: r.id, label: r.label, value: this.s.req[r.id] ?? r.value, unit: r.unit, min: r.min, max: r.max, check: r.check, source: r.source,
      ...(checked ? { verified: Boolean(m[r.id]) && r.verifiedBy.every((t) => tests.includes(t)) } : {}),
    }));
  }

  /** The MissionState the screens draw. */
  state(): MissionState {
    const e = this.evaluation();
    return {
      mission: { id: MISSION.id, name: MISSION.name, summary: MISSION.summary },
      steps: STEPS.map((step) => ({ step, status: this.statusOf(step) })),
      design: { ...this.s.design },
      groups: GROUP_DEFS.map((g) => ({ group: g.group, step: g.step, multi: g.multi, options: g.defs.map((d) => d.option) })),
      requirements: this.requirementsOut(e),
      resources: this.resources(e),
      issues: this.issues(e),
      attempts: [],
      worlds: WORLDS,
      missions: MISSIONS,
      reserve: this.s.reserve,
    };
  }
}

/** For the board: where the bus figures come from. */
export const BUS_NOTE = BUS_SOURCE;
