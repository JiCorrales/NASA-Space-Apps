// The launch of the crew's cargo flight with the satellite aboard, as LaunchFrames, decided by the session's rules.
// Adapted from the recorded launches of `web/src/bridge/fixtures/launch.ts` on `origin/feat/launch-phase`; here the
// outcome is not picked from a list: a design that cannot fly makes a station answer NO-GO and the launch is
// scrubbed; a rocket can fail through no fault of the design; a satellite whose deployables were never unfolded on
// the ground may not unfold in space. The same design and seed give the same launch.
//
// The lines say only what is happening and its symptoms. The cause is named only in the report.

import { GROUP_DEFS, LAUNCH_RULES, TRANSFER, WINDOW_MONTHS } from "./data";
import { evaluate, type Requirements } from "./model";
import type { Act1Design, LaunchFrame, PollStation } from "./types";

export type LaunchCase = "clean" | "hold" | "vehicleLost" | "scrubbed" | "noDeploy";

export interface LaunchStep { frame: LaunchFrame; ms: number }
export interface LaunchPlan {
  seed: number;
  kind: LaunchCase;
  outcome: "ok" | "lost" | "scrubbed";
  /** One sentence naming what ended the attempt, or what happened when it flew. */
  cause: string;
  /** The report after the launch: what happened, in order. */
  report: string[];
  steps: LaunchStep[];
}

/** mulberry32: a small seeded generator, so a seed replays the same launch. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAME: Record<string, string> = {
  region: "landing region", orbit: "orbit", revisit: "pass plan", format: "format", power: "power", attitude: "attitude control",
  storage: "storage", instrument: "instrument", radio: "radio", groundStation: "Deep Space Network time", backupStation: "backup relay", launch: "ride to Mars",
};
/** Groups without which the satellite cannot be built or flown, and the station that refuses it. */
const NEEDED: Record<string, string> = {
  format: "PAYLOAD", power: "PAYLOAD", attitude: "PAYLOAD", storage: "PAYLOAD", instrument: "PAYLOAD", radio: "PAYLOAD",
  launch: "PAYLOAD", groundStation: "DSN", orbit: "FLIGHT",
};

/** Why the design cannot fly, as the station that says NO-GO and its words; null when it can. */
export function noGoOf(design: Act1Design, req: Requirements, reserve: number): { station: string; line: string; cause: string } | null {
  const e = evaluate(design, req, reserve);
  for (const g of GROUP_DEFS) {
    const station = NEEDED[g.group];
    if (station && e.missing.includes(g.group))
      return { station, line: `${station}: NO-GO. No ${NAME[g.group]} in the flight plan.`,
        cause: `The satellite had no ${NAME[g.group]} chosen, so ${station} answered NO-GO and the launch was scrubbed.` };
  }
  if (design.power === "large" && design.format === "3u")
    return { station: "PAYLOAD", line: "PAYLOAD: NO-GO. The panels do not fit the satellite.",
      cause: "Large deployable panels were chosen for a 3U, which cannot carry them: PAYLOAD answered NO-GO." };
  if (e.massKg > e.massLimitKg)
    return { station: "PAYLOAD", line: "PAYLOAD: NO-GO. The satellite is over its mass.",
      cause: `The satellite weighed ${e.massKg} kg and its slot takes ${e.massLimitKg} kg: PAYLOAD answered NO-GO.` };
  if (e.powerW > e.panelW)
    return { station: "PAYLOAD", line: "PAYLOAD: NO-GO. The power budget does not close at Mars.",
      cause: `The satellite uses ${e.powerW} W and its panels give ${e.panelW} W at Mars: the flight review answered NO-GO.` };
  if (e.costUsd > e.budgetUsd)
    return { station: "PAYLOAD", line: "PAYLOAD: NO-GO. The satellite was never finished.",
      cause: `The design cost ${e.costUsd.toLocaleString("en-US")} USD against a budget of ${e.budgetUsd.toLocaleString("en-US")} USD: the money ran out before it was finished.` };
  if (e.months > WINDOW_MONTHS)
    return { station: "PAYLOAD", line: "PAYLOAD: NO-GO. The satellite is not on the pad.",
      cause: `Building and testing took ${e.months} months; the cargo flight left after ${WINDOW_MONTHS}, without the satellite.` };
  if (!e.tests.includes("vibration"))
    return { station: "PAYLOAD", line: "PAYLOAD: NO-GO. No vibration test on record.",
      cause: "The satellite had no vibration test, and the cargo flight takes no payload without one: PAYLOAD answered NO-GO." };
  return null;
}

