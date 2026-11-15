// Owned by the screens agent: replace with the real screens (goals, concept, requirements, design, build).
// Shared pieces live in ../ui (ScreenFrame, PixelButton, OptionCard, SourceTag, ResourceBar, IssueMessage).
import type { MissionState, Step } from "../bridge/types";
import { send } from "../bridge/bridge";
import { PixelButton, ScreenFrame } from "../ui";

export function ScreenPlaceholder({ step }: { step: Step; state: MissionState }) {
  return (
    <ScreenFrame step={step} title={`Step: ${step}`} footer={<PixelButton onClick={() => send("close", {})}>Back to the ship</PixelButton>}>
      <div data-testid="screen">Screen: {step}</div>
    </ScreenFrame>
  );
}
