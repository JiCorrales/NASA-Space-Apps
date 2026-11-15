import { PixelButton } from "../../ui";
import type { Attempt, LoseReason, RunResult } from "../types";
import { DESIGN_FIXTURES } from "..";
import { Icon } from "./Icon";

/** The fixture a recorded design came from, else the design Act 1 handed over. */
const designName = (a: Attempt): string => DESIGN_FIXTURES.find((f) => JSON.stringify(f.design) === JSON.stringify(a.design))?.name.concat(" satellite") ?? "your design";

const WHY: Record<LoseReason, string> = {
  "window-closed": "The window home closed before the mission list was finished.",
  "resource-exhausted": "A vital resource ran out.",
  "crew-lost": "Nobody was left able to work.",
};

/** The end of a run: what happened and why, the score in its four parts, the causes, and the attempts so far. */
export function ResultCard({ result, attempts, onAgain, onSame }: { result: RunResult; attempts: Attempt[]; onAgain: () => void; onSame: () => void }) {
  const won = result.outcome === "won";
  const c = result.score.components;
  return (
    <div className="result" role="dialog" aria-modal="true" aria-labelledby="result-title" data-outcome={result.outcome}>
      <div className="result__card">
        <h2 id="result-title" className="result__title"><Icon name={won ? "task_done" : "task_failed"} large /> {won ? "MISSION COMPLETE" : "MISSION LOST"} <small>ended on sol {result.endedOnSol}</small></h2>
        <p className="result__why">{won ? "The whole mission list was done before the window closed." : result.loseReason ? WHY[result.loseReason] : "The run ended."}</p>
        <div className="result__cols">
          <section aria-label="Score">
            <h3>SCORE <b>{result.score.total}</b></h3>
            <ul className="result__parts">
              <li><span>Tasks completed ({result.score.tasksCompleted}/{result.score.tasksTotal})</span><b>{c.tasks}</b></li>
              <li><span>Science delivered ({result.score.scienceDelivered.sites} sites, {result.score.scienceDelivered.megabits} Mb)</span><b>{c.science}</b></li>
              <li><span>Resources left</span><b>{c.resources}</b></li>
              <li><span>Decisions under pressure</span><b>{c.decisions}</b></li>
            </ul>
            <h3>PER ROLE</h3>
            <ul className="result__roles">{result.score.perRole.map((r) => <li key={r.player}>{r.line}</li>)}</ul>
          </section>
          <section aria-label="Causes">
            <h3>WHAT HAPPENED</h3>
            <ul className="result__causes">
              {result.tasks.map((t) => <li key={t.id}><Icon name={t.done ? "task_done" : t.failed ? "task_failed" : "task_todo"} /> {t.name}: {t.done ? `done on sol ${t.doneOnSol}` : "not done"}</li>)}
              {result.causes.map((x, i) => <li key={i}>{new RegExp(`^Sol ${x.sol}\\b`).test(x.text) ? x.text : `Sol ${x.sol}: ${x.text}`}</li>)}
              {result.score.decisions.lines.map((l, i) => <li key={`d${i}`}>{l}</li>)}
            </ul>
          </section>
        </div>
        <section aria-label="Attempts">
          <h3>ATTEMPTS</h3>
          <table className="result__hist">
            <thead><tr><th scope="col">#</th><th scope="col">Design</th><th scope="col">Outcome</th><th scope="col">Ended on sol</th><th scope="col">What ended it</th></tr></thead>
            <tbody>{attempts.slice(-6).map((a, i, all) => (
              <tr key={a.id}><td>{attempts.length - all.length + i + 1}</td><td>{designName(a)}</td><td>{a.result.outcome}</td><td>{a.result.endedOnSol}</td>
                <td>{a.result.outcome === "won" ? "Mission list done" : a.result.loseReason ? WHY[a.result.loseReason] : "Run ended"}</td></tr>
            ))}</tbody>
          </table>
        </section>
        <div className="result__btns">
          <PixelButton primary onClick={onAgain}>TRY AGAIN (NEW SEED)</PixelButton>
          <PixelButton onClick={onSame}>SAME RUN AGAIN (SAME SEED)</PixelButton>
        </div>
      </div>
    </div>
  );
}
