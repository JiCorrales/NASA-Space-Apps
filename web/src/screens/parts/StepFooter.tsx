import type { ReactNode } from "react";
import type { Step } from "../../bridge/types";
import { PixelButton } from "../../ui";
import type { Send } from "../send";

/**
 * Footer of every step: back to the ship (sends close) and finish (sends completeStep).
 * Finishing is never disabled: issues inform, they do not block.
 */
export function StepFooter({ step, send, finishLabel = "Finish step", children }: {
  step: Step; send: Send; finishLabel?: string; children?: ReactNode;
}) {
  return (
    <div className="step-foot">
      <PixelButton onClick={() => send("close", {})}>&lt; Back to the ship</PixelButton>
      <div className="step-foot__mid">{children}</div>
      <PixelButton primary onClick={() => send("completeStep", { step })}>{finishLabel} &gt;</PixelButton>
    </div>
  );
}
