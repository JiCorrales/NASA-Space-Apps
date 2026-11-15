import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "./App";
import { send, standinEmit, subscribe } from "./bridge/bridge";
import type { MissionState } from "./bridge/types";

function lastState(): MissionState {
  let s: MissionState | undefined;
  const off = subscribe((m) => { if (m.type === "state") s = m.payload; });
  act(() => send("ready", {}));
  off();
  return s!;
}

describe("stand-in", () => {
  it("answers ready with a state", () => {
    const s = lastState();
    expect(s.mission.id).toBe("EW-1");
    expect(s.groups.length).toBeGreaterThan(10);
    expect(s.resources.map((r) => r.kind).sort()).toEqual(["budget", "communications", "data", "mass", "power", "time"]);
  });

  it("choose changes the design in the next state", () => {
    expect(lastState().design.format).toBeUndefined();
    act(() => send("choose", { group: "format", id: "3u" }));
    expect(lastState().design.format).toBe("3u");
    expect(lastState().resources.find((r) => r.kind === "mass")?.known).toBe(true);
  });

  it("toggle adds and removes a test; an over-limit design raises an issue", () => {
    act(() => send("toggle", { group: "tests", id: "thermal" }));
    expect(lastState().design.tests).toContain("thermal");
    act(() => send("toggle", { group: "tests", id: "thermal" }));
    expect(lastState().design.tests).not.toContain("thermal");
    act(() => { send("choose", { group: "format", id: "3u" }); send("choose", { group: "instrument", id: "multi" });
      send("choose", { group: "attitude", id: "reaction" }); send("choose", { group: "radio", id: "sband" }); send("choose", { group: "power", id: "fixed" }); });
    expect(lastState().issues.some((i) => i.code === "power.over")).toBe(true);
  });
});

describe("app shell", () => {
  it("shows nothing until openScreen, opens the right screen, hides on closeScreen", () => {
    render(<App />);
    expect(screen.queryByTestId("screen")).toBeNull();
    act(() => standinEmit({ type: "openScreen", payload: { step: "design" } }));
    expect(screen.getByTestId("screen")).toHaveAttribute("data-step", "design");
    act(() => standinEmit({ type: "openScreen", payload: { step: "fly" } }));
    expect(screen.getByTestId("screen")).toHaveAccessibleName("Step 6: fly the mission");
    act(() => standinEmit({ type: "closeScreen", payload: {} }));
    expect(screen.queryByTestId("screen")).toBeNull();
  });

  it("Escape sends close, and the stand-in answers with closeScreen", async () => {
    const seen: string[] = [];
    subscribe((m) => seen.push(m.type));
    render(<App />);
    act(() => standinEmit({ type: "openScreen", payload: { step: "goals" } }));
    await userEvent.keyboard("{Escape}");
    expect(seen).toContain("closeScreen");
    expect(screen.queryByTestId("screen")).toBeNull();
  });

  it("sends Unity the JSON string when unityInstance exists", () => {
    const SendMessage = vi.fn();
    window.unityInstance = { SendMessage };
    send("close", {});
    delete window.unityInstance;
    expect(SendMessage).toHaveBeenCalledWith("Bridge", "Receive", '{"type":"close","payload":{}}');
  });
});
