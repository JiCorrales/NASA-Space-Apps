// Screens for steps 1 to 5. They show the MissionState they get and send what the player did; nothing more.
import type { MissionState, Step } from "../bridge/types";
import "./screens.css";
import { BuildScreen } from "./BuildScreen";
import { ConceptScreen } from "./ConceptScreen";
import { DesignScreen } from "./DesignScreen";
import { GoalsScreen } from "./GoalsScreen";
import { RequirementsScreen } from "./RequirementsScreen";
import { defaultSend, type Send } from "./send";

const SCREENS = {
  goals: GoalsScreen, concept: ConceptScreen, requirements: RequirementsScreen, design: DesignScreen, build: BuildScreen,
} as const;

/** The 2D screen for a step from goals to build. */
export function StepScreen({ step, state, send = defaultSend }: {
  step: Exclude<Step, "fly">; state: MissionState; send?: Send;
}) {
  const Screen = SCREENS[step];
  return (
    <div className="screens" data-testid="screen" data-step={step}>
      <Screen state={state} send={send} />
    </div>
  );
}
