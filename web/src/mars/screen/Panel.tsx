// One player's panel. It renders ONLY that player's PlayerView: when the communicator is down `shared` and `plans`
// are null, so there is nothing to show of the resources, the tasks, the forecast or the others' plans, and the
// panel says so. The screen never computes a rule: every number below comes from the view.
//
// What is always in sight: portrait and link state, the map (the biggest thing), three gauges, the chosen activity
// and, when linked, a compact row of resources and tasks. One tap away: all gauges, the others' plans in full, the
// report text, the activity picker and the detail of a source tag. Nothing scrolls inside a panel.
import { useRef, useState } from "react";
import { SourceTag } from "../../ui";
import type { Source } from "../../bridge/types";
import type { ActivityId, ActivityOption, CrewSetup, GaugeView, PlayerView, SolEvent, Target } from "../types";
import { applyGauges, gaugePct, gaugeText } from "./gaugeDom";
import { ACTIVITY_ICON, GAUGE_ICON, Icon, Portrait, RESOURCE_ICON } from "./Icon";
import { MapCanvas } from "./MapCanvas";
import type { SceneInput } from "./MapScene";
import type { MarsRun } from "./useMarsRun";

export const ROLE_NAME = { commander: "Commander", engineer: "Engineer", scientist: "Scientist", comms: "Comms officer" } as const;

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
const iconOf = (id: ActivityId) => ACTIVITY_ICON[id] ?? "plan";
const what = (view: PlayerView, a: ActivityId, t: Target) => `${optionName(view, a)}${t.kind !== "none" ? `: ${targetName(view, t)}` : ""}`;

function GaugeRow({ g, full = false }: { g: GaugeView; full?: boolean }) {
  return (
    <li className="gauge" data-gauge={g.id} data-low={g.low} title={`${g.label}: ${g.value} of ${g.max} ${g.unit}`}>
      <Icon name={GAUGE_ICON[g.id]} />
      {full && <span className="gauge__label">{g.label}</span>}
      <span className="gauge__track" role="meter" aria-label={g.label} aria-valuemin={0} aria-valuemax={g.max} aria-valuenow={g.value}
        aria-valuetext={`${g.value} of ${g.max} ${g.unit}${g.low ? ", low" : ""}`}>
        <span className="gauge__fill" style={{ width: `${gaugePct(g)}%` }} />
      </span>
      <span className="gauge__val">{gaugeText(g)}</span>
      <SourceTag source={asSource(g.source)} />
    </li>
  );
}

function Picker({ view, onPick }: { view: PlayerView; onPick: (a: ActivityId, t: Target) => void }) {
  const [opt, setOpt] = useState<ActivityOption | null>(null);
  const tileTargets = (): Target[] => [
    ...(view.shared?.sites.map((s) => ({ kind: "tile" as const, ...s.pos })) ?? []),
    ...view.surroundings.objects.filter((o) => o.kind !== "player").map((o) => ({ kind: "tile" as const, ...o.pos })),
    ...(view.shared ? [{ kind: "tile" as const, ...view.shared.map.base }] : []),
  ];
  const targets = opt ? (opt.targetKind === "tile" ? tileTargets() : opt.targets) : [];
  return (
    <>
      {opt && <p className="detail__sub">{opt.name}: where? <button type="button" className="mini" onClick={() => setOpt(null)}>BACK</button></p>}
      <ul className="picker__list">
        {!opt && view.options.map((o) => (
          <li key={o.id}>
            <button type="button" className="opt" disabled={!!o.blocked} title={o.summary}
              onClick={() => (o.targetKind === "none" ? onPick(o.id, { kind: "none" }) : setOpt(o))}>
              <span className="opt__top"><Icon name={iconOf(o.id)} /><span className="opt__name">{o.name}</span>{!o.blocked && <span className="opt__tag">{o.skilled ? "SKILLED" : "SLOWER"}</span>}</span>
              {o.blocked && <span className="opt__why" title={o.blocked}>BLOCKED: {o.blocked}</span>}
            </button>
          </li>
        ))}
        {opt && targets.map((t, i) => (
          <li key={i}><button type="button" className="opt" onClick={() => onPick(opt.id, t)}><span className="opt__name">{targetName(view, t) || "Here"}</span></button></li>
        ))}
        {opt && targets.length === 0 && <li className="note">Nothing to pick here.</li>}
      </ul>
    </>
  );
}

export interface PanelProps {
  run: MarsRun;
  index: 0 | 1 | 2 | 3;
  roster: CrewSetup[];
  /** In the tabbed (narrow) layout only the shown panel is visible; all four stay mounted so every map keeps playing. */
  shown?: boolean;
}

