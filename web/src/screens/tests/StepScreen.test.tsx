import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";
import { send, standinEmit, subscribe } from "../../bridge/bridge";
import type { Step, UnityToPage } from "../../bridge/types";
import { StepScreen } from "..";
import { fixtureState, mockSend } from "./fixture";

const TITLES: [Exclude<Step, "fly">, string][] = [
  ["goals", "1 Need and goals"], ["concept", "2 Concept"], ["requirements", "3 Requirements"],
  ["design", "4 Design"], ["build", "5 Build and verify"],
];

describe("step screens in the shell", () => {
  it.each(TITLES)("openScreen %s shows its screen through the stand-in", (step, title) => {
    render(<App />);
    act(() => standinEmit({ type: "openScreen", payload: { step } }));
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  });

  it("back to the ship and Escape both send close", async () => {
    const seen: UnityToPage["type"][] = [];
    const off = subscribe((m) => seen.push(m.type));
    render(<App />);
    act(() => standinEmit({ type: "openScreen", payload: { step: "design" } }));
    await userEvent.click(screen.getByRole("button", { name: /Back to the ship/ }));
    expect(seen.filter((t) => t === "closeScreen")).toHaveLength(1);
    act(() => standinEmit({ type: "openScreen", payload: { step: "build" } }));
    await userEvent.keyboard("{Escape}");
    expect(seen.filter((t) => t === "closeScreen")).toHaveLength(2);
    off();
  });

  it("is usable with the keyboard: Tab to an option, Enter chooses it", async () => {
    const { send: mock, fn } = mockSend();
    render(<StepScreen step="concept" state={fixtureState()} send={mock} />);
    const target = screen.getByRole("button", { name: /Sun-synchronous/ });
    for (let i = 0; i < 30 && document.activeElement !== target; i++) await userEvent.tab();
    expect(target).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(fn).toHaveBeenCalledWith({ type: "choose", payload: { group: "orbit", id: "leo-sso" } });
  });

  it("a choice made on a screen comes back marked in the next state", async () => {
    render(<App />);
    act(() => { send("ready", {}); standinEmit({ type: "openScreen", payload: { step: "design" } }); });
    await userEvent.click(screen.getByRole("button", { name: /6U CubeSat/ }));
    expect(screen.getByRole("button", { name: /6U CubeSat/ })).toHaveAttribute("aria-pressed", "true");
  });
});
