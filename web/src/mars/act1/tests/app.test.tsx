import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Group, PageToUnity } from "../../../bridge/types";
import { Act1App } from "../Act1App";
import { fillTheRest, emptySeats, toCrewSetup } from "../crew";
import { GOOD_DESIGN } from "../fixtures";
import { HANDOFF_KEY } from "../handoff";
import { MarsSession } from "../session";
import { FlightScreen } from "../ui/FlightScreen";

function goodSession(): MarsSession {
  const m = new MarsSession();
  for (const [g, v] of Object.entries(GOOD_DESIGN)) {
    const msgs: PageToUnity[] = Array.isArray(v)
      ? v.map((id) => ({ type: "toggle", payload: { group: g as Group, id } }))
      : typeof v === "string" ? [{ type: "choose", payload: { group: g as Group, id: v } }] : [];
    msgs.forEach((x) => m.handle(x));
  }
  return m;
}

describe("the Act 1 page", () => {
  beforeEach(() => localStorage.clear());

  it("goes from crew setup to the board, opens only the first step, and Escape comes back to the board", async () => {
    const user = userEvent.setup();
    render(<Act1App />);
    expect(screen.getByRole("button", { name: "To the mission board" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Fill the rest" }));
    await user.click(screen.getByRole("button", { name: "To the mission board" }));

    const steps = within(screen.getByRole("list", { name: "The six steps" })).getAllByRole("button");
    expect(steps).toHaveLength(6);
    expect(steps[0]).toBeEnabled();
    steps.slice(1).forEach((b) => expect(b).toBeDisabled());

    await user.click(steps[0]!);
    expect(screen.getByTestId("screen")).toHaveAttribute("data-step", "goals");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("heading", { name: "Mars Relay" })).toBeInTheDocument();
  });

  it("takes each role once in the crew setup", async () => {
    const user = userEvent.setup();
    render(<Act1App />);
    const seat = (n: number) => screen.getByRole("group", { name: `Role for seat ${n}` });
    await user.click(within(seat(1)).getByRole("button", { name: /Commander/ }));
    await user.click(within(seat(2)).getByRole("button", { name: /Commander/ }));
    expect(within(seat(1)).getByRole("button", { name: /Commander/ })).toHaveAttribute("aria-pressed", "false");
    expect(within(seat(2)).getByRole("button", { name: /Commander/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("on landing, writes the hand-over for mars.html and links to it", () => {
    const session = goodSession();
    const crew = toCrewSetup(fillTheRest(emptySeats()));
    render(<FlightScreen session={session} state={session.state()} crew={crew} onBoard={() => {}} initialPhase="summary" />);
    const h = JSON.parse(localStorage.getItem(HANDOFF_KEY)!);
    expect(Object.keys(h).sort()).toEqual(["capabilities", "crew", "design", "extras"]);
    expect(h.crew).toHaveLength(4);
    expect(h.capabilities).toEqual(session.capabilities());
    expect(screen.getByRole("link", { name: "Begin sol 1" })).toHaveAttribute("href", "./mars.html");
  });
});
