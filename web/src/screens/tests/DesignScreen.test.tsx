import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Group } from "../../bridge/types";
import { DesignScreen, satLook } from "../DesignScreen";
import { choose, fixtureState, issue, mockSend } from "./fixture";

describe("design screen (blueprint)", () => {
  it("shows the four groups, every decision group of the step and the six resources", () => {
    render(<DesignScreen state={fixtureState()} send={mockSend().send} />);
    for (const title of ["Spacecraft", "Instrument", "Communications", "Launch"])
      expect(screen.getAllByRole("heading", { name: title }).length).toBeGreaterThan(0);
    for (const g of ["Format", "Power", "Attitude control", "Image storage", "Radio", "Ground station", "Backup station"])
      expect(screen.getByRole("heading", { name: g })).toBeInTheDocument();
    expect(screen.getAllByRole("meter")).toHaveLength(6);
  });

  it("resources whose limit is not known yet say 'not set yet'", () => {
    render(<DesignScreen state={fixtureState()} send={mockSend().send} />);
    expect(screen.getByRole("meter", { name: "mass" })).toHaveAttribute("aria-valuetext", "not set yet");
    expect(screen.getByRole("meter", { name: "budget" })).not.toHaveAttribute("aria-valuetext", "not set yet");
  });

  it("each option sends choose with its group", async () => {
    const { send, fn } = mockSend();
    render(<DesignScreen state={fixtureState()} send={send} />);
    const cases: [Group, string, RegExp][] = [
      ["format", "6u", /6U CubeSat/], ["power", "deploy", /Deployable panels/], ["attitude", "reaction", /Reaction wheels/],
      ["storage", "large", /Large storage/], ["instrument", "multi", /Multispectral/], ["radio", "sband", /S-band radio/],
      ["groundStation", "network", /Commercial network/], ["backupStation", "network", /Backup network/],
      ["launch", "nasa", /NASA-provided/],
    ];
    for (const [group, id, name] of cases) {
      await userEvent.click(screen.getByRole("button", { name }));
      expect(fn).toHaveBeenLastCalledWith({ type: "choose", payload: { group, id } });
    }
    expect(fn).toHaveBeenCalledTimes(cases.length);
  });

  it("the CubeSat drawing follows the choices", () => {
    const { rerender } = render(<DesignScreen state={fixtureState()} send={mockSend().send} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("CubeSat, size not chosen");
    const chosen = fixtureState(choose("format", "6u"), choose("power", "deploy"), choose("radio", "uhf"), choose("instrument", "multi"));
    rerender(<DesignScreen state={chosen} send={mockSend().send} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "6U CubeSat, deployable solar panels, whip antennas, multispectral instrument");
  });

  it("reads the look from option ids", () => {
    expect(satLook(fixtureState(choose("format", "3u"), choose("power", "fixed"), choose("radio", "sband"), choose("instrument", "rgb"))))
      .toEqual({ size: 3, panels: "body", antenna: "patch", instrument: "camera" });
    expect(satLook(fixtureState())).toEqual({ size: null, panels: null, antenna: null, instrument: null });
  });

  it("an over-limit issue from the state is shown and finishing is not disabled", async () => {
    const { send, fn } = mockSend();
    const state = fixtureState(choose("format", "3u"), choose("power", "fixed"), choose("instrument", "multi"),
      choose("attitude", "reaction"), choose("radio", "sband"));
    expect(state.issues.some((i) => i.code === "power.over")).toBe(true);
    render(<DesignScreen state={state} send={send} />);
    expect(within(screen.getByLabelText("Issues")).getAllByRole("alert")[0]).toHaveTextContent(/Power is over its limit/);
    const finish = screen.getByRole("button", { name: /Finish step/ });
    expect(finish).toBeEnabled();
    await userEvent.click(finish);
    expect(fn).toHaveBeenCalledWith({ type: "completeStep", payload: { step: "design" } });
  });

  it("shows only design issues, not those of other steps", () => {
    render(<DesignScreen state={{ ...fixtureState(), issues: [issue("build")] }} send={mockSend().send} />);
    expect(screen.queryByText("Test issue on build")).toBeNull();
  });
});
