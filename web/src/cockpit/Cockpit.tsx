import { useCallback, useEffect, useRef } from "react";
import { send } from "../bridge/bridge";
import type { CommandName, FlyAction, MissionState } from "../bridge/types";
import { CockpitView } from "./CockpitView";
import { useFlightView } from "./frameStore";
import { flightSounds, play } from "../sound";

/** Step "fly": the cockpit, wired to the bridge. Shows the latest `simTick`; sends `fly` and `command`. */
export function Cockpit({ state }: { state: MissionState | null }) {
  const { frame, battery, link, launchSeen } = useFlightView();
  const heard = useRef<typeof frame>(null);
  useEffect(() => {
    flightSounds(heard.current, frame).forEach(play);
    heard.current = frame;
  }, [frame]);
  const onFly = useCallback((action: FlyAction) => send("fly", { action }), []);
  const onCommand = useCallback((name: CommandName) => send("command", { name }), []);
  // "Change design" goes back to the ship, where the player opens the design screen again.
  const onClose = useCallback(() => send("close", {}), []);
  return <CockpitView frame={frame} state={state} battery={battery} link={link} launchSeen={launchSeen} onFly={onFly} onCommand={onCommand} onClose={onClose} />;
}
