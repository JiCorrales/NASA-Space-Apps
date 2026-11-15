import type { ReactNode } from "react";
import type { Step } from "../../bridge/types";
import { PixelButton } from "../../ui";
import type { Send } from "../send";

/**
 * Footer of every step: back to the ship (sends close) and finish (sends completeStep, then close:
 * the ship shows the new status when the player is back). Back is not a finish: it only closes.
 * Finishing is never disabled: issues inform, they do not block.
 */
export function StepFooter({ step, send, finishLabel = "Finish step", finish = true, children }: {
  step: Step; send: Send; finishLabel?: string;
  /** False while the step still has screens to show: the finish button waits for the last one. */
  finish?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="step-foot">
      <PixelButton onClick={() => send("close", {})}>&lt; Back to the ship</PixelButton>
      <div className="step-foot__mid">{children}</div>
      {finish && <PixelButton primary onClick={() => { send("completeStep", { step }); send("close", {}); }}>{finishLabel} &gt;</PixelButton>}
    </div>
  );
}
