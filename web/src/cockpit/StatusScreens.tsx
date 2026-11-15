import type { ReactNode } from "react";
import type { MissionState, SimFrame, WeekState } from "../bridge/types";
import type { LinkSample } from "./frameStore";
import {
  WEEK_WORDS, attitudeStatus, imagingStatus, linkStatus, missionStatus, pad, powerStatus, thermalStatus,
  type PanelStatus,
} from "./status";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function Panel({ id, title, status, value, sub, children }: {
  id: string; title: string; status: PanelStatus; value: string; sub: string; children: ReactNode;
}) {
  return (
    <section className="ck-scr" data-s={status.tone} data-testid={`panel-${id}`} aria-label={`${title}: ${status.chip}, ${value}`}>
      <header><h3>{title}</h3><span className="ck-chip">{status.chip}</span></header>
      <div className="ck-val">{value}</div>
      <div className="ck-sub">{sub}</div>
      <div className="ck-gfx">{children}</div>
    </section>
  );
}

const IDLE: PanelStatus = { tone: "idle", chip: "STANDBY" };

export function WeekGrid({ weeks, className = "ck-grid52", label }: { weeks: WeekState[]; className?: string; label: string }) {
  const cells = Array.from({ length: 52 }, (_, i) => weeks[i] ?? "");
  const count = (s: WeekState) => cells.filter((c) => c === s).length;
  return (
    <div className={className} role="img" data-testid="week-grid"
      aria-label={`${label}: ${count("sent")} delivered, ${count("held")} waiting, ${count("lost")} lost`}>
      {cells.map((s, i) => (
        <i key={i} className={s || undefined} data-state={s || "future"} title={`Week ${i + 1}: ${WEEK_WORDS[s]}`} />
      ))}
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  const v = values.length ? values : [0];
  const pts = v.map((b, i) => `${(i * 168) / Math.max(1, v.length - 1)},${(38 - clamp(b, 0, 100) * 0.36).toFixed(1)}`);
  const lastPt = pts[pts.length - 1]!.split(",");
  return (
    <svg viewBox="0 0 168 40" preserveAspectRatio="none" aria-hidden="true">
      <path className="ck-spark-grid" d="M0 11H168M0 21H168M0 31H168" />
      <path className="ck-spark-area" d={`M0,40 L${pts.join(" L")} L${lastPt[0]},40 Z`} />
      <polyline className="ck-spark-line" points={pts.join(" ")} />
      <circle className="ck-spark-dot" r="2.6" cx={lastPt[0]} cy={lastPt[1]} />
    </svg>
  );
}

function resource(state: MissionState | null, kind: string) {
  const r = state?.resources.find((x) => x.kind === kind);
  return r && r.known ? `${r.used}/${r.available} ${r.unit}` : "—";
}

export function StatusScreens({ frame, state, battery, link }: {
  frame: SimFrame | null; state: MissionState | null; battery: number[]; link: LinkSample[];
}) {
  const f = frame;
  const reserve = state?.requirements.find((r) => r.id === "reserve");
  if (!f) {
    return (
      <div className="ck-screens">
        {["POWER", "ATTITUDE", "DATA LINK", "THERMAL", "IMAGING", "MISSION"].map((t) => (
          <Panel key={t} id={t.toLowerCase().replace(" ", "")} title={t} status={IDLE} value="—" sub="waiting for launch">
            {t === "IMAGING" ? <WeekGrid weeks={[]} label="Weeks" /> : null}
          </Panel>
        ))}
      </div>
    );
  }
  const ps = powerStatus(f.battery);
  const as = attitudeStatus(f.pointingError);
  const ls = linkStatus(f);
  const paused = f.commands.some((c) => (c.name === "pauseCamera" || c.name === "safeMode") && c.active);
  const q = f.storageQueue;
  const queue = `queue: ${q === 0 ? "empty" : `${q} image${q === 1 ? "" : "s"}`}`;
  return (
    <div className="ck-screens">
      <Panel id="power" title="POWER" status={ps} value={`${Math.round(f.battery)}%`}
        sub={paused ? "camera off · charging" : "battery charge"}>
        <Spark values={battery.length ? battery : [f.battery]} />
      </Panel>
      <Panel id="attitude" title="ATTITUDE" status={as} value={`${f.pointingError.toFixed(1)}°`} sub="pointing error">
        <div className="ck-track">
          <div className="ck-band" style={{ left: "33.3%", width: "33.4%" }} />
          <div className={`ck-mark${as.tone !== "ok" ? " ck-mark--drift" : ""}`}
            style={{ left: `${50 + clamp(f.pointingError / 3) * 46}%` }} />
        </div>
        <div className="ck-scale"><span>−3°</span><span>0</span><span>+3°</span></div>
      </Panel>
      <Panel id="datalink" title="DATA LINK" status={ls} value={f.contact ? "LINK UP" : ls.tone === "crit" ? "OFFLINE" : "NO LINK"}
        sub={f.contact ? `link ${Math.round(f.linkQuality)}% · ${queue}` : queue}>
        <div className="ck-strip" aria-hidden="true">
          {link.map((s, i) => (
            <i key={i} className={s.up ? "up" : s.down ? "down" : undefined}
              style={{ left: `${(i / 42) * 100}%`, width: `${100 / 42 + 0.4}%` }} />
          ))}
          <div className="ck-now" />
        </div>
        <div className="ck-scale"><span>earlier</span><span>passes</span><span>now</span></div>
      </Panel>
      <Panel id="thermal" title="THERMAL" status={thermalStatus(f.cameraTemp)} value={`${Math.round(f.cameraTemp)} °C`} sub="camera bay">
        <div className="ck-track">
          <div className="ck-band" style={{ left: "25%", width: "41.7%" }} />
          <div className="ck-mark" style={{ left: `${clamp((f.cameraTemp + 10) / 60) * 100}%` }} />
        </div>
        <div className="ck-scale"><span>−10</span><span>safe range</span><span>50 °C</span></div>
      </Panel>
      <Panel id="imaging" title="IMAGING" status={imagingStatus(f)} value={`${pad(f.imagesDelivered)} / 52`}
        sub={`delivered · ${f.imagesLost} lost`}>
        <WeekGrid weeks={f.weeks} label="Weeks" />
      </Panel>
      <Panel id="mission" title="MISSION" status={missionStatus(f)}
        value={`${Math.round(f.report ? f.report.successRate : f.projectedSuccess)}%`}
        sub={f.report ? "final success" : "projected success"}>
        <div className="ck-kv">
          <div><span>Mass</span><b>{resource(state, "mass")}</b></div>
          <div><span>Budget reserve</span><b>{reserve ? `${reserve.value}${reserve.unit}` : "—"}</b></div>
        </div>
      </Panel>
    </div>
  );
}
