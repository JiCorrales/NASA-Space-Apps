// The seam between the screen and the rules: the screen only knows this shape. `MarsWorld` (package A) is plugged
// in through `RunFactory`; the tests plug in a small fixture. The screen never computes a rule.
import type {
  Act1Design, Act1Extras, Attempt, Choice, CrewSetup, EveningView, KeyValueStorage, PlayerController, PlayerId, PlayerView,
  RelayCapabilities, RunResult, SolReport,
} from "../types";

/** The Act 1 satellite designs the page offers until Act 1 supplies the real one. */
export const DESIGNS = [
  { id: "good", label: "GOOD SATELLITE" },
  { id: "middling", label: "MIDDLING SATELLITE" },
  { id: "poor", label: "POOR SATELLITE" },
] as const;
/** "yours" is the design Act 1 handed over; the three fixtures stay selectable either way. */
export type DesignId = (typeof DESIGNS)[number]["id"] | "yours";

/** What Act 1 writes to localStorage under `mars.handoff` before sending the player here. */
export interface Handoff { design: Act1Design; extras: Act1Extras; crew: CrewSetup[]; capabilities: RelayCapabilities }
export const HANDOFF_KEY = "mars.handoff";
export const HISTORY_KEY = "mars.history";

const guard = <T>(f: () => T, fallback: T): T => { try { return f(); } catch { return fallback; } };
const store = (): KeyValueStorage | null => guard(() => window.localStorage, null);

/** The hand-over from Act 1, or null when there is none or it does not parse. */
export function readHandoff(s: KeyValueStorage | null = store()): Handoff | null {
  const raw = guard(() => s?.getItem(HANDOFF_KEY) ?? null, null);
  if (!raw) return null;
  const h = guard(() => JSON.parse(raw) as Partial<Handoff>, null);
  return h && Array.isArray(h.crew) && h.crew.length === 4 && h.capabilities && typeof h.capabilities === "object" ? { design: h.design ?? {}, extras: h.extras ?? {}, crew: h.crew, capabilities: h.capabilities } : null;
}

export function readHistory(s: KeyValueStorage | null = store()): Attempt[] {
  const v = guard(() => JSON.parse(s?.getItem(HISTORY_KEY) ?? "[]") as unknown, []);
  return Array.isArray(v) ? (v as Attempt[]) : [];
}

/** Appends an attempt to `mars.history` (Act 1's mission board reads it). */
export function appendHistory(a: Attempt, s: KeyValueStorage | null = store()): Attempt[] {
  const all = [...readHistory(s), a];
  guard(() => s?.setItem(HISTORY_KEY, JSON.stringify(all)), undefined);
  return all;
}

/** What the screen needs from a world. The method names follow `MarsWorld`. */
export interface MarsEngine {
  viewFor(p: PlayerId): PlayerView;
  /** Records (or replaces) the choice of one player for the current sol. */
  choose(c: Choice): void;
  /** Plays the sol with the choices made so far and moves on to the next one. */
  resolveSol(): SolReport;
  eveningFor(p: PlayerId): EveningView;
  /** Null until the run has ended. */
  result(): RunResult | null;
  attempt(): Attempt | null;
}

export interface RunKit {
  engine: MarsEngine;
  /** The demo controller of one player. */
  demo(p: PlayerId): PlayerController;
  crew: CrewSetup[];
}

export type RunFactory = (o: { seed: number; design: DesignId; handoff: Handoff | null }) => RunKit;
