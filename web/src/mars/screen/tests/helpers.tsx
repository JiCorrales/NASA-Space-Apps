import { act } from "@testing-library/react";
import { vi } from "vitest";
import type { PlayerId } from "../../types";
import type { RunFactory } from "../engine";
import { fixtureFactory } from "./fixtureEngine";

/** Advances fake time in small steps, each in its own act: React only commits a phase change when its act ends. */
export const tick = async (ms: number, onStep?: () => void) => {
  for (let t = 0; t < ms; t += 50) { await act(async () => { await vi.advanceTimersByTimeAsync(50); }); onStep?.(); }
};

/** The fixture factory with one player's communicator forced down: their view has no shared data and no plans. */
export const cutOffFactory = (cut: PlayerId, wrap?: (kit: ReturnType<RunFactory>) => ReturnType<RunFactory>): RunFactory => (o) => {
  const kit = fixtureFactory(o); const e = kit.engine;
  const out = { ...kit, engine: { ...e, viewFor: (p: PlayerId) => { const v = e.viewFor(p); return p === cut ? { ...v, self: { ...v.self, linked: false }, shared: null, plans: null } : v; },
    choose: e.choose, resolveSol: e.resolveSol, eveningFor: e.eveningFor, result: e.result, attempt: e.attempt } };
  return wrap ? wrap(out) : out;
};
