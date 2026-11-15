// One player's panel. It renders ONLY that player's PlayerView: when the communicator is down `shared` and `plans`
// are null, so there is nothing to show of the resources, the tasks, the forecast or the others' plans, and the
// panel says so. The screen never computes a rule: every number below comes from the view.
import { useRef, useState } from "react";
import { SourceTag } from "../../ui";
import type { Source } from "../../bridge/types";
import type { ActivityId, ActivityOption, CrewSetup, EveningView, GaugeView, PlayerView, SolEvent, Target } from "../types";
import { ACTIVITY_ICON, GAUGE_ICON, Icon, Portrait, RESOURCE_ICON } from "./Icon";
import { MapCanvas } from "./MapCanvas";
import type { SceneInput } from "./MapScene";
import type { MarsRun } from "./useMarsRun";

const ROLE_NAME = { commander: "Commander", engineer: "Engineer", scientist: "Scientist", comms: "Comms officer" } as const;

/** A tag from the rules is a data-table row id or "team"; the page shows the word and the row. */
export const asSource = (tag: string): Source => (tag === "team"
  ? { status: "team", text: "A game-balance value chosen by the team (illustrative), not a NASA figure." }
  : { status: "nasa", text: `Mars surface data table, row ${tag}.` });

const targetName = (view: PlayerView, t: Target): string => {
  switch (t.kind) {
    case "module": return view.shared?.modules.find((m) => m.id === t.id)?.name ?? t.id;
    case "site": return view.shared?.sites.find((s) => s.id === t.id)?.name ?? view.surroundings.objects.find((o) => o.id === t.id)?.label ?? t.id;
    case "player": return view.shared?.crew.find((c) => c.id === t.id)?.name ?? `crew ${t.id}`;
    case "tile": return `tile ${t.x},${t.y}`;
    default: return "";
  }
};
const optionName = (view: PlayerView, id: ActivityId) => view.options.find((o) => o.id === id)?.name ?? id;

function Gauge({ g }: { g: GaugeView }) {
  return (
    <li className="gauge" data-low={g.low} title={`${g.label}: ${g.value} of ${g.max} ${g.unit}`}>
      <Icon name={GAUGE_ICON[g.id]} />
      <span className="gauge__label">{g.label.split(" ")[0]}</span>
      <span className="gauge__track" role="meter" aria-label={g.label} aria-valuemin={0} aria-valuemax={g.max} aria-valuenow={g.value}
        aria-valuetext={`${g.value} of ${g.max} ${g.unit}${g.low ? ", low" : ""}`}>
        <span className="gauge__fill" style={{ width: `${Math.round(Math.max(0, Math.min(1, g.good)) * 100)}%` }} />
      </span>
      <span className="gauge__val">{g.value}{g.unit === "points" ? "" : ` ${g.unit}`}{g.low ? " LOW" : ""}</span>
      <SourceTag source={asSource(g.source)} />
    </li>
  );
}

/** Two or three gauges always visible (the ones in the worst shape, so trouble shows); the rest behind a button. */
function Gauges({ gauges }: { gauges: GaugeView[] }) {
  const [all, setAll] = useState(false);
  const worst = [...gauges].sort((a, b) => a.good - b.good).slice(0, 3).map((g) => g.id);
  const shown = all ? gauges : gauges.filter((g) => worst.includes(g.id));
  return (
    <section className="sec" aria-label="Health gauges">
      <h3 className="sec__t">HEALTH <button type="button" className="mini" aria-expanded={all} onClick={() => setAll(!all)}>{all ? "FEWER" : `ALL ${gauges.length}`}</button></h3>
      <ul className="gauges">{shown.map((g) => <Gauge key={g.id} g={g} />)}</ul>
    </section>
  );
}

