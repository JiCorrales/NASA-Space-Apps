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
}
export interface Resource {
  kind: ResourceKind; used: number; available: number; unit: string;
  /** false while the choice that sets the limit has not been made yet */
  known: boolean;
}
export interface Issue {
  code: string; severity: Severity; resource: ResourceKind | null; step: Step; message: string;
}
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
}

// ---- SimFrame ----

export type WeekState = "sent" | "held" | "next" | "lost" | "";
export interface SimCommand { name: CommandName; label: string; enabled: boolean; active: boolean }
export interface LogLine { week: number; text: string; kind: "info" | "alert" | "good" }
export interface Report {
  successRate: number; imagesDelivered: number; factors: { label: string; value: string | number }[];
  lostBecause: string; decisions: string[]; suggestion: string; images: WeekState[];
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
