import { Profiler } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { standinEmit } from "../../bridge/bridge";
import { recordFlight } from "../../bridge/fixtures/flight";
import { LAUNCH_CASES, STATIONS, launchCaseFor, recordLaunch, type LaunchCase } from "../../bridge/fixtures/launch";
import { createFlightStandin } from "../../bridge/flightStandin";
import type { LaunchStage, SimFrame, UnityToPage } from "../../bridge/types";
import { Cockpit } from "../Cockpit";
import { CockpitView } from "../CockpitView";
import { pushFrame, resetFlightView } from "../frameStore";
import { flightSounds } from "../../sound";
import { LaunchScene } from "./launchScene";
import { LaunchStrip } from "./LaunchStrip";
import { RAIL, STAGE_ORDER, launchWord, metText } from "./launchStatus";

const noop = () => {};
const cases = Object.fromEntries(LAUNCH_CASES.map((k) => [k, recordLaunch(k).map((s) => s.frame)])) as Record<LaunchCase, SimFrame[]>;
const clean = cases.clean;
const at = (frames: SimFrame[], stage: LaunchStage) => frames.find((f) => f.launch?.stage === stage)!;

function view(frame: SimFrame | null, launchSeen = false) {
  return render(<CockpitView frame={frame} state={null} launchSeen={launchSeen} onFly={noop} onCommand={noop} onClose={noop} />);
}

let noCanvas: { mockRestore(): void };
beforeEach(() => { noCanvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); });
afterEach(() => {
  noCanvas.mockRestore();
  delete window.unityInstance;
  act(() => resetFlightView());
});

