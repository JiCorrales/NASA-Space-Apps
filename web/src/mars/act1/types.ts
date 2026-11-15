// Types of Act 1 (Mars): the hand-over to Act 2 and the launch act.
//
// COPIED, NOT IMPORTED. The block "Act 2 contract" is copied word for word from `web/src/mars/types.ts` on the
// branch `origin/feat/mars-rules` (commit bcbb04f, "feat(mars): add the public types of the Act 2 rules"). That
// branch is not merged; when both land, delete this block and import from `../types`.
//
// The block "Launch act" is copied from `web/src/bridge/types.ts` on `origin/feat/launch-phase` (commit 891d511,
// "feat(bridge): add the launch act to SimFrame"), which is not merged either.

// ---------------------------------------------------------------- Act 2 contract (from feat/mars-rules)

export const ROLES = ["commander", "engineer", "scientist", "comms"] as const;
export type Role = (typeof ROLES)[number];

/** A look is only how a character is drawn. Any look goes with any role. */
export const LOOKS = ["amber", "teal", "violet", "coral"] as const;
export type Look = (typeof LOOKS)[number];

export interface CrewSetup { name: string; role: Role; look: Look }

/** The Act 1 `design` object: option ids by group (see web/src/bridge/types.ts). */
export type Act1Design = Partial<Record<string, string | string[] | null>>;
export interface Act1Extras {
  /** Fraction of the budget kept in reserve, 0 to 1 (MissionState.reserve). */
  reserve?: number;
  /** Mass margin left under the limit, kg. */
  massMarginKg?: number;
}

/** What the satellite gives the crew. Derived from the Act 1 design by `deriveCapabilities`. */
export interface RelayCapabilities {
  /** Tiles around the base known before anyone walks, and how far reading the satellite's maps can extend it. */
  mapRadiusStart: number; mapRadiusMax: number;
  relayRateMbps: number; passesPerSol: number; passMinutes: number;
  /** Share of sols with a pass over the base, 0 to 1. */
  passSolFraction: number;
  /** Megabits the base can send up on a sol with a pass. */
  relayMbPerSol: number;
  /** Megabits the Deep Space Network takes down to Earth per sol. */
  dsnMbPerSol: number;
  /** How many sols ahead a storm warning reaches the crew (0 = none). */
  warningLeadSols: number;
  /** 0 to 1: how well the satellite rides out storms. */
  satPowerMargin: number;
  /** Chance per sol, as a rate, of an extra fault. Internal: never shown. */
  faultPerSol: number;
  relayStorageMb: number;
  /** Crew-days of air, water and food beyond the minimum, building materials, spare parts. */
  supplyDays: number; materialsKg: number; spares: number;
}

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
