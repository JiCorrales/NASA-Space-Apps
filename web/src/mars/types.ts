// Public types of the rules of Act 2 (Mars). Data only: no behaviour here, so screens and controllers can
// depend on this file alone. Change it afterwards only by adding.
//
// Conventions:
// - A `SourceTag` is the id of a row of Resources/10-mars-surface/data/mars-surface-numbers.csv (for example
//   "R02") or the word "team" for a game-balance value. A screen shows it next to the number. Never present a
//   "team" value as NASA's.
// - Nothing in a view, briefing or in-run report states how likely something is. A storm warning relayed by the
//   satellite ("storm front expected in 2 sols") is in-world information; a probability is not.

// ---------------------------------------------------------------- basics

export const RUN_SOLS = 30;
export const PLAYER_COUNT = 4;

export const ROLES = ["commander", "engineer", "scientist", "comms"] as const;
export type Role = (typeof ROLES)[number];

/** A look is only how a character is drawn. Any look goes with any role. */
export const LOOKS = ["amber", "teal", "violet", "coral"] as const;
export type Look = (typeof LOOKS)[number];

export type PlayerId = 0 | 1 | 2 | 3;
export const PLAYER_IDS: readonly PlayerId[] = [0, 1, 2, 3];

export interface Pos { x: number; y: number }

/** A CSV row id ("R02", "B24") or "team". */
export type SourceTag = string;

/** A number with what it means and where it comes from. */
export interface Sourced { label: string; value: number; unit: string; source: SourceTag; note?: string }

export interface CrewSetup { name: string; role: Role; look: Look }

// ---------------------------------------------------------------- skills, activities, choices

export type SkillId =
  | "planning" | "logistics" | "firstAid"
  | "construction" | "repair" | "power"
  | "geology" | "analysis" | "navigation"
  | "radio" | "relay" | "forecasting";

export interface Skill { id: SkillId; name: string; level: number }

export type ActivityId =
  | "build" | "repair" | "clearDust" | "sample" | "analyse" | "readMap" | "restoreLink" | "schedulePass"
  | "sendData" | "moveSupplies" | "firstAid" | "rest" | "shelter" | "plan" | "travel"
  | "diagnoseSatellite" | "recoverSatellite";

export type ModuleId = "habitat" | "array" | "antenna" | "storage";
export type SiteId = "site-1" | "site-2" | "site-3";

export type Target =
  | { kind: "none" }
  | { kind: "module"; id: ModuleId }
  | { kind: "site"; id: SiteId }
  | { kind: "player"; id: PlayerId }
  | { kind: "tile"; x: number; y: number };

export const NO_TARGET: Target = { kind: "none" };

/** What one player does in one sol. */
export interface Choice { player: PlayerId; activity: ActivityId; target: Target }

// ---------------------------------------------------------------- map

/** Map characters: "." plain, "," rough, "~" dune, "^" boulders, "#" crater rim (cannot be crossed), "?" unknown. */
export type TileChar = "." | "," | "~" | "^" | "#" | "?";

/** A rectangle of the map as rows of TileChar. Row 0 is y = y0, column 0 is x = x0. */
export interface MapPatch { x0: number; y0: number; width: number; height: number; rows: string[] }

export interface SiteView { id: SiteId; name: string; pos: Pos; sampled: boolean; analysed: boolean; sentMb: number; datasetMb: number; deliveredMb: number }

export type SkyState = "clear" | "hazy" | "dust" | "dark";

// ---------------------------------------------------------------- gauges

export type GaugeId = "radiation" | "energy" | "rest" | "air" | "water" | "food" | "body" | "morale";

export interface GaugeView {
  id: GaugeId;
  label: string;
  /** Radiation: dose so far. The others: how full the gauge is. */
  value: number;
  max: number;
  unit: string;
  /** 0 (run out) to 1 (full), already oriented so that higher is better. */
  good: number;
  /** The gauge is low enough to slow the player down. */
  low: boolean;
  source: SourceTag;
}