describe("launch act on the flight screen", () => {
  it("RF launch: a countdown frame shows the clock and lights LAUNCH", () => {
    const f = clean.find((x) => x.launch?.stage === "countdown" && x.launch.met === -7)!;
    view(f);
    expect(screen.getByTestId("clock")).toHaveTextContent("T-00:07 · COUNTDOWN");
    expect(screen.getByTestId("launch-met")).toHaveTextContent("T-00:07");
    expect(screen.getByTestId("segment-launch")).toHaveAttribute("data-lit", "true");
    expect(screen.getByTestId("segment-launch")).toHaveTextContent("COUNTDOWN");
    expect(screen.getByTestId("launch-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("launch-line")).toHaveTextContent("7...");
    // The six panels wait for orbit; there are no commands and the speed buttons are off.
    expect(screen.getAllByTestId(/^panel-/)).toHaveLength(6);
    for (const p of screen.getAllByTestId(/^panel-/)) expect(p).toHaveTextContent("waiting for orbit");
    expect(screen.queryByText("ADMIN COMMANDS")).toBeNull();
    expect(screen.getByRole("button", { name: "FAST" })).toBeDisabled();
    expect(screen.getByText("ILLUSTRATIVE VALUES")).toBeInTheDocument();
  });

  it("each stage lights the rail: passed stages done, the current one now", () => {
    for (const r of RAIL) {
      const f = at(clean, r.stage);
      const { unmount } = view(f);
      for (const other of RAIL) {
        const want = STAGE_ORDER[other.stage] < STAGE_ORDER[r.stage] ? "done" : other.stage === r.stage ? "now" : "ahead";
        expect(screen.getByTestId(`rail-${other.stage}`), `${r.stage}/${other.stage}`).toHaveAttribute("data-state", want);
      }
      unmount();
    }
    const done = view(at(clean, "done"));
    for (const r of RAIL) expect(screen.getByTestId(`rail-${r.stage}`)).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("segment-launch")).toHaveTextContent("IN ORBIT");
    done.unmount();
    // A hold blinks the count cell, a scrub marks it failed.
    view(at(cases.hold, "hold"));
    expect(screen.getByTestId("rail-countdown")).toHaveAttribute("data-state", "hold");
    expect(screen.getByTestId("clock")).toHaveTextContent("T-00:20 · HOLD");
    expect(screen.getByTestId("segment-launch")).toHaveAttribute("data-s", "warn");
  });

  it("poll lights are grey until polled, then GO or NO-GO, with the word as well as the colour", () => {
    const first = cases.scrubbed[0]!;
    let r = view(first);
    for (const s of STATIONS) {
      const li = screen.getByTestId(`poll-${s}`);
      expect(li).toHaveAttribute("data-go", "wait");
      expect(li).toHaveAccessibleName(`${s}: not polled yet`);
    }
    r.unmount();
    r = view(at(cases.scrubbed, "hold"));
    expect(screen.getByTestId("poll-RANGE")).toHaveAttribute("data-go", "go");
    expect(within(screen.getByTestId("poll-RANGE")).getByText("GO")).toBeInTheDocument();
    expect(screen.getByTestId("poll-WEATHER")).toHaveAttribute("data-go", "nogo");
    expect(within(screen.getByTestId("poll-WEATHER")).getByText("NO-GO")).toBeInTheDocument();
    expect(screen.getByTestId("poll-WEATHER")).toHaveAccessibleName("WEATHER: NO-GO");
    r.unmount();
  });

  it("a lost launch shows the report, and retry sends fly retry", async () => {
    const sent: unknown[] = [];
    window.unityInstance = { SendMessage: (_o, _m, json) => sent.push(JSON.parse(json)) };
    render(<Cockpit state={null} />);
    const lost = cases.ascentLost.at(-1)!;
    expect(lost.launch?.outcome).toBe("lost");
    act(() => { for (const f of cases.ascentLost) standinEmit({ type: "simTick", payload: f }); });
    const card = screen.getByTestId("report");
    expect(card).toHaveTextContent("MISSION REPORT · LAUNCH");
    expect(card).toHaveTextContent(lost.report!.lostBecause);
    for (const d of lost.report!.decisions) expect(card).toHaveTextContent(d);
    expect(screen.getByTestId("rail-staging")).toHaveAttribute("data-state", "fail");
    expect(screen.getByTestId("segment-launch")).toHaveTextContent("TELEMETRY LOST");
    await userEvent.click(within(card).getByRole("button", { name: "RETRY MISSION" }));
    expect(sent).toEqual([{ type: "fly", payload: { action: "retry" } }]);
  });

  it("scrubbed and no-deploy launches end with a report too", () => {
    for (const k of ["scrubbed", "noDeploy"] as const) {
      const last = cases[k].at(-1)!;
      expect(last.launch?.outcome).toBe(k === "scrubbed" ? "scrubbed" : "lost");
      const { unmount } = view(last);
      expect(screen.getByTestId("report")).toHaveTextContent(last.report!.suggestion);
      unmount();
    }
  });

  it("no launch field, or null, behaves as before", () => {
    const f = recordFlight().steps[0]!.frame;
    expect(f.launch).toBeUndefined();
    for (const frame of [f, { ...f, launch: null }]) {
      const { unmount } = view(frame);
      expect(screen.queryByTestId("launch-strip")).toBeNull();
      expect(screen.queryByTestId("launch-canvas")).toBeNull();
      expect(screen.getByTestId("clock")).toHaveTextContent("WEEK 01 / 52 · DAY 001");
      expect(screen.getByTestId("segment-launch")).toHaveTextContent("DEPLOYING");
      expect(screen.getByText("ADMIN COMMANDS")).toBeInTheDocument();
      unmount();
    }
    // After a launch act, week 1 no longer counts as launching.
    view(f, true);
    expect(screen.getByTestId("segment-launch")).toHaveAttribute("data-lit", "false");
    expect(screen.getByTestId("segment-launch")).toHaveTextContent("IN ORBIT");
  });

  it("Jose's rule: nothing the launch act shows contains a percentage or the words risk, chance or probability", () => {
    const odds = /%|\brisk|\bchance|\bprobab/i;
    const strip = render(<div />);
    const whole = render(<div />);
    const seen = new Set<string>();
    for (const k of LAUNCH_CASES) {
      for (const frame of cases[k]) {
        const l = frame.launch!;
        for (const text of [l.line, l.stage, ...l.poll.map((p) => p.station)]) expect(text, `${k}: ${text}`).not.toMatch(odds);
        // The strip and the clock change with every frame: check each one.
        strip.rerender(<LaunchStrip launch={l} />);
        expect(strip.container.textContent, `${k} ${l.stage} ${l.met}`).not.toMatch(odds);
        expect(strip.container.textContent).toContain(l.line);
        expect(`${metText(l.met)} · ${launchWord(l)}`).not.toMatch(odds);
        // The whole screen once per moment: everything except the report card, which ends the attempt and
        // names the cause afterwards.
        const moment = `${k}/${l.stage}/${l.outcome}`;
        if (seen.has(moment)) continue;
        seen.add(moment);
        whole.rerender(<CockpitView frame={frame} state={null} onFly={noop} onCommand={noop} onClose={noop} />);
        const shown = [...whole.container.querySelectorAll(".ck-stage > *:not([data-testid='report'])")].map((e) => e.textContent).join(" ");
        expect(shown, moment).not.toMatch(odds);
      }
      const report = cases[k].at(-1)!.report;
      if (report) for (const text of [report.lostBecause, ...report.decisions, report.suggestion]) expect(text).not.toMatch(/\brisk|\bchance|\bprobab/i);
    }
  }, 30000);

  it("the launch animation does not re-render React", () => {
    const ctx = new Proxy({}, { get: () => noop, set: () => true });
    noCanvas.mockRestore();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as never);
    const queue: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => { queue.push(cb); return queue.length; });
    let renders = 0;
    render(<Profiler id="ck" onRender={() => { renders++; }}><Cockpit state={null} /></Profiler>);
    act(() => standinEmit({ type: "simTick", payload: at(clean, "staging") }));
    expect(screen.getByTestId("launch-canvas")).toBeInTheDocument();
    const before = renders;
    let drawn = 0;
    act(() => { for (let i = 0; i < 120 && queue.length; i++) { queue.shift()!(i * 16.7); drawn++; } });
    expect(drawn).toBe(120);
    expect(renders).toBe(before);
    raf.mockRestore();
    getContext.mockRestore();
    noCanvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });
});

