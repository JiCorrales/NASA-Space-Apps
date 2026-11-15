// Display words for the launch act. They only name what `SimFrame.launch` says; nothing here decides
// an outcome or predicts one.

import type { LaunchFrame, LaunchStage } from "../../bridge/types";

/** Flight order of the stages. "hold" sits with the countdown: the clock is stopped, not moved on. */
export const STAGE_ORDER: Record<LaunchStage, number> = {
  countdown: 0, hold: 0, liftoff: 1, maxq: 2, staging: 3, fairing: 4, orbit: 5, separation: 6, deploy: 7, done: 8,
};

/** The rail of stages lit as they pass. */
export const RAIL: { stage: LaunchStage; label: string }[] = [
  { stage: "countdown", label: "COUNT" },
  { stage: "liftoff", label: "LIFTOFF" },
  { stage: "maxq", label: "MAX Q" },
  { stage: "staging", label: "STAGING" },
  { stage: "fairing", label: "FAIRING" },
  { stage: "orbit", label: "ORBIT" },
  { stage: "separation", label: "SEP" },
  { stage: "deploy", label: "DEPLOY" },
];

export type RailState = "done" | "now" | "hold" | "fail" | "";

/** State of each rail cell: passed, current, holding, where it ended badly, or still ahead. */
export function railStates(l: LaunchFrame): RailState[] {
  const at = STAGE_ORDER[l.stage];
  const bad = l.outcome === "lost" || l.outcome === "scrubbed";
  return RAIL.map((r) => {
    const k = STAGE_ORDER[r.stage];
    if (k < at) return "done";
    if (k > at) return "";
    if (bad) return "fail";
    if (l.stage === "hold") return "hold";
    return "now";
  });
}

export const STAGE_WORD: Record<LaunchStage, string> = {
  countdown: "COUNTDOWN", hold: "HOLD", liftoff: "LIFTOFF", maxq: "MAX Q", staging: "STAGING", fairing: "FAIRING SEP",
  orbit: "ORBIT INSERTION", separation: "SEPARATION", deploy: "DEPLOYMENT", done: "IN ORBIT",
};

/** The word for the moment: the stage, or how it ended. */
export function launchWord(l: LaunchFrame): string {
  if (l.outcome === "scrubbed") return "SCRUBBED";
  if (l.outcome === "lost") return STAGE_ORDER[l.stage] >= STAGE_ORDER.separation ? "NO SIGNAL" : "TELEMETRY LOST";
  return STAGE_WORD[l.stage];
}

/** Mission elapsed time as T-mm:ss before lift-off and T+mm:ss after (hours shown when needed). */
export function metText(met: number): string {
  const s = Math.floor(Math.abs(met));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return `T${met < 0 ? "-" : "+"}${h > 0 ? `${h}:` : ""}${two(m)}:${two(sec)}`;
}

export const altitudeText = (km: number) => `${Math.max(0, Math.round(km))} km`;
export const velocityText = (kms: number) => `${Math.max(0, kms).toFixed(2)} km/s`;

/** Words of a poll light, never colour alone. */
export function pollWord(go: boolean | null): { state: "go" | "nogo" | "wait"; word: string } {
  if (go === null) return { state: "wait", word: "···" };
  return go ? { state: "go", word: "GO" } : { state: "nogo", word: "NO-GO" };
}
