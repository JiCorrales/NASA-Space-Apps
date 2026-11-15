import { useEffect, useState } from "react";
import "../../ui";
import { installClickSound, play } from "../../sound";
import type { SolEvent } from "../types";
import { PLAYER_IDS, type PlayerId } from "../types";
import type { RunFactory } from "./engine";
import { Panel } from "./Panel";
import { ResultCard } from "./ResultCard";
import { Tabs } from "./Tabs";
import { TopBar } from "./TopBar";
import { useMarsRun } from "./useMarsRun";
import type { DesignId, Handoff } from "./engine";
import "./mars.css";

/** The four screens side by side. Each panel is one player; a person can take over any one. */
export function MarsPage({ factory, seed, design, autoplay, handoff }: { factory: RunFactory; seed?: number; design?: DesignId; autoplay?: boolean; handoff?: Handoff | null }) {
  const run = useMarsRun(factory, { seed, design, autoplay, handoff });
  const [shown, setShown] = useState<PlayerId>(0);
  useEffect(() => { installClickSound(); }, []);
  useEffect(() => {
    run.onSound.current = (ev: SolEvent) => {
      if (ev.kind === "link") play(ev.ok ? "linkBack" : "linkLost");
      else if (ev.kind === "task") play("taskDone");
      else if (ev.kind === "hazard") play("storm");
    };
  });
  useEffect(() => { if (run.phase === "evening") play("solEnd"); if (run.phase === "ended" && run.result) play(run.result.outcome === "won" ? "success" : "failure"); }, [run.phase, run.result]);
  return (
    <main className="mars">
      <h1 className="sr-only">Mars, 30 sols: four crew screens</h1>
      <TopBar run={run} hasHandoff={!!run.handoff} />
      <Tabs run={run} shown={shown} onShow={setShown} />
      <div className="mars__grid">
        {PLAYER_IDS.map((p) => <Panel key={p} run={run} index={p} roster={run.crew} shown={p === shown} />)}
      </div>
      {run.phase === "ended" && run.result && <ResultCard result={run.result} attempts={run.attempts} onAgain={() => run.restart(true)} onSame={() => run.restart(false)} />}
    </main>
  );
}
