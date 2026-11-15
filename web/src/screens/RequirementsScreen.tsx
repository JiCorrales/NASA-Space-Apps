import { useEffect, useState } from "react";
import type { MissionState, Requirement } from "../bridge/types";
import { ScreenFrame, SourceTag } from "../ui";
import { IssueList } from "./parts/IssueList";
import { StepFooter } from "./parts/StepFooter";
import { defaultSend, type Send } from "./send";

/** Step 3, requirements: each number the mission must meet, how it is checked, and a control to adjust it. */
export function RequirementsScreen({ state, send = defaultSend }: { state: MissionState; send?: Send }) {
  return (
    <ScreenFrame step="requirements" title="3 Requirements" footer={<StepFooter step="requirements" send={send} />}>
      <div className="reqs">
        <table className="console">
          <caption className="section-title">What the mission must meet</caption>
          <thead>
            <tr>
              <th scope="col">Requirement</th>
              <th scope="col">Value</th>
              <th scope="col">How it is checked</th>
              <th scope="col">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {state.requirements.map((r) => <RequirementRow key={r.id} req={r} send={send} />)}
          </tbody>
        </table>
        <IssueList issues={state.issues} step="requirements" />
      </div>
    </ScreenFrame>
  );
}

/** Whole units for a whole-number range up to 100 wide, else about a hundred positions; a range with a fraction
 * (pointing, 0.5 to 2) gets a power of ten that leaves about ten to a hundred positions, never a step wider than the range. */
export function stepOf(r: Pick<Requirement, "min" | "max">): number {
  const span = r.max - r.min;
  if (!(span > 0)) return 1;
  const whole = Number.isInteger(r.min) && Number.isInteger(r.max);
  if (whole) return span <= 100 ? 1 : Math.pow(10, Math.floor(Math.log10(span / 100)));
  return Math.pow(10, Math.floor(Math.log10(span / 10)));
}

function RequirementRow({ req: r, send }: { req: Requirement; send: Send }) {
  // The text field keeps what is typed until it is committed; the value shown comes from the state.
  const [draft, setDraft] = useState(String(r.value));
  useEffect(() => setDraft(String(r.value)), [r.value]);
  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) { setDraft(String(r.value)); return; }
    const v = Math.min(r.max, Math.max(r.min, n));
    setDraft(String(v));
    if (v !== r.value) send("setRequirement", { id: r.id, value: v });
  };
  const id = `req-${r.id}`;
  return (
    <tr>
      <th scope="row" id={`${id}-label`}>{r.label}</th>
      <td className="console__value">
        <span className="num num--big">{r.value}</span> {r.unit}
        {r.source && <div><SourceTag source={r.source} /></div>}
      </td>
      <td>{r.check}</td>
      <td>
        <div className="adjust">
          <span className="num muted" aria-hidden="true">{r.min}</span>
          <input type="range" min={r.min} max={r.max} step={stepOf(r)} value={r.value}
            aria-labelledby={`${id}-label`} aria-valuetext={`${r.value} ${r.unit}`}
            onChange={(e) => send("setRequirement", { id: r.id, value: Number(e.target.value) })} />
          <span className="num muted" aria-hidden="true">{r.max}</span>
          <label className="visually-hidden" htmlFor={`${id}-input`}>{r.label}, exact value</label>
          <input id={`${id}-input`} className="num-input" type="number" min={r.min} max={r.max} step={stepOf(r)}
            value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(e.currentTarget.value); }} />
        </div>
      </td>
    </tr>
  );
}
