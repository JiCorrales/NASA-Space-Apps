import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "./App";
import { subscribe } from "./bridge/bridge";
import { START_TIMEOUT_MS } from "./bridge/engine";

const status = (phase: "loading" | "starting" | "failed" | "ready", progress = 0) =>
  act(() => { window.__unityStatus = { phase, progress }; window.dispatchEvent(new Event("unitystatus")); });

describe("inside a Unity build", () => {
  beforeEach(() => { window.__unityBuild = true; window.__unityStatus = { phase: "loading", progress: 0 }; });
  afterEach(() => {
    delete window.__unityBuild; delete window.__unityStatus; delete window.unityInstance;
    vi.useRealTimers(); vi.unstubAllGlobals();
  });

  it("never uses the stand-in or shows the developer bar", () => {
    const seen: string[] = [];
    subscribe((m) => seen.push(m.type));
    render(<App />); // the page sends `ready` on mount
    expect(screen.queryByLabelText("Developer bar")).toBeNull();
    expect(seen).toEqual([]); // the stand-in would have answered with a state
  });

  it("shows the download progress, then says the engine is starting", () => {
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading the game...");
    status("loading", 0.42);
    expect(screen.getByRole("status")).toHaveTextContent("42%");
    status("starting", 1);
    expect(screen.getByRole("status")).toHaveTextContent("Starting the game engine...");
  });

  it("fails when Unity has not started 90 seconds after the downloads ended, and Try again reloads", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(<App />);
    status("loading", 0.9);
    act(() => { vi.advanceTimersByTime(START_TIMEOUT_MS * 2); });
    expect(screen.queryByRole("alert")).toBeNull(); // slow downloads are not a failure
    status("starting", 1);
    act(() => { vi.advanceTimersByTime(START_TIMEOUT_MS - 1000); });
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => { vi.advanceTimersByTime(1000); });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("could not start on this device and browser");
    expect(alert).toHaveTextContent("WebGL 2");
    expect(alert).toHaveTextContent("keyboard and mouse");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reload).toHaveBeenCalled();
  });

  it("fails at once when Unity reports an error", () => {
    render(<App />);
    status("failed");
    expect(screen.getByRole("alert")).toHaveTextContent("The game could not start");
  });

  it("does not fail when Unity starts in time, and then asks it for the state", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    status("starting", 1);
    act(() => { vi.advanceTimersByTime(START_TIMEOUT_MS - 1000); });
    const SendMessage = vi.fn();
    window.unityInstance = { SendMessage };
    status("ready", 1);
    act(() => { window.dispatchEvent(new Event("unityready")); });
    act(() => { vi.advanceTimersByTime(START_TIMEOUT_MS * 2); });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(SendMessage).toHaveBeenCalledWith("Bridge", "Receive", JSON.stringify({ type: "ready", payload: {} }));
  });
});

describe("plain pnpm dev (no flag)", () => {
  it("keeps the stand-in, the developer bar and no loading screen", () => {
    render(<App />);
    expect(screen.getByLabelText("Developer bar")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