describe("launch scene", () => {
  const ctx = new Proxy({}, { get: () => noop, set: () => true }) as unknown as CanvasRenderingContext2D;
  const play = (frames: SimFrame[], scene = new LaunchScene()) => {
    for (const f of frames) for (let i = 0; i < 12; i++) { scene.step(1 / 30, f.launch!); scene.draw(ctx, f.launch!, 0.5); }
    return scene;
  };

  it("follows the frame: the rocket climbs to the progress it is given, and debris falls at staging", () => {
    const s = new LaunchScene();
    play(clean.slice(0, clean.indexOf(at(clean, "staging")) + 1), s);
    expect(s.debris.length).toBeGreaterThan(0);
    expect(s.p).toBeLessThanOrEqual(at(clean, "staging").launch!.progress + 1e-9);
    play(clean.slice(clean.indexOf(at(clean, "staging"))), s);
    expect(s.p).toBe(1);
    expect(s.sat).toBeGreaterThan(0);
    expect(s.broken).toBe(false);
  });

  it("breaks the vehicle up only when the frame says lost, and starts again on a new attempt", () => {
    const s = play(cases.ascentLost.slice(0, -1));
    expect(s.broken).toBe(false);
    play(cases.ascentLost.slice(-1), s);
    expect(s.broken).toBe(true);
    play(clean.slice(0, 1), s);
    expect(s.broken).toBe(false);
    expect(s.p).toBe(0);
    // A CubeSat that does not deploy tumbles; the vehicle is not broken.
    expect(play(cases.noDeploy).broken).toBe(false);
  });
});