export type OutReason = "radiation" | "air" | "water" | "food" | "body" | "morale";

export interface CarryView { rations: number; samples: SiteId[]; spares: number }

export interface SelfView {
  id: PlayerId; name: string; look: Look; role: Role; position: Pos;
  status: "active" | "out"; outReason: OutReason | null;
  gauges: GaugeView[]; skills: Skill[]; carrying: CarryView;
  /** The communicator works this sol. */
  linked: boolean;
}

// ---------------------------------------------------------------- views

export interface ActivityOption {
  id: ActivityId; name: string; summary: string;
  /** What the activity needs as a target. */
  targetKind: "none" | "module" | "site" | "player" | "tile";
  /** Targets this player can pick now (empty for "none" and for "tile", which accepts any tile). */
  targets: Target[];
  /** The player has the skill: it goes faster. Without it the job is slower and goes wrong more often. */
  skilled: boolean;
  /** The role's own activity. Any role may attempt any activity. */
  own: boolean;
  /** Why it cannot be chosen now, or null. */
  blocked: string | null;
}

export type ObjectKind = "module" | "site" | "player";
export interface ObjectView { kind: ObjectKind; id: string; label: string; pos: Pos; state: string }

/** What a player sees with their own eyes: a window of the map, the sky and what is in it. Always available. */
export interface Surroundings { patch: MapPatch; sky: SkyState; objects: ObjectView[] }

export type ModuleStatus = "absent" | "building" | "working" | "damaged";
export interface ModuleView { id: ModuleId; name: string; status: ModuleStatus; progress: number; needed: number; pos: Pos; effect: string }

export interface ResourceView {
  /** The six resources of the challenge. */
  kind: "power" | "mass" | "budget" | "data" | "communications" | "time";
  label: string; value: number; unit: string; detail: string; source: SourceTag;
}

export interface Warning { hazard: HazardId; inSols: number; text: string }

export type TaskId = "power-up" | "antenna" | "samples" | "satellite";
export interface TaskView { id: TaskId; name: string; summary: string; done: boolean; failed: boolean; progress: number; total: number }

export interface SatelliteView {
  state: "working" | "trouble" | "lost";
  passToday: boolean; passMinutes: number; passes: number;
  /** Megabits the relay can take from the base today. */
  capacityMb: number; storedMb: number; storageMb: number;
  diagnosed: boolean;
}

export interface PlanView { player: PlayerId; activity: ActivityId; target: Target }

export interface CrewView {
  id: PlayerId; name: string; look: Look; role: Role;
  status: "active" | "out"; linked: boolean;
  /** Last place the team knew about. */
  position: Pos;
  /** Null while this player is cut off (the team does not know what they chose). */
  plan: PlanView | null;
  /** What the team has learned of what they did, newest last. Cut-off sols appear once their link returns. */
  known: { sol: number; activity: ActivityId; target: Target }[];
  /** Last time this player's link was seen working, in sols. */
  lastContactSol: number;
}

/** The shared picture. Only players whose communicator works get it. */
export interface SharedView {
  map: { width: number; height: number; rows: string[]; base: Pos; knownRadius: number };
  sites: SiteView[];
  modules: ModuleView[];
  resources: ResourceView[];
  forecast: Warning[];
  tasks: TaskView[];
  satellite: SatelliteView;
  crew: CrewView[];
  /** What the team learned today, including what returning players did alone. */
  news: string[];
}

/**
 * Exactly what one player may know this sol. The four screens render only this.
 * A cut-off player has `shared` and `plans` as null: only their surroundings and their own gauges.
 */
export interface PlayerView {
  sol: number;
  totalSols: number;
  self: SelfView;
  surroundings: Surroundings;
  options: ActivityOption[];
  /** In-world text for the start of the sol. */
  briefing: string[];
  shared: SharedView | null;
  /** The other linked players' choices so far this sol. Null when this player is cut off. */
  plans: PlanView[] | null;
  /** This player's own choice so far this sol. */
  myChoice: Choice | null;
}

