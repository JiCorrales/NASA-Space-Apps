// Act 1 of the Mars version, as one page: crew setup, the mission board, the five decision screens (fed by the Mars
// session instead of Unity) and step 6. Hand-over to Act 2 through localStorage "mars.handoff" (see handoff.ts).
import { useEffect, useMemo, useState } from "react";
import type { MissionState, Step } from "../../bridge/types";
import { StepScreen } from "../../screens";
import { readHistory, readLaunches } from "./handoff";
import { MarsSession } from "./session";
import { Board } from "./ui/Board";
import { CrewScreen } from "./ui/CrewScreen";
import { FlightScreen } from "./ui/FlightScreen";
import type { CrewSetup } from "./types";
import "./ui/act1.css";

type View = { at: "crew" } | { at: "board" } | { at: "step"; step: Exclude<Step, "fly"> } | { at: "fly" };

export function Act1App({ session: given }: { session?: MarsSession }) {
  const session = useMemo(() => given ?? new MarsSession(), [given]);
  const [state, setState] = useState<MissionState>(() => session.state());
  const [crew, setCrew] = useState<CrewSetup[] | null>(null);
  const [view, setView] = useState<View>({ at: "crew" });

  useEffect(() => session.subscribe(setState), [session]);
  // the screens' "back" button and Escape both send `close`
  useEffect(() => {
    session.setOnClose(() => setView({ at: "board" }));
    return () => session.setOnClose(null);
  }, [session]);
  useEffect(() => {
    if (view.at !== "step") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && session.send("close", {});
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, session]);

  return (
    <div className="shell a1-shell">
      {view.at === "crew" && <CrewScreen onDone={(c) => { setCrew(c); setView({ at: "board" }); }} />}
      {view.at === "board" && crew && (
        <Board state={state} crew={crew} launches={readLaunches()} onMars={readHistory()}
          onOpen={(s) => setView(s === "fly" ? { at: "fly" } : { at: "step", step: s })} />
      )}
      {view.at === "step" && <StepScreen step={view.step} state={state} send={session.send} />}
      {view.at === "fly" && crew && <FlightScreen session={session} state={state} crew={crew} onBoard={() => setView({ at: "board" })} />}
    </div>
  );
}
