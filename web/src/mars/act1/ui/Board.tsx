// The mission board: the hub that replaces the 3D ship. Six step cards, the crew, the six resources, the attempts.
import type { MissionState, Step, StepStatus } from "../../../bridge/types";
import { ResourceBar } from "../../../ui";
import { stepName } from "../session";
import { ROLE_NAME } from "../crew";
import type { AttemptLine, StoredLaunch } from "../handoff";
import type { CrewSetup } from "../types";
import { Badge, Crewman } from "./sprites";

const BLURB: Record<Step, string> = {
  goals: "Mars, the relay, and where the crew lands.",
  concept: "The orbit and what the satellite does on each pass.",
  requirements: "What the crew needs, the deadline, the budget and the mass.",
  design: "Format, power, pointing, storage, instrument, radio and Deep Space Network time.",
  build: "Tests and the budget reserve.",
  fly: "Launch, the crossing, arrival and landing.",
};
const WORD: Record<StepStatus, string> = { locked: "LOCKED", open: "OPEN", done: "DONE", problem: "PROBLEM" };
/** A shape as well as a word and a border, so nothing rests on colour alone. */
const MARK: Record<StepStatus, string> = { locked: "[ ]", open: "[>]", done: "[x]", problem: "[!]" };

export function Board({ state, crew, launches, onMars, onOpen }: {
  state: MissionState; crew: CrewSetup[]; launches: StoredLaunch[]; onMars: AttemptLine[]; onOpen: (s: Step) => void;
}) {
  return (
    <section className="a1 a1-board" aria-labelledby="board-title">
      <header className="a1-head">
        <div>
          <p className="a1-kicker">Mission board</p>
          <h1 id="board-title">{state.mission.name}</h1>
        </div>
        <p className="a1-lede">{state.mission.summary}</p>
      </header>

      <div className="a1-board__grid">
        <ol className="a1-steps" aria-label="The six steps">
          {state.steps.map(({ step, status }, i) => {
            const issue = state.issues.find((x) => x.step === step && (x.severity === "critical" || x.code.endsWith(".missing")));
            return (
              <li key={step}>
                <button type="button" className="a1-step" data-status={status} disabled={status === "locked"} onClick={() => onOpen(step)}>
                  <span className="a1-step__n">{i + 1}</span>
                  <span className="a1-step__name">{stepName(step)}</span>
                  <span className="a1-step__state"><b aria-hidden="true">{MARK[status]}</b> {WORD[status]}</span>
                  <span className="a1-step__blurb">{status === "problem" ? (issue?.message ?? (step === "fly" ? "The last launch did not reach orbit. Open it to read the report and try again." : BLURB[step])) : BLURB[step]}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <aside className="a1-side">
          <section aria-labelledby="crew-h" className="a1-box">
            <h2 id="crew-h">Crew</h2>
            <ul className="a1-crew-list">
              {crew.map((c) => (
                <li key={c.name + c.role}>
                  <Crewman look={c.look} role={c.role} scale={3} label={`${c.name}, ${ROLE_NAME[c.role]}`} />
                  <span><b>{c.name}</b><br />{ROLE_NAME[c.role]} <Badge role={c.role} scale={1} /></span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="res-h" className="a1-box">
            <h2 id="res-h">Resources</h2>
            <div className="a1-res">{state.resources.map((r) => <ResourceBar key={r.kind} resource={r} />)}</div>
          </section>
        </aside>
      </div>

      <section aria-labelledby="att-h" className="a1-box a1-attempts">
        <h2 id="att-h">Attempts</h2>
        {launches.length === 0 && onMars.length === 0 ? <p className="a1-dim">None yet. Each launch and each run on Mars is listed here.</p> : (
          <ul>
            {launches.map((l) => (
              <li key={`l${l.number}`}><b>Launch {l.number}</b> <span data-outcome={l.outcome}>{l.outcome === "ok" ? "In orbit" : l.outcome === "lost" ? "Lost" : "Scrubbed"}</span> {l.cause}</li>
            ))}
            {onMars.map((a, i) => (
              <li key={`m${i}`}><b>{a.label}</b> <span>{a.outcome}</span>{a.sol !== null ? ` Ended on sol ${a.sol}.` : ""}{a.cause ? ` ${a.cause}` : ""}</li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
