// Owned by the screens agent: replace with the real screens (goals, concept, requirements, design, build).
import type { MissionState, Step } from "../bridge/types";

export function ScreenPlaceholder({ step }: { step: Step; state: MissionState }) {
  return <div data-testid="screen">Screen: {step}</div>;
}
