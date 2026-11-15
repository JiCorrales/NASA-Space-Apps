import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CommandName, FlyAction, MissionState, SimFrame } from "../bridge/types";
import type { LinkSample } from "./frameStore";
import { CommandDeck } from "./CommandDeck";
import { ReportCard } from "./ReportCard";
import { SpaceCanvas } from "./SpaceCanvas";
import { StatusScreens } from "./StatusScreens";
import { STAGE_H, STAGE_W } from "./scene/drawScene";
import { pad, sceneInputFromFrame, segmentStatus } from "./status";
import { isMuted, setMuted } from "../sound";
import "./cockpit.css";

export interface CockpitViewProps {
  frame: SimFrame | null;
  state: MissionState | null;
  battery?: number[];
  link?: LinkSample[];
  onFly: (action: FlyAction) => void;
  onCommand: (name: CommandName) => void;
  onClose: () => void;
}

/** Scale the fixed 1280 x 720 stage to fit its container. Re-renders only on resize. */
function useFit() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0) setScale(Math.max(0.2, Math.min(w / STAGE_W, h / STAGE_H)));
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

/** The flight screen. Pure: shows what the props say and reports what the player pressed. */
export function CockpitView({ frame, state, battery = [], link = [], onFly, onCommand, onClose }: CockpitViewProps) {
  const { ref, scale } = useFit();
  const input = useMemo(() => sceneInputFromFrame(frame), [frame]);
  const segments = segmentStatus(frame);
  const speed = frame?.speed ?? "paused";
  const ended = Boolean(frame?.report);
  const [muted, setMutedState] = useState(isMuted);

  // Keyboard: space toggles pause, F fast forward, D detail (only while flying).
  useEffect(() => {
    if (!frame || ended) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button,input,select,textarea")) return;
      if (e.key === " ") { e.preventDefault(); onFly(speed === "paused" ? "resume" : "pause"); }
      else if (e.key === "f" || e.key === "F") onFly("fast");
      else if (e.key === "d" || e.key === "D") onFly("resume");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frame, ended, speed, onFly]);

  return (
    <div className="ck" ref={ref} data-testid="screen" aria-label="Step 6: fly the mission">
      <div className="ck-fit" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="ck-stage" style={{ transform: `scale(${scale})` }}>
          <SpaceCanvas input={input} />
          <svg className="ck-hull" viewBox="0 0 1280 720" aria-hidden="true">
            <defs>
              <linearGradient id="ck-hg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1b2435" /><stop offset=".56" stopColor="#121826" /><stop offset="1" stopColor="#0b0f18" />
              </linearGradient>
              <linearGradient id="ck-gl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".07" /><stop offset=".5" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path fill="url(#ck-hg)" fillRule="evenodd" d="M0 0H1280V720H0Z M96 36H1184Q1216 36 1222 66L1262 372Q1266 400 1238 400H42Q14 400 18 372L58 66Q64 36 96 36Z" />
            <path fill="url(#ck-gl)" d="M96 36H432L388 400H42Q14 400 18 372L58 66Q64 36 96 36Z" />
            <path fill="none" stroke="#2b3852" strokeWidth="2" d="M96 36H1184Q1216 36 1222 66L1262 372Q1266 400 1238 400H42Q14 400 18 372L58 66Q64 36 96 36Z" />
            <polygon fill="#141b29" points="432,36 448,36 404,400 388,400" />
            <polygon fill="#141b29" points="832,36 848,36 892,400 876,400" />
            <path stroke="#2b3852" strokeWidth="1.5" d="M432 36L388 400M848 36L892 400" />
          </svg>

          <div className="ck-hud-l">
            <b>{(state?.mission.name ?? "Earth Watch").toUpperCase()} · {state?.mission.id ?? "EW-1"}</b>
            <span data-testid="clock">{frame ? `WEEK ${pad(frame.week)} / 52 · DAY ${pad(frame.day, 3)}` : "WEEK 00 / 52 · READY FOR LAUNCH"}</span>
          </div>
          <div className="ck-hud-r">ILLUSTRATIVE VALUES</div>
          {frame?.alert && !ended && (
            <div className="ck-alert" role="alert" data-testid="alert"><span>ALERT</span> {frame.alert.title}</div>
          )}

          {!frame && (
            <div className="ck-launch">
              <div className="ck-eyebrow">STEP 6 · IMPLEMENT</div>
              <p>The CubeSat is on the launcher. Launch it and watch it work for a year: one image of the region every week.</p>
              <button type="button" className="ck-cmd ck-primary" onClick={() => onFly("launch")}>LAUNCH</button>
            </div>
          )}

          {frame?.report && (
            <ReportCard report={frame.report} week={frame.week} onRetry={() => onFly("retry")} onChangeDesign={onClose} />
          )}

          <div className="ck-console">
            <StatusScreens frame={frame} state={state} battery={battery} link={link} />
            <CommandDeck frame={frame} onCommand={onCommand} />
          </div>

          <div className="ck-bottom">
            <div className="ck-speed" role="group" aria-label="Simulation speed">
              {([["resume", "detail", "DETAIL"], ["fast", "fast", "FAST"], ["pause", "paused", "PAUSE"]] as const).map(([action, s, label]) => (
                <button key={action} type="button" className="ck-sbtn" data-action={action}
                  aria-pressed={frame ? speed === s : false} disabled={!frame || ended}
                  onClick={() => onFly(action)}>{label}</button>
              ))}
            </div>
            <ol className="ck-segs" aria-label="Mission segments">
              {segments.map((s) => (
                <li key={s.segment} data-s={s.tone} data-lit={s.lit} data-testid={`segment-${s.segment}`}>
                  <b>{s.label}</b><span>{s.state}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="ck-sbtn" aria-pressed={!muted}
              onClick={() => { setMuted(!muted); setMutedState(!muted); }}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
            <button type="button" className="ck-sbtn" onClick={onClose} aria-label="Back to the ship (Escape)">SHIP · ESC</button>
          </div>
        </div>
      </div>
    </div>
  );
}