function Picker({ view, onPick, onClose }: { view: PlayerView; onPick: (a: ActivityId, t: Target) => void; onClose: () => void }) {
  const [opt, setOpt] = useState<ActivityOption | null>(null);
  const tileTargets = (): Target[] => [
    ...(view.shared?.sites.map((s) => ({ kind: "tile" as const, ...s.pos })) ?? []),
    ...view.surroundings.objects.filter((o) => o.kind !== "player").map((o) => ({ kind: "tile" as const, ...o.pos })),
    ...(view.shared ? [{ kind: "tile" as const, ...view.shared.map.base }] : []),
  ];
  const pick = (o: ActivityOption) => {
    if (o.targetKind === "none") return onPick(o.id, { kind: "none" });
    setOpt(o);
  };
  const targets = opt ? (opt.targetKind === "tile" ? tileTargets() : opt.targets) : [];
  return (
    <div className="picker" role="dialog" aria-label={`Choose an activity for ${view.self.name}`}>
      <h3 className="sec__t">{opt ? `${opt.name.toUpperCase()}: WHERE?` : "CHOOSE AN ACTIVITY"} <button type="button" className="mini" onClick={() => (opt ? setOpt(null) : onClose())}>{opt ? "BACK" : "CLOSE"}</button></h3>
      <ul className="picker__list">
        {!opt && view.options.map((o) => (
          <li key={o.id}>
            <button type="button" className="opt" disabled={!!o.blocked} onClick={() => pick(o)} title={o.summary}>
              <Icon name={ACTIVITY_ICON[o.id]} />
              <span className="opt__name">{o.name}</span>
              <span className="opt__tag">{o.blocked ? `BLOCKED: ${o.blocked}` : o.skilled ? "SKILLED" : "SLOWER"}</span>
            </button>
          </li>
        ))}
        {opt && targets.map((t, i) => (
          <li key={i}>
            <button type="button" className="opt" onClick={() => onPick(opt.id, t)}>
              <span className="opt__name">{targetName(view, t) || "Here"}</span>
            </button>
          </li>
        ))}
        {opt && targets.length === 0 && <li className="note">Nothing to pick here.</li>}
      </ul>
    </div>
  );
}

export interface PanelProps {
  run: MarsRun;
  index: 0 | 1 | 2 | 3;
  roster: CrewSetup[];
}

