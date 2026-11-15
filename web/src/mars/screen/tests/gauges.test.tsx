import { Profiler, type ComponentProps } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Panel } from "../Panel";
import type { SceneInput } from "../MapScene";
import { PLAYER_IDS } from "../../types";
import { FIXTURE_CREW, createFixtureEngine } from "./fixtureEngine";

// The map is replaced by a stub that hands over the input the scene would receive, so the test can play a beat.
let captured: SceneInput | null = null;
vi.mock("../MapCanvas", () => ({ MapCanvas: ({ input }: { input: SceneInput }) => { captured = input; return null; } }));

describe("a gauge event during the sol", () => {
  it("moves that player's bar and marks it, without a React render", () => {
    const kit = createFixtureEngine(7, "good");
    const before = PLAYER_IDS.map((p) => kit.engine.viewFor(p));
    const after = before.map((v) => ({ ...v, self: { ...v.self, gauges: v.self.gauges.map((g) => (g.id === "energy" ? { ...g, value: 35, good: 0.35, low: false } : g.id === "rest" ? { ...g, value: 20, good: 0.2, low: true } : g)) } }));
    const run = { views: before, after, controlled: [false, false, false, false], phase: "playing", evening: null, report: null, playId: 1, reduced: true, speed: 1, reveals: [], revised: [],
      waitingFor: [], sceneBeat: () => {}, sceneDone: () => {}, choose: () => {}, letDemoChoose: () => {} } as unknown as ComponentProps<typeof Panel>["run"];
    let renders = 0;
    const { container } = render(<Profiler id="p" onRender={() => { renders++; }}><Panel run={run} index={0} roster={FIXTURE_CREW} /></Profiler>);
    const rows = [...container.querySelectorAll<HTMLElement>(".mp__side .gauge")];
    const energy = rows.find((r) => r.dataset.gauge === "energy") ?? rows[0]!;
    const id = energy.dataset.gauge!;
    const wasWidth = energy.querySelector<HTMLElement>(".gauge__fill")!.style.width;
    const base = renders;
    captured!.onBeat!({ order: 0, kind: "gauge", players: [0], scope: "team", text: "gauges move" });
    const row = container.querySelector<HTMLElement>(`.mp__side [data-gauge="${id}"]`)!;
    const after0 = after[0]!.self.gauges.find((g) => g.id === id)!;
    expect(row.querySelector<HTMLElement>(".gauge__fill")!.style.width).toBe(`${Math.round(after0.good * 100)}%`);
    if (id === "energy" || id === "rest") expect(row.querySelector<HTMLElement>(".gauge__fill")!.style.width).not.toBe(wasWidth);
    expect(container.querySelectorAll('[data-changed="true"]').length).toBeGreaterThan(0);
    expect(renders).toBe(base);
    // an event of another player does not touch this panel's bars
    const mark = container.querySelectorAll('[data-changed="true"]').length;
    captured!.onBeat!({ order: 1, kind: "gauge", players: [2], scope: "team", text: "other" });
    expect(container.querySelectorAll('[data-changed="true"]').length).toBe(mark);
  });
});
