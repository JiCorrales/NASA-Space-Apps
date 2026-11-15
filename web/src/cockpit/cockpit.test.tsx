import { Profiler } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { standinEmit, subscribe } from "../bridge/bridge";
import { recordFlight } from "../bridge/fixtures/flight";
import type { SimFrame, UnityToPage } from "../bridge/types";
import { Cockpit } from "./Cockpit";
import { CockpitView } from "./CockpitView";
import { resetFlightView } from "./frameStore";

const rec = recordFlight();
const scene = (k: keyof typeof rec.scenes): SimFrame => rec.steps[rec.scenes[k]]!.frame;
const noop = () => {};

function view(frame: SimFrame | null) {
  return render(<CockpitView frame={frame} state={null} onFly={noop} onCommand={noop} onClose={noop} />);
}

/** Capture what the page sends by pretending Unity is present. */
function captureSends() {
  const sent: unknown[] = [];
  window.unityInstance = { SendMessage: (_o, _m, json) => sent.push(JSON.parse(json)) };
  return sent;
}

// jsdom has no canvas: the scene skips drawing when getContext returns null.
let noCanvas: { mockRestore(): void };
beforeEach(() => { noCanvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); });

afterEach(() => {
  noCanvas.mockRestore();
  delete window.unityInstance;
  act(() => resetFlightView());
});

describe("flight recording", () => {
  it("has 52 weeks in every frame and covers every scene", () => {
    for (const s of rec.steps) expect(s.frame.weeks).toHaveLength(52);
    expect(scene("storm").alert?.code).toBe("solarStorm");
    expect(scene("groundFailure").alert?.code).toBe("groundStationOffline");
    expect(scene("attitudeFault").alert?.code).toBe("attitudeFault");
    expect(scene("report").report?.images).toHaveLength(52);
    expect(rec.steps.filter((s) => s.frame.report)).toHaveLength(1);
  });
});