export function Panel({ run, index, roster }: PanelProps) {
  const view = run.views[index];
  const flash = useRef<HTMLElement>(null);
  const [picking, setPicking] = useState(false);
  if (!view) return null;
  const self = view.self, linked = self.linked, out = self.status === "out";
  const me = run.controlled[index]!;
  const showEvening = (run.phase === "evening" || run.phase === "ended") && run.evening;
  const ev: EveningView | null = showEvening ? run.evening![index]! : null;
  const waiting = run.waitingFor.includes(self.id);
  const input: SceneInput = {
    view, roster, after: run.after?.[index] ?? null, report: run.report, playId: run.playId, reduced: run.reduced, speed: run.speed, phase: run.phase,
    reveals: !linked ? [] : run.reveals.filter((r) => r.player !== self.id).map((r) => ({ player: r.player, paths: r.paths })),
    onBeat: (e: SolEvent) => {
      run.sceneBeat(index, e);
      const el = flash.current; if (!el) return;
      if (e.kind === "gauge" || e.kind === "hazard") { el.dataset.flash = e.kind; setTimeout(() => { delete el.dataset.flash; }, 600); }
    },
    onDone: () => run.sceneDone(index),
  };
  const did = showEvening ? run.report?.choices.find((c) => c.player === self.id) ?? null : null;
  const myPlan = did ?? view.myChoice ?? null;
  const reveal = linked ? run.reveals.filter((r) => r.player !== self.id) : [];
  const lead = run.phase === "briefing" || run.phase === "choosing";
  return (
    <section ref={flash} className="mp" data-link={linked ? "up" : "down"} data-out={out} data-controlled={me} aria-label={`${self.name}, ${ROLE_NAME[self.role]}`}>
      <header className="mp__head">
        <Portrait look={self.look} role={self.role} />
        <div className="mp__who"><h2>{self.name}</h2><span>{ROLE_NAME[self.role]}{out ? " - OUT" : ""}{me ? " - YOU" : " - DEMO"}</span></div>
        <div className="mp__link" role="status" data-state={linked ? "up" : "down"}>
          <Icon name={linked ? "link_linked" : "link_cutoff"} large />
          <b>{linked ? "LINK UP" : "LINK DOWN"}</b>
        </div>
      </header>
      <div className="mp__body">
        <div className="mp__map">
          <MapCanvas input={input} label={`Map around ${self.name}. ${linked ? "Shared map of the team." : "Only what is around them."}`} />
          <span className="mp__tag mp__tag--sky"><Icon name={view.surroundings.sky === "clear" ? "sol" : "dust_storm"} /> {view.surroundings.sky.toUpperCase()}</span>
          {!linked && <span className="mp__tag mp__tag--down"><Icon name="link_cutoff" /> LOCAL VIEW ONLY</span>}
          <section className="mp__brief" aria-label={showEvening ? "Evening report" : "Briefing"}>
            <h3 className="sec__t">{showEvening ? `EVENING, SOL ${ev?.sol ?? ""}` : `BRIEFING, SOL ${view.sol}`}</h3>
            <ul className="lines">{(ev ? ev.lines : view.briefing).slice(0, 3).map((l, i) => <li key={i}>{l}</li>)}</ul>
          </section>
          {reveal.length > 0 && <div className="mp__reveal" role="status">{reveal.map((r) => <p key={r.player}><Icon name="link_restored" /> <b>{r.name} IS BACK.</b> They were alone: {r.lines.slice(0, 2).join(" ")}</p>)}</div>}
        </div>
        <div className="mp__side">
          {picking && me ? <Picker view={view} onClose={() => setPicking(false)} onPick={(a, t) => { run.choose(self.id, a, t); setPicking(false); }} /> : (<>
            <Gauges gauges={self.gauges} />
            <section className="sec choice" aria-label="Chosen activity">
              {me ? (
                <>
                  <button type="button" className="pxbtn pxbtn--primary pick-btn" disabled={out || !lead} onClick={() => setPicking(true)}>{myPlan ? "CHANGE ACTIVITY" : "CHOOSE ACTIVITY"}</button>
                  <button type="button" className="mini" disabled={out || !waiting} onClick={() => run.letDemoChoose(self.id)}>LET THE DEMO CHOOSE</button>
                </>
              ) : null}
              <p className="mychoice"><Icon name={myPlan ? ACTIVITY_ICON[myPlan.activity] : "task_hidden"} /> {out ? "Out for the rest of the run." : did ? `Did: ${optionName(view, did.activity)}${did.target.kind !== "none" ? `: ${targetName(view, did.target)}` : ""}` : myPlan ? `${optionName(view, myPlan.activity)}${myPlan.target.kind !== "none" ? `: ${targetName(view, myPlan.target)}` : ""}` : waiting ? "Waiting for you to choose." : "Not chosen yet."}</p>
            </section>
            {linked && view.shared ? (
              <>
                <section className="sec" aria-label="Shared resources">
                  <h3 className="sec__t">RESOURCES</h3>
                  <ul className="res6">{view.shared.resources.map((r) => (
                    <li key={r.kind} title={`${r.label}: ${r.detail} (source ${r.source})`} aria-label={`${r.label} ${r.value} ${r.unit}`}><Icon name={RESOURCE_ICON[r.kind]} /><span><b>{r.value}</b> <small>{r.unit.split(" ")[0]}</small></span></li>
                  ))}</ul>
                  {view.shared.forecast.map((w) => <p key={w.hazard + w.inSols} className="warn"><Icon name="dust_storm" /> {w.text}</p>)}
                </section>
                <section className="sec" aria-label="Task list">
                  <h3 className="sec__t">TASKS</h3>
                  <ul className="tasks">{view.shared.tasks.map((t) => (
                    <li key={t.id} data-done={t.done}><Icon name={t.failed ? "task_failed" : t.done ? "task_done" : t.progress > 0 ? "task_progress" : "task_todo"} /><span>{t.name}</span><b>{t.done ? "DONE" : `${t.progress}/${t.total}`}</b></li>
                  ))}</ul>
                </section>
                <section className="sec" aria-label="Plans of the others">
                  <h3 className="sec__t">THEIR PLANS</h3>
                  <ul className="plans">{(view.plans ?? []).map((p) => (
                    <li key={p.player}><Icon name={ACTIVITY_ICON[p.activity]} /><span><b>{roster[p.player]?.name ?? `P${p.player}`}</b> {optionName(view, p.activity)}{p.target.kind !== "none" ? `: ${targetName(view, p.target)}` : ""}</span></li>
                  ))}
                    {(view.plans ?? []).length === 0 && <li className="note">No plans yet.</li>}
                    {view.shared.crew.filter((c) => c.id !== self.id && !c.linked).map((c) => <li key={c.id} className="note"><Icon name="link_cutoff" /> {c.name}: no contact, plan unknown</li>)}
                  </ul>
                </section>
              </>
            ) : (
              <section className="sec nolink" aria-label="No shared data">
                <h3 className="sec__t"><Icon name="link_cutoff" /> NO SHARED DATA</h3>
                <p>No resources, forecast, task list or plans of the others. You see only what is around you and your own gauges.</p>
              </section>
            )}
          </>)}
        </div>
      </div>
    </section>
  );
}
