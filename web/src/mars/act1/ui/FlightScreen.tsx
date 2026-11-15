// Step 6: launch, cruise, arrival and landing, ending with what the crew has and the hand-over to Act 2.
import { useCallback, useEffect, useState } from "react";
import type { MissionState } from "../../../bridge/types";
import { PixelButton } from "../../../ui";
import { CRUISE, TRANSFER } from "../data";
import { describeCapabilities } from "../capabilities";
import { ACT2_PAGE, appendLaunch, handoffOf, writeHandoff } from "../handoff";
import type { LaunchPlan } from "../launchSequence";
import type { MarsSession } from "../session";
import type { CrewSetup, LaunchFrame } from "../types";
import { LaunchCanvas } from "../launch/LaunchCanvas";
import { LaunchStrip } from "../launch/LaunchStrip";
import { ROLE_NAME } from "../crew";
import { ArrivalScene, CruiseScene } from "./scenes";
import { Crewman } from "./sprites";

type Phase = "brief" | "launch" | "report" | "cruise" | "arrival" | "summary";

/** Runs `plan.steps` one after another, each held for its own time; `skip` jumps to the last frame. */
function useLaunchPlayer(plan: LaunchPlan | null) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (!plan) return;
    let k = 0, timer = 0;
    const next = () => {
      if (k >= plan.steps.length - 1) return;
      timer = window.setTimeout(() => { k++; setI(k); next(); }, plan.steps[k]!.ms);
    };
    next();
    return () => window.clearTimeout(timer);
  }, [plan]);
  const last = plan ? plan.steps.length - 1 : 0;
  return { frame: plan ? plan.steps[Math.min(i, last)]!.frame : null, done: Boolean(plan) && i >= last, skip: () => setI(last) };
}

