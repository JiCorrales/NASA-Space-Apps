import { useState } from "react";
import type { Measure, MissionCard, MissionState, World } from "../bridge/types";
import { ScreenFrame, SourceTag } from "../ui";
import { GroupPicker } from "./parts/GroupPicker";
import { IssueList } from "./parts/IssueList";
import { PixelPlanet } from "./parts/PixelPlanet";
import { StepFooter } from "./parts/StepFooter";
import { defaultSend, type Send } from "./send";

const CHANGES: { key: "sunlight" | "signal" | "travel"; label: string }[] = [
  { key: "sunlight", label: "Sunlight for the panels" },
  { key: "signal", label: "Radio signal" },
  { key: "travel", label: "Travel time" },
];

/** Used only when Unity sends no worlds or missions: Earth and the current mission, numbers "data coming". */
function worldsOf(state: MissionState): World[] {
  return state.worlds ?? [{ id: "earth", name: "Earth", open: true, sunlight: null, signal: null, travel: null }];
}
function missionsOf(state: MissionState): MissionCard[] {
  return state.missions ?? [{ ...state.mission, world: "earth", open: true, who: "", why: "" }];
}

/** Step 1, need and goals: pick a world, then a mission, read who needs the data, pick the region. */
export function GoalsScreen({ state, send = defaultSend }: { state: MissionState; send?: Send }) {
  const started = Boolean(state.design.region);
  const [world, setWorld] = useState<string | null>(started ? "earth" : null);
  const [mission, setMission] = useState<string | null>(started ? state.mission.id : null);
  const worlds = worldsOf(state);
  const missions = missionsOf(state).filter((m) => m.world === world);
  const picked = missions.find((m) => m.id === mission && m.open);
  const worldName = worlds.find((w) => w.id === world)?.name;

  return (
    <ScreenFrame step="goals" title="1 Need and goals" footer={<StepFooter step="goals" send={send} />}>
      <div className="goals">
        <section aria-labelledby="worlds-title">
          <h2 id="worlds-title" className="section-title">Choose a world</h2>
          <ul className="worlds">
            {worlds.map((w) => (
              <li key={w.id} className="world" data-open={w.open}>
                <button type="button" className="world__pick" aria-pressed={world === w.id}
                  aria-disabled={!w.open || undefined}
                  aria-label={`${w.name}${w.open ? "" : ", locked"}`}
                  onClick={() => { if (w.open) { setWorld(w.id); setMission(null); } }}>
                  <PixelPlanet world={w.id} dimmed={!w.open} />
                  <span className="world__name">{w.name}</span>
                  <span className="world__state">{w.open ? (world === w.id ? "[x] CHOSEN" : "OPEN") : "LOCKED"}</span>
                </button>
                {!w.open && (
                  <dl className="world__changes" aria-label={`What would change at ${w.name}`}>
                    {CHANGES.map((c) => <Change key={c.key} label={c.label} measure={w[c.key]} />)}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </section>

        {world && (
          <section aria-labelledby="missions-title">
            <h2 id="missions-title" className="section-title">Missions at {worldName}</h2>
            <ul className="missions">
              {missions.map((m) => (
                <li key={m.id}>
                  <button type="button" className="card mission" aria-pressed={mission === m.id}
                    aria-disabled={!m.open || undefined}
                    aria-label={`${m.name}${m.open ? "" : ", locked"}`}
                    onClick={() => { if (m.open) setMission(m.id); }}>
                    <span className="card__name">
                      <span>{m.name}</span>
                      <span className="card__mark">{m.open ? (mission === m.id ? "[x] CHOSEN" : "[ ]") : "LOCKED"}</span>
                    </span>
                    <span className="card__summary">{m.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {picked && (
          <div className="goals__need">
            <section className="need" aria-labelledby="need-title">
              <h2 id="need-title" className="section-title">{picked.name}: the need</h2>
              <p className="lead">{state.mission.summary}</p>
              <h3 className="need__label">Who needs the data</h3>
              <p>{picked.who || "Data coming."}</p>
              <h3 className="need__label">Why</h3>
              <p>{picked.why || "Data coming."}</p>
            </section>
            <GroupPicker state={state} group="region" send={send} heading="h2" />
          </div>
        )}

        <IssueList issues={state.issues} step="goals" />
      </div>
    </ScreenFrame>
  );
}

function Change({ label, measure }: { label: string; measure: Measure | null }) {
  return (
    <div className="change">
      <dt>{label}</dt>
      <dd>
        {measure ? (
          <>
            <span className="num">{measure.value}</span> {measure.unit} <SourceTag source={measure.source} />
          </>
        ) : (
          <span className="muted">data coming</span>
        )}
      </dd>
    </div>
  );
}
