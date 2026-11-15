import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalsScreen } from "../GoalsScreen";
import { choose, fixtureState, issue, mockSend } from "./fixture";

describe("goals screen (mission select)", () => {
  it("renders the worlds from the fixture: only Earth open, locked cards say what would change", () => {
    render(<GoalsScreen state={fixtureState()} send={mockSend().send} />);
    expect(screen.getByRole("button", { name: "Earth" })).not.toHaveAttribute("aria-disabled");
    for (const name of ["Moon", "Mars", "Venus", "Jupiter"])
      expect(screen.getByRole("button", { name: `${name}, locked` })).toHaveAttribute("aria-disabled", "true");
    const mars = screen.getByLabelText("What would change at Mars");
    expect(mars).toHaveTextContent("Sunlight for the panels");
    expect(mars).toHaveTextContent("586");
    expect(mars).toHaveTextContent("Radio signal");
    expect(mars).toHaveTextContent("7 months");
    // Venus has no signal number in the fixture yet.
    expect(within(screen.getByLabelText("What would change at Venus")).getByText("data coming")).toBeInTheDocument();
  });

  it("a locked planet cannot be chosen and sends nothing", async () => {
    const { send, fn } = mockSend();
    render(<GoalsScreen state={fixtureState()} send={send} />);
    const mars = screen.getByRole("button", { name: "Mars, locked" });
    await userEvent.click(mars);
    expect(mars).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/Missions at/)).toBeNull();
    expect(fn).not.toHaveBeenCalled();
  });

  it("Earth shows its missions; only Earth Watch can be chosen; then the need and the region", async () => {
    const { send, fn } = mockSend();
    render(<GoalsScreen state={fixtureState()} send={send} />);
    await userEvent.click(screen.getByRole("button", { name: "Earth" }));
    expect(screen.getByText("Missions at Earth")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Radiation survey, locked" }));
    expect(screen.queryByText("Who needs the data")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Earth Watch" }));
    expect(screen.getByText("Who needs the data")).toBeInTheDocument();
    expect(screen.getByText(/Scientists and rangers/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Costa Rica forests/ }));
    expect(fn).toHaveBeenCalledWith({ type: "choose", payload: { group: "region", id: "costa-rica" } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("opens on Earth Watch with the chosen region marked when a region is already set", () => {
    render(<GoalsScreen state={fixtureState(choose("region", "amazon"))} send={mockSend().send} />);
    expect(screen.getByRole("button", { name: /The Amazon/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Costa Rica/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("a source tag expands on click", async () => {
    render(<GoalsScreen state={fixtureState()} send={mockSend().send} />);
    const tags = within(screen.getByLabelText("What would change at Mars")).getAllByRole("button", { name: /NASA/ });
    await userEvent.click(tags[0]!);
    expect(screen.getByText(/NASA Planetary Fact Sheet/)).toBeInTheDocument();
  });

  it("shows an issue and still lets the player finish; back to the ship sends close", async () => {
    const { send, fn } = mockSend();
    render(<GoalsScreen state={{ ...fixtureState(), issues: [issue("goals")] }} send={send} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Test issue on goals");
    const finish = screen.getByRole("button", { name: /Finish step/ });
    expect(finish).toBeEnabled();
    await userEvent.click(finish);
    expect(fn).toHaveBeenCalledWith({ type: "completeStep", payload: { step: "goals" } });
    await userEvent.click(screen.getByRole("button", { name: /Back to the ship/ }));
    expect(fn).toHaveBeenCalledWith({ type: "close", payload: {} });
  });

  it("without worlds or missions in the state shows Earth alone, open", async () => {
    const { worlds: _w, missions: _m, ...bare } = fixtureState();
    render(<GoalsScreen state={bare} send={mockSend().send} />);
    expect(screen.queryByRole("button", { name: /locked/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Earth" }));
    await userEvent.click(screen.getByRole("button", { name: "Earth Watch" }));
    expect(screen.getAllByText("Data coming.")).toHaveLength(2);
  });
});
