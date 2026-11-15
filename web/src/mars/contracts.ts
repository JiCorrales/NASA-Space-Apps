// The behavioural interfaces of the rules. Each is small on purpose: add a new activity, hazard, module or task
// by writing one object, with nothing else to change.
import type { MarsWorld } from "./world";
import type { Player } from "./player";
import type {
  ActivityId, HazardId, ModuleId, Pos, RelayCapabilities, SkillId, Target, TaskId,
} from "./types";

/** A reason an activity cannot start. `shared` reasons depend on information a cut-off player does not have. */
export interface Block { reason: string; shared: boolean }

export interface ActivityContext {
  /** Work this player does today: base work x skill x health x time left after walking x planning. */
  effort: number;
  /** Time left after walking, 0 to 1. */
  fraction: number;
}

export interface PerformResult { text: string; ok: boolean }

export interface Activity {
  readonly id: ActivityId;
  readonly name: string;
  readonly summary: string;
  /** The skill that makes it faster and steadier; null if none counts. */
  readonly skill: SkillId | null;
  /** Costs more energy. */
  readonly heavy: boolean;
  /** Done outside the habitat (suit, dust, dose). */
  readonly outdoors: boolean;
  readonly targetKind: "none" | "module" | "site" | "player" | "tile";
  /** Tiles from `where` within which the work can be done. */
  readonly reach: number;
  /** Can fail. Resting and walking do not. */
  readonly fallible: boolean;
  blocked(w: MarsWorld, p: Player, t: Target): Block | null;
  /** The place the work is done, or null if it can be done anywhere. */
  where(w: MarsWorld, p: Player, t: Target): Pos | null;
  /** Targets worth offering to this player now. */
  targets(w: MarsWorld, p: Player, informed: boolean): Target[];
  /** Runs when the player is in place and the attempt goes well. Failure is handled by the world. */
  perform(w: MarsWorld, p: Player, t: Target, c: ActivityContext): PerformResult;
}

export interface HazardOccurrence { hazard: HazardId; startSol: number; durationSols: number; intensity: number }

export interface Hazard {
  readonly id: HazardId;
  readonly name: string;
  readonly source: string;
  /** Drawn from the seed and the satellite's capabilities. */
  plan(seed: number, caps: RelayCapabilities): HazardOccurrence[];
  /** What it does in a sol (once per sol, after the players' work). `occ` is null for hazards that are always there. */
  apply(w: MarsWorld, occ: HazardOccurrence | null): void;
  /** Said after the run, never during it. */
  cause(occ: HazardOccurrence | null, w: MarsWorld): string;
}

export interface BaseModule {
  readonly id: ModuleId;
  readonly name: string;
  readonly effect: string;
  readonly builtAtStart: boolean;
  readonly materialsKg: number;
  readonly workUnits: number;
  readonly powerWhPerWork: number;
  /** Offset from the habitat tile. */
  readonly offset: Pos;
}

export interface MissionTask {
  readonly id: TaskId;
  readonly name: string;
  readonly summary: string;
  isDone(w: MarsWorld): boolean;
  /** Can no longer be done this run. */
  isFailed(w: MarsWorld): boolean;
  progress(w: MarsWorld): { done: number; total: number };
}
