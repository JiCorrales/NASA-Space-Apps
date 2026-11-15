import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequirementsScreen } from "../RequirementsScreen";
import { fixtureState, issue, mockSend } from "./fixture";

describe("requirements screen", () => {
  it("lists each requirement with its value, how it is checked and its source", () => {
    const state = fixtureState();
    render(<RequirementsScreen state={state} send={mockSend().send} />);
    for (const r of state.requirements) {
      const row = screen.getByRole("row", { name: new RegExp(r.label) });
      expect(row).toHaveTextContent(`${r.value} ${r.unit}`);
      expect(row).toHaveTextContent(r.check);
      expect(within(row).getByRole("button", { name: /NASA|TEAM|DERIVED/ })).toBeInTheDocument();
    }
  });

  it("the slider is bounded by min and max and sends setRequirement", () => {
    const { send, fn } = mockSend();
    render(<RequirementsScreen state={fixtureState()} send={send} />);
    const slider = screen.getByRole("slider", { name: "Weekly images delivered" });
    expect(slider).toHaveAttribute("min", "26");
    expect(slider).toHaveAttribute("max", "52");
    fireEvent.change(slider, { target: { value: "40" } });
    expect(fn).toHaveBeenCalledWith({ type: "setRequirement", payload: { id: "images", value: 40 } });
  });

  it("the exact value field clamps to the range and sends on Enter", async () => {
    const { send, fn } = mockSend();
    render(<RequirementsScreen state={fixtureState()} send={send} />);
    const field = screen.getByLabelText("Months to reach orbit, exact value");
    await userEvent.clear(field);
    await userEvent.type(field, "99{Enter}");
    expect(fn).toHaveBeenCalledWith({ type: "setRequirement", payload: { id: "deadline", value: 36 } });
  });

  it("an empty field sends nothing and shows the state's value again", async () => {
    const { send, fn } = mockSend();
    render(<RequirementsScreen state={fixtureState()} send={send} />);
    const field = screen.getByLabelText("Months to reach orbit, exact value");
    await userEvent.clear(field);
    await userEvent.tab();
    expect(fn).not.toHaveBeenCalled();
    expect(field).toHaveValue(24);
  });

  it("an issue is shown and finishing stays possible", async () => {
    const { send, fn } = mockSend();
    render(<RequirementsScreen state={{ ...fixtureState(), issues: [issue("requirements")] }} send={send} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Test issue on requirements");
    await userEvent.click(screen.getByRole("button", { name: /Finish step/ }));
    expect(fn).toHaveBeenCalledWith({ type: "completeStep", payload: { step: "requirements" } });
  });
});
