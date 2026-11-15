// Types of Act 1 (Mars): the hand-over to Act 2 and the launch act.
//
// The Act 2 contract (roles, looks, crew, design, extras, capabilities) lives in `../types` and is re-exported here.
// The "Launch act" block is copied from `web/src/bridge/types.ts` on `origin/feat/launch-phase` (commit 891d511,
// "feat(bridge): add the launch act to SimFrame"), which is not merged: delete it when that branch lands.

import type { Act1Design, Act1Extras, CrewSetup, RelayCapabilities } from "../types";
export { ROLES, LOOKS } from "../types";
export type { Act1Design, Act1Extras, CrewSetup, Look, Role, RelayCapabilities } from "../types";

// ---------------------------------------------------------------- Launch act (from feat/launch-phase)

/** Moments of the launch act, in flight order ("hold" stops the countdown). */
export type LaunchStage =
  | "countdown" | "hold" | "liftoff" | "maxq" | "staging" | "fairing" | "orbit" | "separation" | "deploy" | "done";
/** One station of the launch-day GO/NO-GO poll. `go` is null until the station has been polled. */
export interface PollStation { station: string; go: boolean | null }
/** The launch act. Display only: the Mars session decides every value and the outcome. */
export interface LaunchFrame {
  stage: LaunchStage;
  /** Mission elapsed time in seconds, negative before lift-off. */
  met: number;
  /** Id of the launch option chosen in the design. */
  vehicle: string;
  altitudeKm: number;
  velocityKms: number;
  /** 0 to 1 along the ascent. */
  progress: number;
  poll: PollStation[];
  /** What mission control says, English, ready to show. */
  line: string;
  /** null while the launch goes on. "lost" and "scrubbed" end the attempt. */
  outcome: null | "ok" | "lost" | "scrubbed";
}

// ---------------------------------------------------------------- Act 1 own types

/** The hand-over to Act 2, written to localStorage under `mars.handoff`. Exactly this shape. */
export interface Act1Handoff {
  design: Act1Design;
  extras: Act1Extras;
  crew: CrewSetup[];
  capabilities: RelayCapabilities;
}