describe("cockpit view", () => {
  it("renders before launch with a launch button and the illustrative label", async () => {
    const onFly = vi.fn();
    render(<CockpitView frame={null} state={null} onFly={onFly} onCommand={noop} onClose={noop} />);
    expect(screen.getByText("ILLUSTRATIVE VALUES")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "LAUNCH" }));
    expect(onFly).toHaveBeenCalledWith("launch");
  });

  it("renders every recorded frame", () => {
    rec.steps.forEach(({ frame }, i) => {
      const { unmount } = view(frame);
      expect(screen.getByTestId("clock")).toHaveTextContent(`WEEK ${String(frame.week).padStart(2, "0")} / 52`);
      expect(screen.getAllByTestId(/^panel-/)).toHaveLength(6);
      expect(screen.getByText("ILLUSTRATIVE VALUES")).toBeInTheDocument();
      if (frame.alert && !frame.report) expect(screen.getByTestId("alert")).toHaveTextContent(frame.alert.title);
      else expect(screen.queryByTestId("alert"), `frame ${i}`).toBeNull();
      unmount();
    });
  });

  it("shows each problem with text labels, not only colour", () => {
    let r = view(scene("storm"));
    expect(screen.getByTestId("panel-power")).toHaveAttribute("data-s", "crit");
    expect(within(screen.getByTestId("panel-power")).getByText("CRITICAL")).toBeInTheDocument();
    expect(within(screen.getByTestId("panel-attitude")).getByText("OFF TARGET")).toBeInTheDocument();
    expect(within(screen.getByTestId("panel-thermal")).getByText("HOT")).toBeInTheDocument();
    expect(screen.getByTestId("segment-space")).toHaveTextContent("PROBLEM");
    r.unmount();
    r = view(scene("groundFailure"));
    expect(within(screen.getByTestId("panel-datalink")).getByText("STATION DOWN")).toBeInTheDocument();
    expect(screen.getByTestId("segment-ground")).toHaveTextContent("OFFLINE");
    r.unmount();
    view(scene("attitudeFault"));
    expect(within(screen.getByTestId("panel-attitude")).getByText("OFF TARGET")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /RECALIBRATE/ })).toBeEnabled();
  });

  it("lights the segments: launch at deployment, ground in contact, user on delivery", () => {
    let r = view(scene("launch"));
    expect(screen.getByTestId("segment-launch")).toHaveAttribute("data-lit", "true");
    r.unmount();
    r = view(scene("contact"));
    expect(screen.getByTestId("segment-launch")).toHaveAttribute("data-lit", "false");
    expect(screen.getByTestId("segment-ground")).toHaveAttribute("data-lit", "true");
    expect(screen.getByTestId("segment-user")).toHaveTextContent("RECEIVING");
    r.unmount();
    view(scene("capture"));
    expect(screen.getByTestId("segment-space")).toHaveTextContent("IMAGING");
  });

  it("the 52-week grid reflects weeks", () => {
    const weeks = Array.from({ length: 52 }, (_, i) => (i < 5 ? "sent" : i === 5 ? "held" : i === 6 ? "lost" : i === 7 ? "next" : "")) as SimFrame["weeks"];
    view({ ...scene("normalWeek"), weeks });
    const cells = screen.getByTestId("panel-imaging").querySelectorAll("[data-state]");
    expect(cells).toHaveLength(52);
    expect([...cells].map((c) => c.getAttribute("data-state"))).toEqual(weeks.map((w) => w || "future"));
    expect(cells[6]).toHaveAttribute("title", "Week 7: lost");
    expect(screen.getByTestId("week-grid")).toHaveAccessibleName("Weeks: 5 delivered, 1 waiting, 1 lost");
  });

  it("shows the three most recent log lines", () => {
    const f = scene("storm");
    view(f);
    const lines = within(screen.getByTestId("log")).getAllByText(/^W\d\d · /);
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveTextContent(f.log[f.log.length - 1]!.text);
  });

  it("the report appears only when report is present", async () => {
    for (const { frame } of rec.steps.slice(0, -1)) {
      const { unmount } = view(frame);
      expect(screen.queryByTestId("report")).toBeNull();
      unmount();
    }
    const onFly = vi.fn();
    const onClose = vi.fn();
    const f = scene("report");
    render(<CockpitView frame={f} state={null} onFly={onFly} onCommand={noop} onClose={onClose} />);
    const card = screen.getByTestId("report");
    expect(card).toHaveTextContent("MISSION REPORT · WEEK 52");
    expect(card).toHaveTextContent(`${f.report!.successRate}%`);
    for (const fac of f.report!.factors) expect(card).toHaveTextContent(fac.label);
    for (const d of f.report!.decisions) expect(card).toHaveTextContent(d);
    expect(card).toHaveTextContent(f.report!.suggestion);
    expect(card.querySelectorAll(".ck-film i")).toHaveLength(52);
    await userEvent.click(within(card).getByRole("button", { name: "RETRY MISSION" }));
    expect(onFly).toHaveBeenCalledWith("retry");
    await userEvent.click(within(card).getByRole("button", { name: "CHANGE DESIGN" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("cockpit on the bridge", () => {
  it("shows the latest simTick and a command button sends the right message", async () => {
    const sent = captureSends();
    render(<Cockpit state={null} />);
    act(() => standinEmit({ type: "simTick", payload: scene("storm") }));
    const pause = screen.getByRole("button", { name: /PAUSE CAMERA/ });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(pause);
    expect(sent).toEqual([{ type: "command", payload: { name: "pauseCamera" } }]);
  });

  it("a disabled command sends nothing", async () => {
    const sent = captureSends();
    render(<Cockpit state={null} />);
    act(() => standinEmit({ type: "simTick", payload: scene("groundFailure") }));
    const backup = screen.getByRole("button", { name: /USE BACKUP STATION/ });
    expect(backup).toBeDisabled();
    expect(backup).toHaveTextContent("NOT AVAILABLE");
    await userEvent.click(backup);
    expect(sent).toEqual([]);
  });

  it("an active command shows its active label", () => {
    render(<Cockpit state={null} />);
    act(() => standinEmit({ type: "simTick", payload: rec.steps[rec.scenes.storm + 1]!.frame }));
    const on = screen.getByRole("button", { name: /CAMERA PAUSED/ });
    expect(on).toHaveAttribute("aria-pressed", "true");
    expect(on).toHaveTextContent("ACTIVE");
  });

  it("speed controls send fly actions and show the current speed", async () => {
    const sent = captureSends();
    render(<Cockpit state={null} />);
    act(() => standinEmit({ type: "simTick", payload: scene("normalWeek") }));
    expect(screen.getByRole("button", { name: "DETAIL" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "FAST" }));
    await userEvent.click(screen.getByRole("button", { name: "PAUSE" }));
    await userEvent.click(screen.getByRole("button", { name: "DETAIL" }));
    expect(sent).toEqual([
      { type: "fly", payload: { action: "fast" } },
      { type: "fly", payload: { action: "pause" } },
      { type: "fly", payload: { action: "resume" } },
    ]);
  });

  it("canvas animation does not re-render React", () => {
    // A stub 2D context and a manual animation clock.
    const ctx = new Proxy({}, { get: (_t, k) => (k === "createLinearGradient" || k === "createRadialGradient"
      ? () => ({ addColorStop: noop }) : noop), set: () => true });
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as never);
    const queue: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => { queue.push(cb); return queue.length; });
    let renders = 0;
    render(<Profiler id="ck" onRender={() => { renders++; }}><Cockpit state={null} /></Profiler>);
    act(() => standinEmit({ type: "simTick", payload: scene("capture") }));
    const before = renders;
    let drawn = 0;
    act(() => { for (let i = 0; i < 120 && queue.length; i++) { queue.shift()!(i * 16.7); drawn++; } });
    expect(drawn).toBe(120);
    expect(renders).toBe(before);
    raf.mockRestore();
    getContext.mockRestore();
  });
});

describe("flight stand-in", () => {
  let off = () => {};
  afterEach(() => { off(); vi.useRealTimers(); });

  it("plays the recording on launch, waits at an alert and goes on when a command is pressed", async () => {
    vi.useFakeTimers();
    const seen: SimFrame[] = [];
    off = subscribe((m: UnityToPage) => { if (m.type === "simTick") seen.push(m.payload); });
    const { send } = await import("../bridge/bridge");
    send("fly", { action: "launch" });
    // The recording loads through a dynamic import; let it settle without moving the clock.
    for (let i = 0; i < 50 && seen.length === 0; i++) await vi.advanceTimersByTimeAsync(0);
    expect(seen).toHaveLength(1);
    expect(seen[0]!.week).toBe(1);
    send("fly", { action: "fast" });
    // Fast forward runs until the storm, then drops to detail and waits for an answer.
    for (let i = 0; i < 400 && !seen.at(-1)!.alert?.code.includes("Storm"); i++) await vi.advanceTimersByTimeAsync(200);
    const storm = scene("storm");
    for (let i = 0; i < 20 && seen.at(-1)!.pointingError !== storm.pointingError; i++) await vi.advanceTimersByTimeAsync(1000);
    expect(seen.at(-1)!.day).toBe(storm.day);
    expect(seen.at(-1)!.alert?.code).toBe("solarStorm");
    expect(seen.at(-1)!.speed).toBe("detail");
    const waiting = seen.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(seen.length).toBe(waiting);
    send("command", { name: "pauseCamera" });
    expect(seen.at(-1)!.commands.find((c) => c.name === "pauseCamera")?.active).toBe(true);
    send("fly", { action: "pause" });
  });
});

describe("flight sounds", () => {
  const f = (over: Partial<SimFrame>): SimFrame => ({ ...scene("storm"), alert: null, report: null, week: 5, imagesDelivered: 4, imagesLost: 0, speed: "detail", ...over });
  it("names the sound for each flight event, and none when nothing happened", async () => {
    const { flightSounds } = await import("../sound");
    expect(flightSounds(null, f({}))).toEqual(["launch"]);
    expect(flightSounds(f({}), f({}))).toEqual([]);
    expect(flightSounds(f({}), f({ imagesDelivered: 5 }))).toEqual(["image"]);
    expect(flightSounds(f({}), f({ imagesDelivered: 5, speed: "fast" }))).toEqual([]);
    expect(flightSounds(f({}), f({ imagesLost: 1, speed: "fast" }))).toEqual(["lost"]);
    const storm = { code: "storm", title: "Solar storm" };
    expect(flightSounds(f({}), f({ alert: storm }))).toEqual(["alert"]);
    expect(flightSounds(f({ alert: storm }), f({ alert: storm }))).toEqual([]);
    const report = { ...scene("report").report!, successRate: 86 };
    expect(flightSounds(f({}), f({ report }))).toEqual(["success"]);
    expect(flightSounds(f({}), f({ report: { ...report, successRate: 30 } }))).toEqual(["failure"]);
    expect(flightSounds(f({ week: 52 }), f({ week: 1 }))).toEqual(["launch"]);
  });
});
