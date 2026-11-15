import { Profiler, type ComponentProps } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarsPage } from "../MarsPage";
import { Panel } from "../Panel";
import { ResultCard } from "../ResultCard";
import { HANDOFF_KEY, HISTORY_KEY, appendHistory, readHandoff, readHistory, type RunFactory } from "../engine";
import { marsFactory } from "../marsFactory";
import { MemoryStorage } from "../..";
import { PLAYER_IDS, NO_TARGET, type Choice } from "../../types";
import { FIXTURE_CREW, createFixtureEngine, fixtureFactory } from "./fixtureEngine";

const noop = () => {};
/** A 2D context that accepts everything: the screen draws, the test only counts renders. */
const ctx = new Proxy({}, { get: (_t, k) => (k === "measureText" ? () => ({ width: 10 }) : k === "createLinearGradient" || k === "createRadialGradient" ? () => ({ addColorStop: noop }) : noop), set: () => true });
const reduce = (on: boolean) => { window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), media: q, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop })) as never; };

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AA==");
  localStorage.clear();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

/** Advances fake time in small steps, each in its own act: React only commits a phase change when its act ends. */
const tick = async (ms: number) => { for (let t = 0; t < ms; t += 50) await act(async () => { await vi.advanceTimersByTimeAsync(50); }); };

/** The views of the fixture engine at the start of sol `solN`, played by the demo. */
function viewsAt(solN: number) {
  const kit = createFixtureEngine(7, "good");
  for (let s = 1; s < solN; s++) {
    for (const p of PLAYER_IDS) { const c = kit.demo(p).choose(kit.engine.viewFor(p)); if (c) kit.engine.choose(c); }
    kit.engine.resolveSol();
  }
  return PLAYER_IDS.map((p) => kit.engine.viewFor(p));
}
const panelProps = (views: ReturnType<typeof viewsAt>, i: 0 | 1 | 2 | 3) => ({
  index: i, roster: FIXTURE_CREW,
  run: { views, controlled: [false, false, false, false], phase: "choosing", evening: null, report: null, after: null, playId: 0, reduced: true, speed: 1, reveals: [], revised: [], waitingFor: [],
    sceneBeat: noop, sceneDone: noop, choose: noop, letDemoChoose: noop } as unknown as ComponentProps<typeof Panel>["run"],
});

describe("one panel renders only its own view", () => {
  it("a linked panel shows the shared resources, the tasks and the plans of the others", () => {
    render(<Panel {...panelProps(viewsAt(2), 0)} />);
    expect(screen.getByText("LINK UP")).toBeInTheDocument();
    expect(screen.getByLabelText("Shared resources")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Shared resources")).getAllByRole("listitem")).toHaveLength(6);
    expect(within(screen.getByLabelText("Task list")).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByLabelText("Plans of the others")).toBeInTheDocument();
    expect(screen.queryByLabelText("No shared data")).toBeNull();
  });

  it("a cut-off panel shows none of them and says LINK DOWN with an icon and text", () => {
    const views = viewsAt(5);
    const cut = views.findIndex((v) => !v.self.linked) as 0 | 1 | 2 | 3;
    expect(cut).toBeGreaterThanOrEqual(0);
    expect(views[cut]!.shared).toBeNull();
    render(<Panel {...panelProps(views, cut)} />);
    expect(screen.getByText("LINK DOWN")).toBeInTheDocument();
    expect(screen.getByText("LOCAL VIEW ONLY")).toBeInTheDocument();
    expect(screen.getByLabelText("No shared data")).toBeInTheDocument();
    for (const l of ["Shared resources", "Task list", "Plans of the others"]) expect(screen.queryByLabelText(l)).toBeNull();
    expect(document.querySelector(".mp__link img")).not.toBeNull(); // the icon, so it does not rest on colour alone
  });
});

describe("the page", () => {
  it("waits for a person who took control, and gives their Choice to the engine", async () => {
    vi.useFakeTimers(); reduce(true);
    const chosen: Choice[] = []; let resolved = 0;
    const factory: RunFactory = (o) => {
      const kit = fixtureFactory(o); const e = kit.engine;
      return { ...kit, engine: { ...e, viewFor: e.viewFor, choose: (c) => { chosen.push(c); return e.choose(c); }, resolveSol: () => { resolved++; return e.resolveSol(); }, eveningFor: e.eveningFor, result: e.result, attempt: e.attempt } };
    };
    render(<MarsPage factory={factory} seed={7} />);
    fireEvent.click(screen.getByRole("button", { name: "Take control of Ines" }));
    await tick(3000);
    expect(resolved).toBe(0); // the three demo players chose, the sol still waits
    expect(chosen.map((c) => c.player).sort()).toEqual([1, 2, 3]);
    const ines = screen.getByRole("region", { name: "Ines, Commander" });
    expect(within(ines).getByText("Waiting for you to choose.")).toBeInTheDocument();
    fireEvent.click(within(ines).getByRole("button", { name: "CHOOSE ACTIVITY" }));
    fireEvent.click(within(ines).getByRole("button", { name: /^Rest(?!ore)/ }));
    expect(chosen.at(-1)).toEqual({ player: 0, activity: "rest", target: NO_TARGET });
    await tick(3000);
    expect(resolved).toBeGreaterThanOrEqual(1);
  });

  it("the demo plays a whole run to an end without a person, and the end is kept in the history", async () => {
    vi.useFakeTimers(); reduce(true);
    const seen: string[] = [];
    render(<MarsPage factory={marsFactory} seed={2} design="good" />);
    for (let i = 0; i < 3000 && !document.querySelector(".result"); i++) {
      await tick(100);
      if (i % 4 === 0) seen.push(document.body.textContent ?? "");
    }
    const card = screen.getByRole("dialog");
    expect(within(card).getByText(/MISSION (COMPLETE|LOST)/)).toBeInTheDocument();
    expect(within(card).getByText("TRY AGAIN (NEW SEED)")).toBeInTheDocument();
    expect(readHistory()).toHaveLength(1);
    // nothing before the end speaks of odds
    expect(seen.length).toBeGreaterThan(10);
    for (const t of seen) expect(t).not.toMatch(/\d\s*%|\b(chance|risk|probability|odds|likely|likelihood)\b/i);
  }, 60_000);

  it("canvas animation does not re-render React", () => {
    const queue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => { queue.push(cb); return queue.length; });
    let renders = 0;
    render(<Profiler id="mars" onRender={() => { renders++; }}><MarsPage factory={fixtureFactory} seed={7} autoplay={false} /></Profiler>);
    const before = renders;
    let drawn = 0;
    act(() => { for (let i = 0; i < 120 && queue.length; i++) { queue.shift()!(i * 16.7); drawn++; } });
    expect(drawn).toBe(120);
    expect(renders).toBe(before);
  });
});

