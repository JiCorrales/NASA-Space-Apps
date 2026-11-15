// Helpers shared by the tests of the rules. Not part of the game.
import { GOOD_DESIGN, type DesignFixture } from "./capabilities";
import type { HazardOccurrence } from "./contracts";
import type { ActivityId, Choice, PlayerId, Target } from "./types";
import { NO_TARGET } from "./types";
import { MarsWorld } from "./world";

export const fresh = (seed = 1, f: DesignFixture = GOOD_DESIGN, hazards?: HazardOccurrence[]) =>
  new MarsWorld({ seed, design: f.design, extras: f.extras, ...(hazards ? { hazards } : {}) });

export const pick = (player: PlayerId, activity: ActivityId, target: Target = NO_TARGET): Choice => ({ player, activity, target });

/** Choose for the given players (everyone else rests) and resolve the sol. */
export function step(w: MarsWorld, ...choices: Choice[]) {
  for (const c of choices) w.choose(c);
  return w.resolveSol();
}

export function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out));
  else if (x && typeof x === "object") Object.values(x).forEach((v) => strings(v, out));
  return out;
}

/** The hazards of a test world: only those given happen; no satellite fault unless listed. */
export const only = (...o: HazardOccurrence[]): HazardOccurrence[] => o;
export const occ = (hazard: HazardOccurrence["hazard"], startSol: number, durationSols = 1, intensity = 1): HazardOccurrence => ({ hazard, startSol, durationSols, intensity });
