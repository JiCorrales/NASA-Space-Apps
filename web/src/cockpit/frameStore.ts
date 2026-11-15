// Keeps the latest SimFrame from the bridge, plus a short history of a few values for the small graphs.
// It subscribes once at import, so a frame that arrives before the cockpit mounts is not lost.

import { useSyncExternalStore } from "react";
import { subscribe } from "../bridge/bridge";
import type { SimFrame } from "../bridge/types";

export interface LinkSample { up: boolean; down: boolean }
export interface FlightView {
  frame: SimFrame | null;
  /** Battery charge of the last frames received, oldest first. Display memory only. */
  battery: number[];
  /** Contact state of the last frames received, oldest first. */
  link: LinkSample[];
}

const HISTORY = 42;
const EMPTY: FlightView = { frame: null, battery: [], link: [] };
let view: FlightView = EMPTY;
const listeners = new Set<() => void>();

export function isStationDown(frame: SimFrame | null): boolean {
  return Boolean(frame?.alert && /ground|station/i.test(frame.alert.code));
}

/** Adds a frame to a view. Exported for tests. */
export function pushFrame(prev: FlightView, frame: SimFrame): FlightView {
  // A retry starts a new flight: the graphs start again.
  const restart = prev.frame !== null && frame.week < prev.frame.week;
  const battery = restart ? [] : prev.battery;
  const link = restart ? [] : prev.link;
  return {
    frame,
    battery: [...battery, frame.battery].slice(-HISTORY),
    link: [...link, { up: frame.contact, down: isStationDown(frame) }].slice(-HISTORY),
  };
}

subscribe((m) => {
  if (m.type === "simTick") {
    view = pushFrame(view, m.payload);
    listeners.forEach((l) => l());
  }
});

export function useFlightView(): FlightView {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => view,
  );
}

/** Test helper: forget every frame. */
export function resetFlightView(): void {
  view = EMPTY;
  listeners.forEach((l) => l());
}
