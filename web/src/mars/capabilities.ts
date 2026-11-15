// THE TEAM'S RULE: how the satellite designed in Act 1 becomes what the crew has on Mars.
// This is the only place that reads an Act 1 design. Change the tables below to change the rule.
// Nothing here is NASA's: it is a game rule, labelled "team". Only the clamp limits come from the CSV.
import { NASA } from "./data";
import type { Act1Design, Act1Extras, RelayCapabilities } from "./types";

/** Quality of an option, 0 (poor) to 2 (good). An id not listed counts as middling (1); no choice counts as 0. */
const QUALITY: Record<string, Record<string, number>> = {
  format: { "3u": 0, "6u": 2 },
  power: { fixed: 0, deploy: 2 },
  attitude: { magnetorquers: 0, reaction: 2 },
  storage: { small: 0, large: 2 },
  instrument: { none: 0, rgb: 1, multi: 2 },
  radio: { uhf: 0, sband: 2 },
  groundStation: { own: 1, network: 2 },
  backupStation: { none: 0, network: 2 },
  orbit: { "leo-iss": 1, "leo-sso": 2 },
};

export function quality(design: Act1Design, group: string): number {
  const v = design[group];
  if (v === null || v === undefined) return 0;
  if (Array.isArray(v)) return Math.min(2, (v.length * 2) / 3); // tests: all three = 2
  return QUALITY[group]?.[v] ?? 1;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function deriveCapabilities(design: Act1Design, extras: Act1Extras = {}): RelayCapabilities {
  const q = (g: string) => quality(design, g);
  const reserve = clamp(extras.reserve ?? 0.1, 0, 0.5);
  const margin = Math.max(0, extras.massMarginKg ?? 0);

  // Instrument: how much of the map is known before they walk.
  const mapRadiusStart = Math.round(8 + 8 * q("instrument"));
  const mapRadiusMax = Math.round(12 + 12 * q("instrument"));

  // Orbit: passes. Radio: rate. Counts and durations stay inside the CSV's ranges.
  const o = q("orbit");
  const passesPerSol = Math.round(NASA.passesPerSolMin.value + o);
  const passMinutes = Math.round((NASA.passMinutesMin.value + 3.5 * o) * 10) / 10;
  const passSolFraction = 0.45 + 0.275 * o;
  const relayRateMbps = Math.round((0.5 + 0.75 * q("radio")) * 100) / 100;
  const relayMbPerSol = Math.round(
    clamp(relayRateMbps * passesPerSol * passMinutes * 60 * 0.25, NASA.relayMbPerSolMin.value, NASA.relayMbPerSolMax.value),
  );

  // Radio and Deep Space Network time: data to Earth and how long a warning takes.
  const link = (q("groundStation") * 0.5 + q("backupStation") * 0.25 + q("radio") * 0.25);
  const dsnMbPerSol = Math.round(150 + 400 * link);
  const warningLeadSols = Math.round(((q("radio") + q("groundStation")) / 2) * 1.5);

  // Power and battery: staying alive through storms. Attitude control and tests: how often it has a fault.
  const satPowerMargin = Math.round((0.15 + 0.35 * q("power")) * 100) / 100;
  const faultPerSol = Math.round(0.09 * (1 - 0.35 * (q("attitude") / 2) - 0.4 * (q("tests") / 2)) * 10000) / 10000;

  // Storage: what the relay holds when a pass is missed.
  const relayStorageMb = Math.round(300 + 600 * q("storage"));

  // Mass and budget left become supplies and spare parts.
  const supplyDays = Math.round(-3 + 40 * reserve);
  const materialsKg = Math.round(270 + 800 * reserve + 4 * margin);
  const spares = Math.round(1 + 14 * reserve + margin);

  return {
    mapRadiusStart, mapRadiusMax, relayRateMbps, passesPerSol, passMinutes, passSolFraction, relayMbPerSol,
    dsnMbPerSol, warningLeadSols, satPowerMargin, faultPerSol, relayStorageMb, supplyDays, materialsKg, spares,
  };
}

/** Where each capability's number comes from, for the source tag on the screen. */
export const CAPABILITY_SOURCES: Record<keyof RelayCapabilities, string> = {
  mapRadiusStart: "team", mapRadiusMax: "team", relayRateMbps: "C14", passesPerSol: "C15", passMinutes: "C17",
  passSolFraction: "team", relayMbPerSol: "C21", dsnMbPerSol: "team", warningLeadSols: "team",
  satPowerMargin: "team", faultPerSol: "E07", relayStorageMb: "team", supplyDays: "team", materialsKg: "team", spares: "team",
};

// ---- fixtures: a good, a middling and a poor design (ids of the Act 1 stand-in) ----

export interface DesignFixture { name: string; design: Act1Design; extras: Act1Extras }

export const GOOD_DESIGN: DesignFixture = {
  name: "good",
  design: {
    format: "6u", power: "deploy", attitude: "reaction", storage: "large", instrument: "multi", radio: "sband",
    groundStation: "network", backupStation: "network", orbit: "leo-sso", tests: ["vibration", "thermal", "day"],
  },
  extras: { reserve: 0.2, massMarginKg: 1 },
};

export const MIDDLING_DESIGN: DesignFixture = {
  name: "middling",
  design: {
    format: "6u", power: "deploy", attitude: "magnetorquers", storage: "large", instrument: "rgb", radio: "sband",
    groundStation: "own", backupStation: "none", orbit: "leo-iss", tests: ["vibration", "thermal"],
  },
  extras: { reserve: 0.15, massMarginKg: 0 },
};

export const POOR_DESIGN: DesignFixture = {
  name: "poor",
  design: {
    format: "3u", power: "fixed", attitude: "magnetorquers", storage: "small", instrument: "rgb", radio: "uhf",
    groundStation: "own", backupStation: "none", orbit: "leo-iss", tests: [],
  },
  extras: { reserve: 0.02, massMarginKg: 0 },
};

export const DESIGN_FIXTURES: DesignFixture[] = [GOOD_DESIGN, MIDDLING_DESIGN, POOR_DESIGN];
