import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { IssueMessage, OptionCard, ResourceBar, SourceTag } from ".";

describe("shared components", () => {
  it("resource bar says 'not set yet' when known is false", () => {
    render(<ResourceBar resource={{ kind: "mass", used: 3, available: 0, unit: "kg", known: false }} />);
    expect(screen.getAllByText(/not set yet/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/3 \/ 0/)).toBeNull();
  });

  it("resource bar names the state in words, not only colour", () => {
    render(<ResourceBar resource={{ kind: "power", used: 17, available: 8, unit: "W", known: true }} />);
    expect(screen.getByText("OVER LIMIT")).toBeInTheDocument();
    expect(screen.getByText("17 / 8 W")).toBeInTheDocument();
  });

  it("source tag expands its text on click", async () => {
    render(<SourceTag source={{ status: "nasa", text: "NASA CubeSat 101" }} />);
    expect(screen.queryByText("NASA CubeSat 101")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /nasa/i }));
    expect(screen.getByText("NASA CubeSat 101")).toBeInTheDocument();
  });

  it("option card reports selection in text and calls onSelect", async () => {
    const onSelect = vi.fn();
    const option = { id: "a", name: "Alpha", summary: "s", stats: [], source: { status: "team" as const, text: "t" } };
    const { rerender } = render(<OptionCard option={option} selected={false} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /alpha/i }));
    expect(onSelect).toHaveBeenCalledOnce();
    rerender(<OptionCard option={option} selected onSelect={onSelect} />);
    expect(screen.getByText(/SELECTED/)).toBeInTheDocument();
  });

  it("issue message shows its severity as a word", () => {
    render(<IssueMessage issue={{ code: "x", severity: "critical", resource: null, step: "design", message: "Too heavy" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("CRITICAL");
  });
});