const PARKING_KM = 300;
const PARKING_KMS = Math.sqrt(398600 / (6371 + PARKING_KM));
const ASCENT_S = 540;
const altitude = (p: number) => Math.round(PARKING_KM * Math.sin((p * Math.PI) / 2));
const velocity = (p: number) => Math.round(PARKING_KMS * Math.pow(p, 1.3) * 100) / 100;

/** The launch for this design and seed. */
export function planLaunch(design: Act1Design, req: Requirements, reserve: number, seed: number): LaunchPlan {
  const e = evaluate(design, req, reserve);
  const r = rng(seed);
  const noGo = noGoOf(design, req, reserve);
  // Draws are taken in a fixed order, so each one means the same thing for every design.
  const weatherHold = r() < LAUNCH_RULES.weatherHold;
  const vehicleLost = r() < LAUNCH_RULES.vehicleLoss;
  const deployDraw = r();
  const tested = e.tests.includes("deploy");
  const noDeploy = e.deploys && deployDraw < (tested ? LAUNCH_RULES.undeployedTested : LAUNCH_RULES.undeployedUntested);
  const kind: LaunchCase = noGo ? "scrubbed" : vehicleLost ? "vehicleLost" : noDeploy ? "noDeploy" : weatherHold ? "hold" : "clean";
  const vehicle = typeof design.launch === "string" ? design.launch : "cargo";
  const carried = design.launch === "cargo-carried";

  const steps: LaunchStep[] = [];
  const l: LaunchFrame = {
    stage: "countdown", met: -20, vehicle, altitudeKm: 0, velocityKms: 0, progress: 0,
    poll: LAUNCH_RULES.stations.map((station): PollStation => ({ station, go: null })), line: "", outcome: null,
  };
  const push = (patch: Partial<LaunchFrame>, ms: number) => {
    Object.assign(l, patch);
    steps.push({ frame: { ...l, poll: l.poll.map((p) => ({ ...p })) }, ms });
  };
  const answer = (station: string, go: boolean | null) => { l.poll = l.poll.map((p) => (p.station === station ? { ...p, go } : p)); };
  const done = (outcome: LaunchPlan["outcome"], cause: string, report: string[]): LaunchPlan =>
    ({ seed, kind, outcome, cause, report, steps });

  // ---- The poll
  push({ line: "This is launch control for the Mars cargo flight. Stand by for the GO/NO-GO poll." }, 1100);
  for (const station of LAUNCH_RULES.stations) {
    const refuses = noGo?.station === station;
    const weather = station === "WEATHER" && weatherHold && !noGo;
    const go = !refuses && !weather;
    answer(station, go);
    push({ line: go ? `${station}: GO.` : refuses ? noGo!.line : "WEATHER: NO-GO. Winds aloft are over the limit." }, go ? 420 : 1300);
    if (refuses) {
      push({ stage: "hold", line: "Hold, hold, hold. The clock is holding at T-00:20." }, 1400);
      push({ line: "The launch window has closed. We are scrubbing for today.", outcome: "scrubbed" }, 0);
      return done("scrubbed", noGo!.cause, [noGo!.cause, "The satellite never left the ground; its design is still unflown."]);
    }
  }
  if (weatherHold && !noGo) {
    push({ stage: "hold", line: "Hold, hold, hold. The clock is holding at T-00:20." }, 1400);
    push({ line: "Holding. The weather team is watching the winds aloft." }, 1400);
    answer("WEATHER", null);
    push({ line: "Re-polling WEATHER." }, 900);
    answer("WEATHER", true);
    push({ line: "WEATHER: GO. Winds are back inside the limits." }, 1000);
    push({ stage: "countdown", line: "Resuming the count at T-00:20." }, 900);
  }
  push({ line: "All stations GO. You are GO for launch." }, 1000);

  // ---- The final count
  for (let met = -19; met < 0; met++) {
    const line = met === -10 ? "T-10." : met === -3 ? "Ignition sequence start." : met > -10 && met < -3 ? `${-met}...` : l.line;
    push({ met, line }, met < -10 ? 110 : 400);
  }

  // ---- Ascent
  const lines: Record<string, string> = {
    liftoff: "Liftoff! The Mars cargo flight has cleared the tower.",
    maxq: "Through max Q: the vehicle is past the peak air pressure.",
    staging: "Main engine cutoff. Stage separation. Second stage ignition.",
    fairing: "Fairing separation. The cargo is in open space.",
    orbit: "Second stage burning for the parking orbit.",
  };
  const N = 25;
  for (let i = 0; i <= N; i++) {
    const p = i / N;
    const stage = p < 0.12 ? "liftoff" : p < 0.38 ? "maxq" : p < 0.6 ? "staging" : p < 0.84 ? "fairing" : "orbit";
    push({ stage, met: Math.round(p * ASCENT_S), progress: p, altitudeKm: altitude(p), velocityKms: velocity(p),
      line: i === N ? "Engine cutoff. We are in the parking orbit." : lines[stage]! }, i === 0 ? 900 : 300);
    if (kind === "vehicleLost" && stage === "staging" && p >= 0.44) {
      push({ met: l.met + 9, line: "Telemetry is flat." }, 900);
      push({ met: l.met + 9, line: "We have lost telemetry from the vehicle." }, 1300);
      push({ line: "No signal from the vehicle. Flight control is declaring it lost.", outcome: "lost" }, 0);
      const cause = "The rocket's second stage failed during the climb, and the cargo flight never reached orbit.";
      return done("lost", cause, [cause, "The satellite was a passenger: nothing in its design caused it, and it never flew."]);
    }
  }
  push({ line: "Second stage relight. Burning for Mars." }, 1100);
  push({ velocityKms: 11.4, line: `Engine cutoff. The cargo flight is on its way: ${TRANSFER.days} days to Mars.` }, 1100);

  // ---- Separation and deployment
  push({ stage: "separation", met: 3300, line: carried
    ? "The satellite stays on the cruise stage. Waking it for its checkout."
    : "Separation confirmed. The satellite is free and flying on its own." }, 1400);
  push({ stage: "deploy", met: 3600, line: "Waiting for the first signal from the satellite." }, 1500);
  if (kind === "noDeploy") {
    push({ met: 9200, line: "No signal on the first Deep Space Network pass." }, 1500);
    push({ met: 14800, line: "No signal on the second pass." }, 1500);
    push({ met: 20400, line: "Still nothing from the satellite. We are declaring it lost.", outcome: "lost" }, 0);
    const parts = [design.power === "deploy" || design.power === "large" ? "solar wings" : "", design.radio === "uhf-reflectarray" ? "high-gain antenna" : ""]
      .filter(Boolean).join(" and ");
    const cause = `The satellite left the rocket but never called home: its ${parts} did not unfold, so it could not charge or talk.`;
    return done("lost", cause, [cause, tested ? "They had been unfolded on the ground in the deployment test." : "They had never been unfolded on the ground: no deployment test was run."]);
  }
  const what = e.deploys ? "Panels and antenna out, battery charging." : "Battery charging.";
  push({ stage: "done", met: 3900, line: `Signal acquired. ${what} Next stop: Mars.`, outcome: "ok" }, 2400);
  return done("ok", "The satellite is on its way to Mars and talking to the Deep Space Network.",
    [kind === "hold" ? "Weather held the count for a while, then cleared." : "The count ran clean.",
      "The cargo flight reached its parking orbit and left for Mars.", "The satellite called home."]);
}
