import { useCallback } from "react";
import { send } from "../bridge/bridge";
import type { CommandName, FlyAction, MissionState } from "../bridge/types";
import { CockpitView } from "./CockpitView";
import { useFlightView } from "./frameStore";

/** Step "fly": the cockpit, wired to the bridge. Shows the latest `simTick`; sends `fly` and `command`. */
export function Cockpit({ state }: { state: MissionState | null }) {
  const { frame, battery, link } = useFlightView();
  const onFly = useCallback((action: FlyAction) => send("fly", { action }), []);
  const onCommand = useCallback((name: CommandName) => send("command", { name }), []);
  // "Change design" goes back to the ship, where the player opens the design screen again.
  const onClose = useCallback(() => send("close", {}), []);
  return <CockpitView frame={frame} state={state} battery={battery} link={link} onFly={onFly} onCommand={onCommand} onClose={onClose} />;
}
