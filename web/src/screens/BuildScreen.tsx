import type { MissionState, Requirement } from "../bridge/types";
import { ScreenFrame } from "../ui";
import { GroupPicker } from "./parts/GroupPicker";
import { IssueList } from "./parts/IssueList";
import { ResourceList } from "./parts/ResourceList";
import { StepFooter } from "./parts/StepFooter";
import { defaultSend, type Send } from "./send";

const VERDICT = (r: Requirement) =>
  r.verified === true ? "VERIFIED" : r.verified === false ? "NOT VERIFIED" : "NOT CHECKED YET";

/** Step 5, build and verify: the tests to run, the reserve to keep, and which requirements that verifies. */
export function BuildScreen({ state, send = defaultSend }: { state: MissionState; send?: Send }) {
  const reserve = state.reserve;
  const percent = reserve === undefined ? null : Math.round(reserve * 100);
  return (
    <ScreenFrame step="build" title="5 Build and verify" footer={<StepFooter step="build" send={send} />}>
      <div className="build">
        <div className="build__left">
          <GroupPicker state={state} group="tests" send={send} heading="h2" />
          <section className="reserve" aria-labelledby="reserve-title">
            <h2 id="reserve-title" className="section-title">Budget reserve</h2>
            <div className="adjust">
              <span className="num muted" aria-hidden="true">0%</span>
              <input type="range" min={0} max={100} step={1} value={percent ?? 0} aria-labelledby="reserve-title"
                aria-valuetext={percent === null ? "not set yet" : `${percent}%`}
                onChange={(e) => send("setReserve", { fraction: Number(e.target.value) / 100 })} />
              <span className="num muted" aria-hidden="true">100%</span>
              <span className="num num--big">{percent === null ? "not set yet" : `${percent}%`}</span>
            </div>
          </section>
          <section aria-labelledby="build-resources">
            <h2 id="build-resources" className="section-title">Resources</h2>
            <ResourceList resources={state.resources} only={["budget", "time"]} />
          </section>
        </div>
        <div className="build__right">
          <table className="console">
            <caption className="section-title">Requirements verified</caption>
            <thead>
              <tr><th scope="col">Requirement</th><th scope="col">Value</th><th scope="col">Check</th><th scope="col">State</th></tr>
            </thead>
            <tbody>
              {state.requirements.map((r) => (
                <tr key={r.id} data-verified={r.verified === undefined ? "unknown" : String(r.verified)}>
                  <th scope="row">{r.label}</th>
                  <td><span className="num">{r.value}</span> {r.unit}</td>
                  <td>{r.check}</td>
                  <td className="verdict">{VERDICT(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <IssueList issues={state.issues} step="build" />
        </div>
      </div>
    </ScreenFrame>
  );
}
