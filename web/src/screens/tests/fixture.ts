import { vi } from "vitest";
import { createStandin } from "../../bridge/standin";
import type { Group, Issue, MissionState, PageToUnity } from "../../bridge/types";
import type { Send } from "../send";

/** The stand-in's fixture state after the given player messages, as Unity would send it. */
export function fixtureState(...messages: PageToUnity[]): MissionState {
  let state: MissionState | undefined;
  const standin = createStandin((m) => { if (m.type === "state") state = m.payload; });
  for (const m of messages) standin.handle(m);
  standin.handle({ type: "ready", payload: {} });
  return state!;
}

export const choose = (group: Group, id: string): PageToUnity => ({ type: "choose", payload: { group, id } });
export const toggle = (group: Group, id: string): PageToUnity => ({ type: "toggle", payload: { group, id } });

/** A mock send that records messages as { type, payload }. */
export function mockSend() {
  const fn = vi.fn();
  const send = ((type: string, payload: unknown) => fn({ type, payload })) as Send;
  return { send, fn };
}

export const issue = (step: Issue["step"], severity: Issue["severity"] = "critical"): Issue => ({
  code: `test.${step}`, severity, resource: null, step, message: `Test issue on ${step}`,
});
