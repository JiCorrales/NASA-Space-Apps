// The one place where the finished design becomes what the crew gets on Mars (docs/mars-plan.md, section 4).
// Every rule here is the team's (CAPABILITY_RULES in data.ts): NASA gives none turning a CubeSat's parts into maps,
// warnings, links or supplies.

import { BUDGET_DEFAULT_USD, CAPABILITY_RULES as R } from "./data";
import { defaultRequirements, evaluate } from "./model";
import type { Act1Design, Act1Extras, RelayCapabilities } from "./types";

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/**
 * What the satellite gives the crew. `budgetUsd` is the total budget the team set in the requirements (the
 * hand-over carries only the design and the extras, so it defaults to the team's starting budget).
 */
export function capabilitiesFromDesign(design: Act1Design, extras: Act1Extras, budgetUsd = BUDGET_DEFAULT_USD): RelayCapabilities {
  const reserve = extras.reserve ?? 0.1;
  const e = evaluate(design, { ...defaultRequirements(), budget: budgetUsd }, reserve);
  const plan = typeof design.revisit === "string" ? design.revisit : "";
  const tests = e.tests;

  // Instrument and orbit: how much of the map is known before anyone walks.
  const mapRadiusStart = Number.isFinite(e.pixelM) ? R.mapRadius.find((m) => e.pixelM <= m.pixelM)!.tiles : 1;
  const growth = Number.isFinite(e.pixelM) ? R.mapGrowth + (plan === "watch" ? 2 : plan === "balanced" ? 1 : 0) : 0;
  const mapRadiusMax = mapRadiusStart + growth;

  // Radio and Deep Space Network time: data per sol both ways of the satellite, and the warning lead.
  const relayMbPerSol = e.relayMbPerSol;
  const dsnMbPerSol = e.dsnMbPerSol;

  // Power and battery: how far the panels' output stays above the load, plus what the battery carries.
  const margin = e.powerW > 0 && e.panelW > 0 ? (e.panelW - e.powerW) / e.powerW : -1;
  const satPowerMargin = r2(clamp(margin * 0.8 + e.batteryWh / 200));

  // Attitude control and tests: how often the satellite has a fault the crew must deal with.
  const testCount = ["vibration", "thermal", "deploy", "ditl"].filter((t) => tests.includes(t)).length;
  const faultPerSol = r2(Math.max(R.faultMin, R.faultBase - R.faultPerTest * testCount - (design.attitude === "star" ? R.faultStar : 0)));

  // Mass and budget left: supplies, materials and spares the crew lands with.
  const budgetLeft = Math.max(0, e.budgetUsd - e.costUsd);
  const massMargin = Math.max(0, extras.massMarginKg ?? Math.max(0, e.massLimitKg - e.massKg));
  const supplyDays = Math.floor(budgetLeft / R.usdPerSupplyDay);
  const materialsKg = Math.round(R.materialsBaseKg + R.materialsPerMarginKg * massMargin);
  const spares = 1 + Math.floor(budgetLeft / R.usdPerSpare);

  return {
    mapRadiusStart, mapRadiusMax,
    relayRateMbps: e.relayRateMbps, passesPerSol: e.passesPerSol, passMinutes: e.passMinutes,
    passSolFraction: r2(e.passSolFraction),
    relayMbPerSol, dsnMbPerSol,
    warningLeadSols: e.warningSols,
    satPowerMargin, faultPerSol,
    relayStorageMb: e.storageMb,
    supplyDays, materialsKg, spares,
  };
}

/** In words, for the landing summary: what the crew has. No odds, only what is. */
export function describeCapabilities(c: RelayCapabilities, region: string): string[] {
  const lines: string[] = [];
  lines.push(`Before anyone walks, the map around the base at ${region} is known ${c.mapRadiusStart} tiles out; reading the satellite's maps can push it to ${c.mapRadiusMax}.`);
  lines.push(c.passesPerSol === 1 && c.passMinutes >= 240
    ? `The satellite stays over the base all sol; its radio is on ${Math.round(c.passMinutes / 60)} hours of each sol.`
    : `It passes over the base ${c.passesPerSol} times a sol, ${c.passMinutes} minutes each time, on ${Math.round(c.passSolFraction * 30)} of every 30 sols.`);
  lines.push(`On a sol with a pass it takes up to ${c.relayMbPerSol.toLocaleString("en-US")} Mb from the base; the Deep Space Network brings ${c.dsnMbPerSol.toLocaleString("en-US")} Mb a sol down to Earth.`);
  lines.push(c.warningLeadSols > 0
    ? `When a dust storm forms, word of it reaches the crew ${c.warningLeadSols} sol${c.warningLeadSols === 1 ? "" : "s"} before it arrives.`
    : "It cannot see storms coming: the crew learns of one when the sky darkens.");
  lines.push(`It holds ${c.relayStorageMb.toLocaleString("en-US")} Mb when a pass is missed.`);
  lines.push(c.satPowerMargin >= 0.6 ? "Its panels give well over what it uses, with a large battery behind them."
    : c.satPowerMargin >= 0.3 ? "Its panels give more than it uses, with a small margin."
    : "Its panels give barely what it uses, or less.");
  lines.push(`The crew lands with ${c.supplyDays} days of extra air, water and food, ${c.materialsKg} kg of building materials and ${c.spares} spare part${c.spares === 1 ? "" : "s"}.`);
  return lines;
}
