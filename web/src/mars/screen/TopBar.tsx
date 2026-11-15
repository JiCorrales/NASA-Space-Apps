import { PixelButton } from "../../ui";
import { DESIGNS, type DesignId } from "./engine";
import { Icon } from "./Icon";
import type { MarsRun } from "./useMarsRun";

/** The sol counter, the transport controls, the satellite design and a "take control" switch per player. */
export function TopBar({ run, hasHandoff }: { run: MarsRun; hasHandoff: boolean }) {
  const left = Math.max(0, run.totalSols - run.sol);
  const ended = run.phase === "ended";
  return (
    <header className="bar">
      <div className="bar__sol" role="status" aria-label={`Sol ${run.sol} of ${run.totalSols}. ${left} sols until the window home closes.`}>
        <Icon name="sol" large />
        <span className="bar__count">SOL <b>{run.sol}</b> / {run.totalSols}</span>
        <span className="bar__window" data-late={left <= 5}><Icon name={left <= 3 ? "window_last" : "window_closing"} /> WINDOW HOME CLOSES IN {left} SOLS</span>
        <span className="bar__phase">{run.phase.toUpperCase()}</span>
      </div>
      <div className="bar__ctl" role="group" aria-label="Run controls">
        {run.running ? <PixelButton onClick={run.pause} aria-label="Pause">PAUSE</PixelButton> : <PixelButton primary onClick={run.play} aria-label="Play">PLAY</PixelButton>}
        <PixelButton onClick={run.step} disabled={ended} aria-label="Step one sol">STEP</PixelButton>
        <PixelButton onClick={run.toggleFast} aria-pressed={run.fast} aria-label="Fast forward" className={run.fast ? "is-on" : ""}>FAST x4</PixelButton>
        <PixelButton onClick={() => run.restart(true)} aria-label="Restart with a new seed">NEW SEED</PixelButton>
        <PixelButton onClick={() => run.restart(false)} aria-label="Restart with the same seed">SAME SEED</PixelButton>
        <label className="bar__design">SATELLITE
          <select value={run.design} onChange={(e) => run.setDesign(e.target.value as DesignId)} aria-label="Satellite design">
            {hasHandoff && <option value="yours">YOUR DESIGN</option>}
            {DESIGNS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
        <span className="bar__seed">SEED {run.seed}</span>
      </div>
      <div className="bar__take" role="group" aria-label="Take control of a player"><span className="bar__seed">TAKE CONTROL</span>
        {run.crew.map((c, i) => (
          <button key={i} type="button" className="take" aria-label={`Take control of ${c.name}`} aria-pressed={run.controlled[i]} onClick={() => run.toggleControl(i as 0 | 1 | 2 | 3)}>
            {run.controlled[i] ? "[x]" : "[ ]"} {c.name.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