type Detail = null | "gauges" | "plans" | "report" | "pick";

export function Panel({ run, index, roster, shown = true }: PanelProps) {
  const view = run.views[index];
  const root = useRef<HTMLElement>(null);
  const [detail, setDetail] = useState<Detail>(null);
  if (!view) return null;
  const self = view.self, linked = self.linked, out = self.status === "out";
  const me = run.controlled[index]!;
  const showEvening = (run.phase === "evening" || run.phase === "ended") && run.evening;
  const ev = showEvening ? run.evening![index]! : null;
  const waiting = run.waitingFor.includes(self.id);
  const lead = run.phase === "briefing" || run.phase === "choosing";
  const did = showEvening ? run.report?.choices.find((c) => c.player === self.id) ?? null : null;
  const myPlan = did ?? view.myChoice ?? null;
  const changed = run.revised.includes(self.id) && lead;
  const reveal = linked ? run.reveals.filter((r) => r.player !== self.id) : [];
  const plans = view.plans ?? [];
  const planChanged = plans.filter((p) => run.revised.includes(p.player)).length;
  const worst = [...self.gauges].sort((a, b) => a.good - b.good).slice(0, 3).map((g) => g.id);
  const input: SceneInput = {
    view, roster, after: run.after?.[index] ?? null, report: run.report, playId: run.playId, reduced: run.reduced, speed: run.speed, phase: run.phase,
    reveals: !linked ? [] : reveal.map((r) => ({ player: r.player, paths: r.paths })),
    onBeat: (e: SolEvent) => {
      run.sceneBeat(index, e);
      const el = root.current; if (!el) return;
      if (e.kind === "gauge" && e.players.includes(self.id) && run.after?.[index]) {
        const next = run.after[index]!.self.gauges;
        // the rules name the gauge and its new value; without them every gauge moves to its value after the sol
        const one = e.gauge !== undefined && e.value !== undefined ? next.find((g) => g.id === e.gauge) : undefined;
        if (one && e.value !== undefined) { const good = one.id === "radiation" ? 1 - e.value / one.max : e.value / one.max; applyGauges(el, [{ ...one, value: e.value, good, low: e.value === one.value ? one.low : good < 0.3 }]); }
        else applyGauges(el, next);
      }
      if (e.kind === "hazard") { el.dataset.flash = "hazard"; setTimeout(() => { delete el.dataset.flash; }, 600); }
    },
    onDone: () => run.sceneDone(index),
  };
  const brief = ev ? ev.lines.slice(0, 1) : view.briefing.slice(0, 2);
  const close = <button type="button" className="mini" onClick={() => setDetail(null)}>CLOSE</button>;
  return (
    <section ref={root} id={`panel-${index}`} className="mp" data-link={linked ? "up" : "down"} data-out={out} data-controlled={me} data-shown={shown}
      aria-label={`${self.name}, ${ROLE_NAME[self.role]}`}>
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
          {reveal.length > 0 && <div className="mp__reveal" role="status">{reveal.map((r) => <p key={r.player}><Icon name="link_restored" /> <b>{r.name} IS BACK.</b> They were alone: {r.lines.slice(0, 2).join(" ")}</p>)}</div>}
          <div className="mp__brief" aria-label={showEvening ? "Evening" : "Briefing"}>{brief.map((l, i) => <p key={i}>{l}</p>)}</div>
        </div>
        <div className="mp__side">
          <section aria-label="Health gauges"><ul className="gauges">{self.gauges.filter((g) => worst.includes(g.id)).map((g) => <GaugeRow key={g.id} g={g} />)}</ul></section>
          <section className="choice" aria-label="Chosen activity">
            <p className="mychoice"><Icon name={myPlan ? iconOf(myPlan.activity) : "task_hidden"} />{" "}
              {out ? "Out for the rest of the run." : did ? `Did: ${what(view, did.activity, did.target)}` : myPlan ? what(view, myPlan.activity, myPlan.target) : waiting ? "Waiting for you to choose." : "Not chosen yet."}
              {changed && !out && <b className="changed"> CHANGED</b>}
            </p>
            {me && (
              <span className="choice__btns">
                <button type="button" className="act" disabled={out || !lead} onClick={() => setDetail("pick")}>{myPlan ? "CHANGE ACTIVITY" : "CHOOSE ACTIVITY"}</button>
                <button type="button" className="act act--quiet" disabled={out || !waiting} onClick={() => run.letDemoChoose(self.id)}>LET THE DEMO CHOOSE</button>
              </span>
            )}
          </section>
          {linked && view.shared ? (
            <>
              <section aria-label="Shared resources"><ul className="res6">{view.shared.resources.map((r) => (
                <li key={r.kind} title={`${r.label}: ${r.detail} (source ${r.source})`} aria-label={`${r.label} ${r.value} ${r.unit}`}><Icon name={RESOURCE_ICON[r.kind]} /><span><b>{r.value}</b> {r.unit.split(" ")[0]}</span></li>
              ))}</ul>
                {view.shared.forecast.map((w) => <p key={w.hazard + w.inSols} className="warn"><Icon name="dust_storm" /> {w.text}</p>)}
              </section>
              <section aria-label="Task list"><ul className="tasks">{view.shared.tasks.map((t) => (
                <li key={t.id} data-done={t.done} title={t.name} aria-label={`${t.name}: ${t.done ? "done" : `${t.progress} of ${t.total}`}`}>
                  <Icon name={t.failed ? "task_failed" : t.done ? "task_done" : t.progress > 0 ? "task_progress" : "task_todo"} /><span>{t.done ? "DONE" : `${t.progress}/${t.total}`}</span>
                </li>
              ))}</ul></section>
              <section aria-label="Plans of the others"><ul className="chips">
                {plans.map((p) => (
                  <li key={p.player} title={what(view, p.activity, p.target)} data-changed={run.revised.includes(p.player)}>
                    <Icon name={iconOf(p.activity)} /><span>{roster[p.player]?.name ?? `P${p.player}`}{run.revised.includes(p.player) ? " CHANGED" : ""}</span>
                  </li>
                ))}
                {view.shared.crew.filter((c) => c.id !== self.id && !c.linked).map((c) => <li key={c.id} className="chips__cut" title="No contact: plan unknown"><Icon name="link_cutoff" /><span>{c.name} ?</span></li>)}
                {plans.length === 0 && <li className="note">No plans yet</li>}
              </ul></section>
            </>
          ) : (
            <section className="nolink" aria-label="No shared data">
              <h3><Icon name="link_cutoff" /> NO SHARED DATA</h3>
              <p>No resources, forecast, task list or plans. Only what is around you and your own gauges.</p>
            </section>
          )}
          <div className="more" role="group" aria-label="More">
            <button type="button" className="mini" onClick={() => setDetail("gauges")}>ALL GAUGES</button>
            {linked && <button type="button" className="mini" onClick={() => setDetail("plans")}>PLANS{plans.length ? ` ${plans.length}` : ""}{planChanged ? ` (${planChanged} CHANGED)` : ""}</button>}
            <button type="button" className="mini" onClick={() => setDetail("report")}>{showEvening ? "EVENING REPORT" : "REPORT"}</button>
          </div>
        </div>
        {detail && (
          <div className="detail" role="dialog" aria-label={detail === "pick" ? `Choose an activity for ${self.name}` : detail === "gauges" ? "All gauges" : detail === "plans" ? "Plans of the others" : "Report"}>
            <h3 className="detail__t">{detail === "pick" ? "CHOOSE AN ACTIVITY" : detail === "gauges" ? "ALL GAUGES" : detail === "plans" ? "THEIR PLANS" : showEvening ? `EVENING, SOL ${ev?.sol}` : `BRIEFING, SOL ${view.sol}`} {close}</h3>
            {detail === "gauges" && <ul className="gauges gauges--full">{self.gauges.map((g) => <GaugeRow key={g.id} g={g} full />)}</ul>}
            {detail === "plans" && view.shared && (
              <ul className="plans">
                {plans.map((p) => (
                  <li key={p.player}><Icon name={iconOf(p.activity)} /><span><b>{roster[p.player]?.name ?? `P${p.player}`}</b> {what(view, p.activity, p.target)}</span>{run.revised.includes(p.player) && <b className="changed">CHANGED</b>}</li>
                ))}
                {plans.length === 0 && <li className="note">No plans yet.</li>}
                {view.shared.crew.filter((c) => c.id !== self.id && !c.linked).map((c) => <li key={c.id} className="note"><Icon name="link_cutoff" /> {c.name}: no contact, plan unknown</li>)}
              </ul>
            )}
            {detail === "report" && <ul className="lines">{(ev ? ev.lines : view.briefing).map((l, i) => <li key={i}>{l}</li>)}</ul>}
            {detail === "pick" && <Picker view={view} onPick={(a, t) => { run.choose(self.id, a, t); setDetail(null); }} />}
          </div>
        )}
      </div>
    </section>
  );
}
