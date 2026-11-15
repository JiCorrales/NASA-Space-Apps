// Display labels for the frame values. These only choose a word and a colour for a value Unity sent;
// the thresholds are the brief's illustrative display thresholds, not simulation rules.

import type { MissionState, SimFrame, WeekState } from "../bridge/types";
import type { SceneInput } from "./scene/drawScene";
import { regionKey } from "./scene/earth";
import { isStationDown } from "./frameStore";

export type Tone = "ok" | "warn" | "crit" | "idle";
export interface PanelStatus { tone: Tone; chip: string }

export const pad = (n: number, w = 2) => String(Math.max(0, Math.round(n))).padStart(w, "0");

export function problemOf(frame: SimFrame | null): "storm" | "station" | "attitude" | "other" | null {
  const code = frame?.alert?.code;
  if (!code) return null;
  if (/storm|solar|flux/i.test(code)) return "storm";
  if (isStationDown(frame)) return "station";
  if (/attitude|pointing/i.test(code)) return "attitude";
  return "other";
}

const isActive = (f: SimFrame, name: string) => f.commands.some((c) => c.name === name && c.active);

export function powerStatus(battery: number): PanelStatus {
  if (battery >= 45) return { tone: "ok", chip: "NOMINAL" };
  if (battery >= 30) return { tone: "warn", chip: "LOW" };
  return { tone: "crit", chip: "CRITICAL" };
}

export function attitudeStatus(error: number): PanelStatus {
  if (error < 1) return { tone: "ok", chip: "LOCKED" };
  if (error <= 2) return { tone: "warn", chip: "DRIFTING" };
  return { tone: "crit", chip: "OFF TARGET" };
}

export function linkStatus(f: SimFrame): PanelStatus {
  if (isStationDown(f)) return { tone: "crit", chip: "STATION DOWN" };
  if (f.contact) return { tone: "ok", chip: "IN CONTACT" };
  return { tone: "idle", chip: "NO CONTACT" };
}

export function thermalStatus(temp: number): PanelStatus {
  return temp < 30 ? { tone: "ok", chip: "NOMINAL" } : { tone: "warn", chip: "HOT" };
}

export function imagingStatus(f: SimFrame): PanelStatus {
  if (f.report) return { tone: "ok", chip: "COMPLETE" };
  if (isActive(f, "pauseCamera") || isActive(f, "safeMode")) return { tone: "warn", chip: "PAUSED" };
  if (f.capturing) return { tone: "ok", chip: "CAPTURE" };
  if (f.speed === "fast") return { tone: "ok", chip: "AUTO" };
  if (f.weeks[f.week - 1] === "next") return { tone: "ok", chip: "ARMED" };
  return { tone: "ok", chip: "STANDBY" };
}

export function missionStatus(f: SimFrame): PanelStatus {
  if (f.report) return { tone: f.report.successRate >= 80 ? "ok" : "warn", chip: "FINAL" };
  return f.projectedSuccess >= 80 ? { tone: "ok", chip: "ON TRACK" } : { tone: "warn", chip: "AT RISK" };
}

export function rateTone(rate: number): Tone {
  return rate >= 80 ? "ok" : rate >= 50 ? "warn" : "crit";
}

export const WEEK_WORDS: Record<WeekState, string> = {
  sent: "delivered", held: "captured, waiting to send", next: "this week", lost: "lost", "": "not yet",
};

export type Segment = "launch" | "space" | "ground" | "user";
export interface SegmentStatus { segment: Segment; label: string; state: string; tone: Tone; lit: boolean }

/** Which of the four mission segments the current moment involves. */
export function segmentStatus(f: SimFrame | null): SegmentStatus[] {
  const p = problemOf(f);
  const last = f?.log[f.log.length - 1];
  const delivering = Boolean(f && last && last.kind === "good" && last.week === f.week && f.imagesDelivered > 0);
  const launching = !f || (f.week <= 1 && f.day <= 2);
  return [
    { segment: "launch", label: "LAUNCH", lit: launching, tone: launching ? "ok" : "idle",
      state: !f ? "READY" : launching ? "DEPLOYING" : "IN ORBIT" },
    { segment: "space", label: "SPACE", lit: Boolean(f && (f.capturing || p === "storm" || p === "attitude")),
      tone: p === "storm" || p === "attitude" ? "crit" : f?.capturing ? "ok" : "idle",
      state: !f ? "STANDBY" : p === "storm" || p === "attitude" ? "PROBLEM" : f.capturing ? "IMAGING" : "NOMINAL" },
    { segment: "ground", label: "GROUND", lit: Boolean(f && (f.contact || p === "station")),
      tone: p === "station" ? "crit" : f?.contact ? "ok" : "idle",
      state: !f ? "STANDBY" : p === "station" ? "OFFLINE" : f.contact ? "IN CONTACT" : "WAITING" },
    { segment: "user", label: "USER", lit: Boolean(f && (delivering || f.report)),
      tone: f && (delivering || f.report) ? "ok" : "idle",
      state: !f ? "WAITING" : f.report ? "REPORT" : delivering ? "RECEIVING" : "WAITING" },
  ];
}

/** `state` only supplies the region the player chose (`state.design.region`): it picks which land the window shows. */
export function sceneInputFromFrame(f: SimFrame | null, state?: MissionState | null): SceneInput {
  const p = problemOf(f);
  return {
    week: f?.week ?? 0,
    speed: f?.speed ?? "paused",
    capturing: Boolean(f?.capturing),
    contact: Boolean(f?.contact),
    pointingError: f?.pointingError ?? 0.2,
    storm: p === "storm",
    stationDown: p === "station",
    attitudeFault: p === "attitude",
    anyAlert: Boolean(f?.alert),
    cameraPaused: f ? isActive(f, "pauseCamera") : false,
    safeMode: f ? isActive(f, "safeMode") : false,
    imageNumber: f?.week ?? 0,
    ended: Boolean(f?.report),
    region: regionKey(state?.design.region),
  };
}