describe("the result card", () => {
  it("shows the outcome, the four parts of the score, the causes and the attempts", () => {
    const kit = createFixtureEngine(3, "poor");
    for (let s = 0; s < 30; s++) { for (const p of PLAYER_IDS) { const c = kit.demo(p).choose(kit.engine.viewFor(p)); if (c) kit.engine.choose(c); } kit.engine.resolveSol(); }
    const result = kit.engine.result()!, attempt = kit.engine.attempt()!;
    const onAgain = vi.fn(), onSame = vi.fn();
    render(<ResultCard result={result} attempts={[attempt]} onAgain={onAgain} onSame={onSame} />);
    expect(screen.getByText(/MISSION (COMPLETE|LOST)/)).toBeInTheDocument();
    for (const part of [/Tasks completed/, /Science delivered/, /Resources left/, /Decisions under pressure/]) expect(screen.getByText(part)).toBeInTheDocument();
    expect(within(screen.getByLabelText("Attempts")).getAllByRole("row")).toHaveLength(2);
    fireEvent.click(screen.getByText("SAME RUN AGAIN (SAME SEED)")); fireEvent.click(screen.getByText("TRY AGAIN (NEW SEED)"));
    expect(onSame).toHaveBeenCalledOnce(); expect(onAgain).toHaveBeenCalledOnce();
  });
});

describe("the hand-over from Act 1", () => {
  const crew = [
    { name: "Uno", role: "scientist", look: "round" }, { name: "Dos", role: "comms", look: "broad" },
    { name: "Tres", role: "commander", look: "tall" }, { name: "Cuatro", role: "engineer", look: "compact" },
  ];
  it("starts with the crew of mars.handoff and offers 'Your design', selected", () => {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({ design: { format: "6u" }, extras: {}, crew, capabilities: {} }));
    render(<MarsPage factory={fixtureFactory} seed={7} autoplay={false} />);
    const select = screen.getByLabelText("Satellite design") as HTMLSelectElement;
    expect(select.value).toBe("yours");
    expect(within(select).getByText("YOUR DESIGN")).toBeInTheDocument();
    expect(within(select).getAllByRole("option")).toHaveLength(4); // the fixtures stay selectable
    expect(screen.getByRole("region", { name: "Uno, Scientist" })).toBeInTheDocument();
  });
  it("falls back to the fixtures without it, or when it does not parse", () => {
    localStorage.setItem(HANDOFF_KEY, "{not json");
    expect(readHandoff()).toBeNull();
    render(<MarsPage factory={fixtureFactory} seed={7} autoplay={false} />);
    const select = screen.getByLabelText("Satellite design") as HTMLSelectElement;
    expect(select.value).toBe("good");
    expect(within(select).queryByText("YOUR DESIGN")).toBeNull();
  });
  it("appends attempts to mars.history, and survives a storage that throws", () => {
    const a = createFixtureEngine(1, "good"); for (let s = 0; s < 30; s++) { for (const p of PLAYER_IDS) { const c = a.demo(p).choose(a.engine.viewFor(p)); if (c) a.engine.choose(c); } a.engine.resolveSol(); }
    const mem = new MemoryStorage();
    appendHistory(a.engine.attempt()!, mem); appendHistory(a.engine.attempt()!, mem);
    expect(JSON.parse(mem.getItem(HISTORY_KEY)!)).toHaveLength(2);
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: noop };
    expect(() => appendHistory(a.engine.attempt()!, broken)).not.toThrow();
    expect(readHandoff(broken)).toBeNull();
  });
});