describe("launch stand-in (fixture data)", () => {
  afterEach(() => { vi.useRealTimers(); });

  async function playFrom(seed: number, actions: ("launch" | "retry")[] = ["launch"]) {
    vi.useFakeTimers();
    const seen: SimFrame[][] = [];
    const sa = createFlightStandin((m: UnityToPage) => { if (m.type === "simTick") seen.at(-1)!.push(m.payload); }, { seed, vehicle: () => "rideshare" });
    for (const a of actions) {
      seen.push([]);
      sa.handle({ type: "fly", payload: { action: a } });
      // Up to two minutes of recording, or until the attempt has ended or reached week 1.
      for (let i = 0; i < 600; i++) {
        await vi.advanceTimersByTimeAsync(200);
        const last = seen.at(-1)!.at(-1);
        if (last && (last.report || !last.launch)) break;
      }
    }
    return { seen, sa };
  }
  const stages = (fs: SimFrame[]) => fs.map((f) => f.launch?.stage);

  it("picks the case from the seed, and consecutive seeds differ", () => {
    for (let s = 0; s < 20; s++) expect(launchCaseFor(s + 1)).not.toBe(launchCaseFor(s));
    expect(new Set(LAUNCH_CASES.map((_, i) => launchCaseFor(i))).size).toBe(5);
  });

  it.each(LAUNCH_CASES.map((k) => [k, LAUNCH_CASES.indexOf(k)] as const))("plays the %s case from its seed", async (kind, seed) => {
    const { seen, sa } = await playFrom(seed);
    const frames = seen[0]!;
    expect(sa.launchCase).toBe(kind);
    expect(frames[0]!.launch?.stage).toBe("countdown");
    expect(frames.every((f, i) => i === frames.length - 1 && !f.launch ? true : f.launch?.vehicle === "rideshare")).toBe(true);
    const last = frames.at(-1)!;
    const launchFrames = frames.filter((f) => f.launch);
    const end = launchFrames.at(-1)!.launch!;
    switch (kind) {
      case "clean":
      case "hold":
        expect(end.outcome).toBe("ok");
        expect(last.launch).toBeUndefined();
        expect(last.week).toBe(1);
        expect(stages(frames).includes("hold")).toBe(kind === "hold");
        break;
      case "ascentLost":
        expect(end.outcome).toBe("lost");
        expect(STAGE_ORDER[end.stage]).toBeGreaterThan(0);
        expect(STAGE_ORDER[end.stage]).toBeLessThan(STAGE_ORDER.separation);
        expect(last.report).not.toBeNull();
        break;
      case "scrubbed":
        expect(end.outcome).toBe("scrubbed");
        expect(end.poll.some((p) => p.go === false)).toBe(true);
        expect(stages(frames)).not.toContain("liftoff");
        expect(last.report).not.toBeNull();
        break;
      case "noDeploy":
        expect(stages(frames)).toContain("separation");
        expect(end.stage).toBe("deploy");
        expect(end.outcome).toBe("lost");
        expect(last.report).not.toBeNull();
        break;
    }
  });

  it("a retry plays a different case, and the launch clock stays negative until lift-off", async () => {
    const { seen, sa } = await playFrom(1, ["launch", "retry"]);
    expect(sa.launchCase).toBe(launchCaseFor(2));
    expect(seen[1]![0]!.launch?.stage).toBe("countdown");
    for (const f of seen.flat()) {
      if (f.launch) expect(f.launch.met < 0).toBe(STAGE_ORDER[f.launch.stage] === 0);
    }
    expect(metText(-5)).toBe("T-00:05");
    expect(metText(125)).toBe("T+02:05");
  });
});

describe("launch sounds", () => {
  const pair = (frames: SimFrame[], stage: LaunchStage) => {
    const i = frames.findIndex((f) => f.launch?.stage === stage);
    return flightSounds(frames[i - 1]!, frames[i]!);
  };
  it("ticks in the last ten seconds, ignites at lift-off, rumbles at staging, pings at separation", () => {
    const t = clean.findIndex((f) => f.launch?.met === -5);
    expect(flightSounds(clean[t - 1]!, clean[t]!)).toEqual(["tick"]);
    expect(flightSounds(null, clean[0]!)).toEqual([]); // no launch tune on the first frame of a launch act
    expect(pair(clean, "liftoff")).toEqual(["ignition", "launch"]);
    expect(pair(clean, "staging")).toEqual(["staging"]);
    expect(pair(clean, "fairing")).toEqual(["staging"]);
    expect(pair(clean, "separation")).toEqual(["ping"]);
    expect(pair(clean, "done")).toEqual(["success"]);
    // Into week 1: nothing more, the launch tune already played.
    const week1 = recordFlight().steps[0]!.frame;
    expect(flightSounds(clean.at(-1)!, week1)).toEqual([]);
  });
  it("alerts on a NO-GO and a hold, and the report of a failed launch plays the failure", () => {
    const nogo = cases.hold.findIndex((f) => f.launch?.poll.some((p) => p.go === false));
    expect(flightSounds(cases.hold[nogo - 1]!, cases.hold[nogo]!)).toEqual(["alert"]);
    expect(pair(cases.hold, "hold")).toEqual(["alert"]);
    const lost = cases.ascentLost;
    expect(flightSounds(lost.at(-2)!, lost.at(-1)!)).toEqual(["failure"]);
  });
  it("launch frames add nothing to the graphs and mark the flight as launched", () => {
    let v = { frame: null, battery: [], link: [], launchSeen: false } as Parameters<typeof pushFrame>[0];
    for (const f of clean) v = pushFrame(v, f);
    expect(v.battery).toEqual([]);
    expect(v.launchSeen).toBe(true);
    v = pushFrame(v, recordFlight().steps[0]!.frame);
    expect(v.battery).toHaveLength(1);
    expect(v.launchSeen).toBe(true);
  });
});