// ---------------------------------------------------------------- the sol and the run

export type HazardId = "dust-storm" | "cold-night" | "dust-settling" | "solar-storm" | "satellite-fault";
export type LinkCause = "dust-storm" | "distance" | "solar-storm" | "satellite-fault" | "hardware";

export type SolEventKind =
  | "move" | "work" | "hazard" | "link" | "pass" | "module" | "task" | "gauge" | "out"
  | "data" | "satellite" | "supplies" | "power" | "sky";

/**
 * One thing that happened during the sol, in order. `scope` says who learns of it in real time: "team" events
 * reach everyone whose link works; "solo" events (what a cut-off player did) reach only that player until their
 * link returns.
 */
export interface SolEvent {
  order: number;
  kind: SolEventKind;
  players: PlayerId[];
  scope: "team" | "solo";
  text: string;
  at?: Pos;
  from?: Pos;
  /** Tiles walked, first step to last. */
  path?: Pos[];
  activity?: ActivityId;
  target?: Target;
  ok?: boolean;
  hazard?: HazardId;
  module?: ModuleId;
  site?: SiteId;
  amount?: number;
}

export interface SolReport {
  sol: number;
  choices: Choice[];
  /** Players whose communicator was down while they chose. */
  cutOff: PlayerId[];
  events: SolEvent[];
  /** The evening lines for the whole team, in-world, without causes. */
  lines: string[];
  power: { generatedWh: number; usedWh: number; storedWh: number; capacityWh: number };
  ended: boolean;
}

/** The evening report one player is allowed to read. */
export interface EveningView { sol: number; events: SolEvent[]; lines: string[] }

export type LoseReason = "window-closed" | "resource-exhausted" | "crew-lost";
export type RunOutcome = "won" | "lost";

export interface TaskResult { id: TaskId; name: string; done: boolean; failed: boolean; doneOnSol: number | null }

export interface CauseLine { sol: number; hazard: HazardId | "supplies" | "crew" | "time"; text: string }

export interface RoleScore { role: Role; player: PlayerId; name: string; workDone: number; hazardResponses: number; deadLinkActions: number; solsOut: number; line: string }

export interface Score {
  tasksCompleted: number; tasksTotal: number;
  scienceDelivered: { sites: number; megabits: number };
  resourcesLeft: { label: string; value: number; unit: string }[];
  decisions: { hazardResponses: number; deadLinkActions: number; lines: string[] };
  /** Points of each part; `total` is their sum. The weights are the team's. */
  components: { tasks: number; science: number; resources: number; decisions: number };
  total: number;
  perRole: RoleScore[];
}

export interface RunResult {
  outcome: RunOutcome;
  loseReason: LoseReason | null;
  endedOnSol: number;
  tasks: TaskResult[];
  score: Score;
  /** Causes, named only here, after the run. */
  causes: CauseLine[];
  hazardsSeen: HazardId[];
}

// ---------------------------------------------------------------- Act 1 hand-over and capabilities

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

// ---------------------------------------------------------------- history

export interface SolRecord {
  sol: number;
  choices: Choice[];
  /** Who was cut off and, after the run, why. */
  cutOff: { player: PlayerId; cause: LinkCause | null; did: { activity: ActivityId; target: Target } }[];
  events: string[];
}

export interface Attempt {
  id: string;
  /** ISO time the attempt started. */
  startedAt: string;
  seed: number;
  design: Act1Design;
  extras: Act1Extras;
  crew: CrewSetup[];
  capabilities: RelayCapabilities;
  sols: SolRecord[];
  result: RunResult;
}

/** The storage seam: `window.localStorage` fits. */
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }

// ---------------------------------------------------------------- controllers

/** Chooses one player's activity from their own view and nothing else. Return null to say "not decided yet". */
export interface PlayerController {
  readonly player: PlayerId;
  choose(view: PlayerView): Choice | null;
}
