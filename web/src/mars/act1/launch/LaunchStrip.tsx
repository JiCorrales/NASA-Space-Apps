import { useEffect, useRef } from "react";
import type { LaunchFrame } from "../types";
import { RAIL, altitudeText, metText, pollWord, railStates, velocityText } from "./launchStatus";
import { FACE, paint } from "./sprites";
import "./launch.css";

/** The mission-control operator's face, painted once from the sprite. */
function Face() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let c: CanvasRenderingContext2D | null = null;
    try { c = ref.current?.getContext("2d") ?? null; } catch { c = null; }
    if (c) paint(c, FACE);
  }, []);
  return <canvas ref={ref} className="lx-face" width={12} height={12} aria-hidden="true" />;
}

/**
 * The launch strip in the console: mission control's face and line, the clock and the telemetry, the
 * GO/NO-GO poll and the rail of stages. It shows only what `frame.launch` says, never odds.
 */
export function LaunchStrip({ launch }: { launch: LaunchFrame }) {
  const rail = railStates(launch);
  return (
    <div className="lx" data-testid="launch-strip">
      <section className="lx-voice" aria-label="Mission control">
        <Face />
        <div>
          <h4>MISSION CONTROL</h4>
          <p data-testid="launch-line" aria-live="polite">{launch.line}</p>
        </div>
      </section>
      <section className="lx-tele" aria-label="Telemetry">
        <div className="lx-met" data-testid="launch-met">{metText(launch.met)}</div>
        <div className="lx-row"><span>ALT</span><b data-testid="launch-alt">{altitudeText(launch.altitudeKm)}</b></div>
        <div className="lx-row"><span>VEL</span><b data-testid="launch-vel">{velocityText(launch.velocityKms)}</b></div>
      </section>
      <section className="lx-poll" aria-label="GO/NO-GO poll">
        <h4>GO / NO-GO POLL</h4>
        <ol>
          {launch.poll.map((p) => {
            const w = pollWord(p.go);
            return (
              <li key={p.station} data-go={w.state} data-testid={`poll-${p.station}`}
                aria-label={`${p.station}: ${w.state === "wait" ? "not polled yet" : w.word}`}>
                <i aria-hidden="true" /><span>{p.station}</span><b>{w.word}</b>
              </li>
            );
          })}
        </ol>
      </section>
      <ol className="lx-rail" aria-label="Launch stages">
        {RAIL.map((r, i) => (
          <li key={r.stage} data-state={rail[i] || "ahead"} data-testid={`rail-${r.stage}`}>{r.label}</li>
        ))}
      </ol>
    </div>
  );
}