/** 0 to 1 over `seconds` of real time while `on`; `skip` jumps to 1. */
function useProgress(on: boolean, seconds: number) {
  const [p, setP] = useState(0);
  useEffect(() => {
    setP(0);
    if (!on) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const v = Math.min(1, (now - t0) / (seconds * 1000));
      setP(v);
      if (v < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on, seconds]);
  return { p, skip: () => setP(1) };
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export function FlightScreen({ session, state, crew, onBoard, initialPhase = "brief" }: {
  session: MarsSession; state: MissionState; crew: CrewSetup[]; onBoard: () => void; initialPhase?: Phase;
}) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [plan, setPlan] = useState<LaunchPlan | null>(null);
  const player = useLaunchPlayer(phase === "launch" || phase === "report" ? plan : null);
  const cruise = useProgress(phase === "cruise", CRUISE.sceneSeconds);
  const arrival = useProgress(phase === "arrival", 14);
  const region = state.groups.find((g) => g.group === "region")?.options.find((o) => o.id === state.design.region)?.name ?? "the landing region";

  const start = useCallback(() => {
    const seed = newSeed();
    const p = session.launch(seed);
    appendLaunch({ outcome: p.outcome, cause: p.cause, at: new Date().toISOString() });
    setPlan(p);
    setPhase("launch");
  }, [session]);

  // when the launch ends, show its report
  useEffect(() => { if (phase === "launch" && player.done) setPhase("report"); }, [phase, player.done]);
  // the cruise and the arrival lead on by themselves
  useEffect(() => { if (phase === "cruise" && cruise.p >= 1) setPhase("arrival"); }, [phase, cruise.p]);
  useEffect(() => { if (phase === "arrival" && arrival.p >= 1) setPhase("summary"); }, [phase, arrival.p]);

  // Space or Enter skips the launch, the cruise and the arrival (on a button, the button keeps its own key)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== " " && e.key !== "Enter") || (e.target as HTMLElement)?.closest?.("button, a, input")) return;
      if (phase === "launch") player.skip(); else if (phase === "cruise") cruise.skip(); else if (phase === "arrival") arrival.skip();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handoff = handoffOf(session, crew);
  useEffect(() => { if (phase === "summary") writeHandoff(handoff); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const frame: LaunchFrame | null = player.frame;
  const ok = plan?.outcome === "ok";

  return (
    <section className="a1 a1-flight" aria-labelledby="fly-title" data-phase={phase}>
      <header className="a1-head">
        <div>
          <p className="a1-kicker">Step 6</p>
          <h1 id="fly-title">{({ brief: "Launch and landing", launch: "Launch", report: "Launch report", cruise: "The crossing", arrival: "Arrival and landing", summary: "On the surface" } as const)[phase]}</h1>
        </div>
        <PixelButton onClick={onBoard} disabled={phase === "launch" || phase === "cruise" || phase === "arrival"}>Back to the mission board</PixelButton>
      </header>

      {phase === "brief" && (
        <div className="a1-box a1-brief">
          <h2>What rides with the cargo flight</h2>
          <ul className="a1-brief__list">
            {state.groups.filter((g) => !g.multi).map((g) => {
              const o = g.options.find((x) => x.id === state.design[g.group]);
              return <li key={g.group}><span>{g.group}</span><b>{o ? o.name : "not chosen"}</b></li>;
            })}
            <li><span>tests</span><b>{(state.design.tests as string[] | undefined)?.length ? (state.design.tests as string[]).join(", ") : "none"}</b></li>
          </ul>
          <p>The cargo flight leaves on {TRANSFER.launch}. Launch control polls its stations; whatever they answer is final for this attempt.</p>
          <PixelButton primary onClick={start}>Start the countdown</PixelButton>
        </div>
      )}

      {(phase === "launch" || phase === "report") && frame && (
        <>
          <div className="a1-stage a1-stage--launch"><LaunchCanvas launch={frame} /></div>
          <LaunchStrip launch={frame} />
          {phase === "launch" && <div className="a1-actions"><PixelButton onClick={player.skip}>Skip to the end of the launch (Space)</PixelButton></div>}
          {phase === "report" && plan && (
            <div className="a1-box a1-report" role="status" data-outcome={plan.outcome}>
              <h2>{ok ? "In orbit, and on its way" : plan.outcome === "lost" ? "Lost" : "Scrubbed"}</h2>
              <ul>{plan.report.map((l) => <li key={l}>{l}</li>)}</ul>
              <div className="a1-actions">
                {ok
                  ? <PixelButton primary onClick={() => setPhase("cruise")}>Cross to Mars</PixelButton>
                  : <><PixelButton primary onClick={start}>Launch again with this design</PixelButton><PixelButton onClick={onBoard}>Back to the board to change the design</PixelButton></>}
              </div>
            </div>
          )}
        </>
      )}

      {phase === "cruise" && (
        <>
          <div className="a1-stage"><CruiseScene progress={cruise.p} /></div>
          <dl className="a1-readout" aria-live="off">
            <div><dt>Day</dt><dd>{Math.round(cruise.p * TRANSFER.days)} of {TRANSFER.days}</dd></div>
            <div><dt>Radio delay to Earth, one way</dt><dd>{(cruise.p * CRUISE.delayAtArrivalMin).toFixed(1)} min</dd></div>
            <div><dt>Left Earth</dt><dd>{TRANSFER.launch}</dd></div>
            <div><dt>Arrives</dt><dd>{TRANSFER.arrival}</dd></div>
          </dl>
          <p className="a1-dim a1-note">Nothing to decide on the way. Source of the days: NASA Trajectory Browser, trajectory 20630 (direct transfers take {TRANSFER.minDays} to {TRANSFER.maxDays} days). The delay line is the team's drawing; the real delay is 3 to 22 minutes depending on the date.</p>
          <div className="a1-actions"><PixelButton onClick={cruise.skip}>Skip the crossing (Space)</PixelButton></div>
        </>
      )}

      {phase === "arrival" && (
        <>
          <div className="a1-stage"><ArrivalScene progress={arrival.p} /></div>
          <p className="a1-caption" role="status">
            {arrival.p < 0.2 ? "The satellite fires its engine to be captured by Mars."
              : arrival.p < 0.45 ? "In orbit around Mars. The satellite is working."
              : arrival.p < 0.8 ? "The lander has separated and is descending."
              : "Touchdown."}
          </p>
          <div className="a1-actions"><PixelButton onClick={arrival.skip}>Skip to the landing (Space)</PixelButton></div>
        </>
      )}

      {phase === "summary" && (
        <div className="a1-summary">
          <div className="a1-box">
            <h2>Landed at {region}</h2>
            <p>The satellite is in orbit and the four of you are on the ground. This is what you have:</p>
            <ul className="a1-summary__list">{describeCapabilities(handoff.capabilities, region).map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="a1-dim">What the satellite gives the crew is the team's rule, not NASA data: nothing in NASA's research turns a CubeSat's parts into map size, warning time or supplies.</p>
          </div>
          <div className="a1-box">
            <h2>Crew</h2>
            <ul className="a1-crew-list">
              {crew.map((c) => (
                <li key={c.name + c.role}>
                  <Crewman look={c.look} role={c.role} scale={4} label={`${c.name}, ${ROLE_NAME[c.role]}`} />
                  <span><b>{c.name}</b><br />{ROLE_NAME[c.role]}</span>
                </li>
              ))}
            </ul>
            <div className="a1-actions">
              <a className="pxbtn pxbtn--primary a1-link" href={`./${ACT2_PAGE}`} onClick={() => writeHandoff(handoff)}>Begin sol 1</a>
              <PixelButton onClick={onBoard}>Back to the mission board</PixelButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
