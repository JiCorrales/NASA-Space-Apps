// Exact TypeScript form of docs/bridge.md. Change both in the same pull request.

export type Step = "goals" | "concept" | "requirements" | "design" | "build" | "fly";
export type StepStatus = "locked" | "open" | "done" | "problem";
export type SourceStatus = "nasa" | "derived" | "team";
export type ResourceKind = "mass" | "power" | "budget" | "data" | "communications" | "time";
export type Severity = "info" | "warning" | "critical";

export type Group =
  | "region" | "orbit" | "revisit" | "format" | "power" | "attitude" | "storage"
  | "instrument" | "radio" | "groundStation" | "backupStation" | "launch" | "tests";

export type FlyAction = "launch" | "pause" | "resume" | "fast" | "retry";
export type CommandName = "pauseCamera" | "safeMode" | "prioritizeDownlink" | "useBackupStation" | "recalibrate";

// ---- MissionState ----

export interface OptionStat { label: string; value: string | number; unit: string }
export interface Source { status: SourceStatus; text: string }
export interface Option { id: string; name: string; summary: string; stats: OptionStat[]; source: Source }
export interface GroupDef { group: Group; step: Step; multi: boolean; options: Option[] }
export interface Requirement {
  id: string; label: string; value: number; unit: string; min: number; max: number; check: string;
  /** Optional. Where the value comes from. */
  source?: Source;
  /** Optional, set in build and verify: true when the chosen tests verify it, false when not, absent when not checked yet. */
  verified?: boolean;
}
export interface Resource {
  kind: ResourceKind; used: number; available: number; unit: string;
  /** false while the choice that sets the limit has not been made yet */
  known: boolean;
  /** Optional. Where the limit comes from. */
  source?: Source;
}
export interface Issue {
  code: string; severity: Severity; resource: ResourceKind | null; step: Step; message: string;
}
/** A measured value with its source, for the locked worlds' cards. */
export interface Measure { value: string | number; unit: string; source: Source }
/** A world on the mission select. null in a measure means the team has not collected it yet. */
export interface World {
  id: string; name: string; open: boolean;
  sunlight: Measure | null; signal: Measure | null; travel: Measure | null;
}
/** A mission on the mission select; who needs the data and why, ready to show. */
export interface MissionCard { id: string; world: string; name: string; summary: string; open: boolean; who: string; why: string }

export interface Attempt { number: number; successRate: number; imagesDelivered: number; outcome: string }

export interface MissionState {
  mission: { id: string; name: string; summary: string };
  steps: { step: Step; status: StepStatus }[];
  design: Partial<Record<Group, string | string[] | null>>;
  groups: GroupDef[];
  requirements: Requirement[];
  resources: Resource[];
  issues: Issue[];
  attempts: Attempt[];
  /** Optional. Worlds and missions for the mission select (step goals). */
  worlds?: World[];
  missions?: MissionCard[];
  /** Optional. Budget kept in reserve, 0 to 1, as last set with setReserve. */
  reserve?: number;
}

// ---- SimFrame ----

export type WeekState = "sent" | "held" | "next" | "lost" | "";
export interface SimCommand { name: CommandName; label: string; enabled: boolean; active: boolean }
export interface LogLine { week: number; text: string; kind: "info" | "alert" | "good" }
export interface Report {
  successRate: number; imagesDelivered: number; factors: { label: string; value: string | number }[];
  lostBecause: string; decisions: string[]; suggestion: string; images: WeekState[];
}
/** Moments of the launch act, in flight order ("hold" stops the countdown). */
export type LaunchStage =
  | "countdown" | "hold" | "liftoff" | "maxq" | "staging" | "fairing" | "orbit" | "separation" | "deploy" | "done";
/** One station of the launch-day GO/NO-GO poll. `go` is null until the station has been polled. */
export interface PollStation { station: string; go: boolean | null }
/** The launch act, between LAUNCH and week 1. Display only: Unity decides every value and the outcome. */
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
  /** null while the launch goes on. "lost" and "scrubbed" come with `report` and end the attempt. */
  outcome: null | "ok" | "lost" | "scrubbed";
}
export interface SimFrame {
  week: number; day: number; speed: "detail" | "fast" | "paused";
  battery: number; pointingError: number; cameraTemp: number; storageQueue: number; linkQuality: number;
  imagesDelivered: number; imagesLost: number; projectedSuccess: number;
  weeks: WeekState[]; // 52 entries
  contact: boolean; capturing: boolean;
  alert: null | { code: string; title: string };
  commands: SimCommand[];
  log: LogLine[];
  report: null | Report;
  /** Optional. Present during the launch act only; absent or null means the flight screen as before. */
  launch?: null | LaunchFrame;
}

// ---- Messages ----

export type UnityToPage =
  | { type: "openScreen"; payload: { step: Step } }
  | { type: "closeScreen"; payload: Record<string, never> }
  | { type: "state"; payload: MissionState }
  | { type: "simTick"; payload: SimFrame };

export type PageToUnity =
  | { type: "ready"; payload: Record<string, never> }
  | { type: "choose"; payload: { group: Group; id: string } }
  | { type: "toggle"; payload: { group: Group; id: string } }
  | { type: "setRequirement"; payload: { id: string; value: number } }
  | { type: "setReserve"; payload: { fraction: number } }
  | { type: "completeStep"; payload: { step: Step } }
  | { type: "close"; payload: Record<string, never> }
  | { type: "fly"; payload: { action: FlyAction } }
  | { type: "command"; payload: { name: CommandName } };

export type PageType = PageToUnity["type"];
export type PayloadOf<T extends PageType> = Extract<PageToUnity, { type: T }>["payload"];
