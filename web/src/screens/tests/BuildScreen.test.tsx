import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuildScreen } from "../BuildScreen";
import { fixtureState, issue, mockSend, toggle } from "./fixture";

describe("build and verify screen", () => {
  it("each test sends toggle; chosen tests are marked", async () => {
    const { send, fn } = mockSend();
    const { rerender } = render(<BuildScreen state={fixtureState()} send={send} />);
    const cases = [["vibration", /Vibration/], ["thermal", /Thermal vacuum/], ["day", /Day in the life/]] as const;
    for (const [id, name] of cases) {
      await userEvent.click(screen.getByRole("button", { name }));
      expect(fn).toHaveBeenLastCalledWith({ type: "toggle", payload: { group: "tests", id } });
    }
    rerender(<BuildScreen state={fixtureState(toggle("tests", "thermal"))} send={send} />);
    expect(screen.getByRole("button", { name: /Thermal vacuum/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Vibration/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("the reserve slider shows the state's reserve and sends setReserve as a fraction", () => {
    const { send, fn } = mockSend();
    render(<BuildScreen state={fixtureState()} send={send} />);
    const slider = screen.getByRole("slider", { name: "Budget reserve" });
    expect(slider).toHaveValue("10");
    fireEvent.change(slider, { target: { value: "25" } });
    expect(fn).toHaveBeenCalledWith({ type: "setReserve", payload: { fraction: 0.25 } });
  });

  it("says which requirements are verified, as Unity reports them", () => {
    render(<BuildScreen state={fixtureState(toggle("tests", "vibration"))} send={mockSend().send} />);
    expect(screen.getByRole("row", { name: /Months to reach orbit/ })).toHaveTextContent(/VERIFIED$/);
    expect(screen.getByRole("row", { name: /Weekly images delivered/ })).toHaveTextContent("NOT VERIFIED");
  });

  it("a requirement without a verdict reads 'not checked yet'; no reserve reads 'not set yet'", () => {
    const s = fixtureState();
    const bare = { ...s, reserve: undefined, requirements: s.requirements.map(({ verified: _v, ...r }) => r) };
    render(<BuildScreen state={bare} send={mockSend().send} />);
    expect(screen.getAllByText("NOT CHECKED YET")).toHaveLength(s.requirements.length);
    expect(screen.getByText("not set yet")).toBeInTheDocument();
  });

  it("shows only the budget and time resources", () => {
    render(<BuildScreen state={fixtureState()} send={mockSend().send} />);
    expect(screen.getAllByRole("meter").map((m) => m.getAttribute("aria-label"))).toEqual(["budget", "time"]);
  });

  it("an issue is shown and finishing stays possible", async () => {
    const { send, fn } = mockSend();
    render(<BuildScreen state={{ ...fixtureState(), issues: [issue("build")] }} send={send} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Test issue on build");
    await userEvent.click(screen.getByRole("button", { name: /Finish step/ }));
    expect(fn).toHaveBeenCalledWith({ type: "completeStep", payload: { step: "build" } });
  });
});
