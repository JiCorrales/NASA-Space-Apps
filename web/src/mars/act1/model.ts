// The design as numbers: what a set of choices weighs, draws, costs, takes in time, and what it can do.
// Pure functions over the data module. The session shows these; capabilitiesFromDesign turns them into Act 2.

import { BUS, BUDGET_DEFAULT_USD, CAPABILITY_RULES, GROUP_DEFS, REQUIREMENT_DEFS, THRUSTER_KG, effectOf, type Effect } from "./data";
import type { Act1Design } from "./types";

export type Requirements = Record<string, number>;

export const defaultRequirements = (): Requirements =>
  Object.fromEntries(REQUIREMENT_DEFS.map((r) => [r.id, r.value]));

export interface Evaluation {
  massKg: number; massLimitKg: number; formatLimitKg: number;
  powerW: number; panelW: number; batteryWh: number;
  costUsd: number; budgetUsd: number; budgetAvailableUsd: number;
  months: number; deadlineMonths: number;
  storageMb: number; heldMb: number;
  instrumentMb: number;
  /** Ground pixel from the chosen orbit, m (Infinity with no instrument). */
  pixelM: number;
  warningSols: number;
  relayRateMbps: number; passMinutes: number; passesPerSol: number; passSolFraction: number;
  relayMbPerSol: number; dsnMbPerSol: number; earthMbPerSol: number;
  deploys: boolean; tests: string[];
  /** Groups with no choice, by group id. */
  missing: string[];
}

const pick = (d: Act1Design, g: string): string | null => {
  const v = d[g];
  return typeof v === "string" && v ? v : null;
};
const fx = (d: Act1Design, g: string): Effect => {
  const id = pick(d, g);
  return (id && effectOf(g, id)) || {};
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Storage must hold three sols of what the satellite makes and relays, for missed passes. Team rule. */
export const HELD_SOLS = 3;

export function evaluate(design: Act1Design, req: Requirements = defaultRequirements(), reserve = 0.1): Evaluation {
  const tests = Array.isArray(design.tests) ? design.tests : [];
  const chosen: Effect[] = [BUS];
  for (const g of GROUP_DEFS) {
    if (g.multi) for (const id of tests) { const e = effectOf(g.group, id); if (e) chosen.push(e); }
    else { const e = pick(design, g.group) ? effectOf(g.group, pick(design, g.group)!) : undefined; if (e) chosen.push(e); }
  }
  const sum = (k: keyof Effect) => chosen.reduce((t, e) => t + (typeof e[k] === "number" ? (e[k] as number) : 0), 0);

  const format = fx(design, "format"), power = fx(design, "power"), orbit = fx(design, "orbit"), plan = fx(design, "revisit");
  const instrument = fx(design, "instrument"), radio = fx(design, "radio"), dsn = fx(design, "groundStation");
  const launch = fx(design, "launch"), backup = fx(design, "backupStation");

  // Mass: the parts, plus thruster and propellant when the satellite flies free to Mars.
  const freeFlight = launch.ownThruster === true;
  const propellant = freeFlight ? (orbit.propellantKg ?? 0) + THRUSTER_KG : 0;
  const massKg = r1(sum("massKg") + propellant);
  const formatLimitKg = format.maxMassKg ?? 0;
  const massLimitKg = Math.min(formatLimitKg || Infinity, req.mass ?? Infinity);

  const budgetUsd = req.budget ?? BUDGET_DEFAULT_USD;
  const months = r1(sum("months"));

  // Pixel from the chosen orbit; with no orbit chosen, as from the low orbit.
  const pixelM = instrument.pixelM ? instrument.pixelM * (orbit.pixelFactor ?? 1) : Infinity;
  const warningSols = pick(design, "instrument")
    ? clamp((instrument.warnSols ?? 0) + (orbit.orbitWarn ?? 0) + (plan.planWarn ?? 0), 0, CAPABILITY_RULES.maxWarningSols)
    : 0;

  const relayRateMbps = orbit.relayMbps ?? 0;
  const passMinutes = orbit.passMin ?? 0;
  const passesPerSol = orbit.passes ?? 0;
  const passSolFraction = Math.min(1, (orbit.passSols ?? 0) + (backup.backup ? 1 : 0) * (1 - (orbit.passSols ?? 0)) * CAPABILITY_RULES.backupPassSols);
  // A radio is needed to relay at all.
  const hasRadio = Boolean(pick(design, "radio"));
  const relayMbPerSol = hasRadio ? Math.round(relayRateMbps * 60 * passMinutes * passesPerSol * (plan.relayShare ?? 0.6)) : 0;
  const dsnMbPerSol = Math.round(((radio.earthKbps ?? 0) * (dsn.dsnGain ?? 0) * (dsn.dsnHours ?? 0) * 3600) / 1000);
  const earthMbPerSol = Math.min(relayMbPerSol, dsnMbPerSol);

  const instrumentMb = instrument.dataMb ?? 0;
  const heldMb = HELD_SOLS * (instrumentMb + (req.dataPerSol ?? 0));

  const missing = GROUP_DEFS.filter((g) => !g.multi && !pick(design, g.group)).map((g) => g.group as string);

  return {
    massKg, massLimitKg: Number.isFinite(massLimitKg) ? massLimitKg : 0, formatLimitKg,
    powerW: r1(sum("powerW")), panelW: power.panelW ?? 0, batteryWh: power.batteryWh ?? 0,
    costUsd: Math.round(sum("costUsd")), budgetUsd, budgetAvailableUsd: Math.round(budgetUsd * (1 - reserve)),
    months, deadlineMonths: req.deadline ?? 24,
    storageMb: sum("storageMb"), heldMb,
    instrumentMb, pixelM, warningSols,
    relayRateMbps, passMinutes, passesPerSol, passSolFraction,
    relayMbPerSol, dsnMbPerSol, earthMbPerSol,
    deploys: Boolean(power.deploys || radio.deploys), tests: [...tests], missing,
  };
}

/** Whether the design meets each requirement that the design decides. */
export function meets(e: Evaluation, req: Requirements, reserve: number): Record<string, boolean> {
  return {
    mapDetail: e.pixelM <= (req.mapDetail ?? Infinity),
    warning: e.warningSols >= (req.warning ?? 0),
    dataPerSol: e.earthMbPerSol >= (req.dataPerSol ?? 0),
    deadline: e.months <= (req.deadline ?? Infinity),
    budget: e.costUsd <= e.budgetAvailableUsd,
    mass: e.massKg <= e.massLimitKg && e.massLimitKg > 0,
    reserve: reserve * 100 >= (req.reserve ?? 0) - 1e-9,
  };
}
