import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConceptScreen } from "../ConceptScreen";
import { choose, fixtureState, issue, mockSend } from "./fixture";

describe("concept screen", () => {
  it("shows one decision at a time: orbit, then revisit", async () => {
    const { send, fn } = mockSend();
    render(<ConceptScreen state={fixtureState()} send={send} />);
    expect(screen.getByRole("heading", { name: "Orbit" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /How often/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Sun-synchronous/ }));
    expect(fn).toHaveBeenLastCalledWith({ type: "choose", payload: { group: "orbit", id: "leo-sso" } });

    await userEvent.click(screen.getByRole("button", { name: /Next decision/ }));
    expect(screen.getByRole("heading", { name: /How often/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Orbit" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Next decision/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Once a week/ }));
    expect(fn).toHaveBeenLastCalledWith({ type: "choose", payload: { group: "revisit", id: "weekly" } });

    await userEvent.click(screen.getByRole("button", { name: /Previous decision/ }));
    expect(screen.getByRole("heading", { name: "Orbit" })).toBeInTheDocument();
  });

  it("marks the option the state says is chosen", () => {
    render(<ConceptScreen state={fixtureState(choose("orbit", "leo-iss"))} send={mockSend().send} />);
    expect(screen.getByRole("button", { name: /ISS-like/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Sun-synchronous/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("finishing never needs a choice, even with an issue", async () => {
    const { send, fn } = mockSend();
    render(<ConceptScreen state={{ ...fixtureState(), issues: [issue("concept", "warning")] }} send={send} />);
    expect(screen.getByRole("status")).toHaveTextContent("Test issue on concept");
    await userEvent.click(screen.getByRole("button", { name: /Finish step/ }));
    expect(fn).toHaveBeenCalledWith({ type: "completeStep", payload: { step: "concept" } });
  });
});
