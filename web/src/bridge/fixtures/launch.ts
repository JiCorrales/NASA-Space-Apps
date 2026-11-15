// Recorded launches for the stand-in: the `simTick` frames Unity would send during the launch act, from
// LAUNCH to week 1 (or to the end of the attempt).
//
// FIXTURE DATA, NOT GAME RULES. Which case plays is picked by the stand-in's seed so that retries differ;
// it does not depend on the design, and nothing here is a probability. Unity decides the real outcome.
// Every number is illustrative. The lines follow Jose's rule: during the launch they say only what is
// happening and its symptoms; the cause is named only in the report.

import type { LaunchFrame, PollStation, Report, SimFrame } from "../types";

export type LaunchCase = "clean" | "hold" | "ascentLost" | "scrubbed" | "noDeploy";
/** The order the seed walks through: consecutive seeds always give different cases. */
export const LAUNCH_CASES: readonly LaunchCase[] = ["clean", "ascentLost", "hold", "noDeploy", "scrubbed"];
export const launchCaseFor = (seed: number): LaunchCase => LAUNCH_CASES[((Math.floor(seed) % 5) + 5) % 5]!;

export interface LaunchStep {
  frame: SimFrame;
  /** How long the stand-in shows this frame before the next one. */
  ms: number;
}

export const STATIONS = ["RANGE", "WEATHER", "VEHICLE", "PAYLOAD", "GROUND", "FLIGHT"] as const;
const ORBIT_KM = 500;
const ORBIT_KMS = Math.sqrt(398600 / (6371 + ORBIT_KM));
const ASCENT_S = 540;

/** The rest of the frame: as at the start of week 1, and not shown while `launch` is present. */
function baseFrame(): Omit<SimFrame, "launch"> {
  return {
    week: 1, day: 0, speed: "detail", battery: 70, pointingError: 0.2, cameraTemp: 21, storageQueue: 0, linkQuality: 0,
    imagesDelivered: 0, imagesLost: 0, projectedSuccess: 0, weeks: Array.from({ length: 52 }, () => ""),
    contact: false, capturing: false, alert: null, commands: [], log: [], report: null,
  };
}

function lostReport(lostBecause: string, decisions: string[], suggestion: string): Report {
  return {
    successRate: 0, imagesDelivered: 0, factors: [{ label: "Science return", value: 0 }],
    lostBecause, decisions, suggestion, images: Array.from({ length: 52 }, () => ""),
  };
}

const REPORTS: Partial<Record<LaunchCase, Report>> = {
  ascentLost: lostReport(
    "The launch vehicle failed during second stage flight, and the CubeSat never reached orbit.",
    [
      "Nothing in your design caused it: launch vehicles sometimes fail, and the CubeSat was only a passenger.",
      "Your CubeSat never flew, so its design is still unproven.",
    ],
    "Retry with the same design: the next launch is a new flight.",
  ),
  scrubbed: lostReport(
    "The launch was scrubbed: winds aloft stayed over the limit and the launch window closed with the CubeSat on the ground.",
    [
      "Weather answered NO-GO at the poll and did not clear before the window closed.",
      "Nothing in your design caused it: the vehicle does not fly outside its weather limits.",
    ],
    "Retry: the next attempt flies on another day.",
  ),
  noDeploy: lostReport(
    "The CubeSat separated but never called home: its antennas and solar wings did not unfold, so it could not charge or talk to the ground.",
    [
      "The deployable wings and antennas hang on a release that has to work the first time, in space.",
      "No test on the ground ran the deployment the way it happens in orbit.",
    ],
    "Add the day-in-the-life test in build and verify, or choose body-mounted panels so less has to unfold.",
  ),
};

/** Telemetry along the ascent, illustrative: altitude eases up to the orbit, speed builds up to orbital. */
const altitude = (p: number) => Math.round(ORBIT_KM * Math.sin((p * Math.PI) / 2));
const velocity = (p: number) => Math.round(ORBIT_KMS * Math.pow(p, 1.3) * 100) / 100;

export function recordLaunch(kind: LaunchCase, vehicle = "nasa"): LaunchStep[] {
  const steps: LaunchStep[] = [];
  const poll: PollStation[] = STATIONS.map((station) => ({ station, go: null }));
  const l: LaunchFrame = {
    stage: "countdown", met: -20, vehicle, altitudeKm: 0, velocityKms: 0, progress: 0, poll, line: "", outcome: null,
  };
  const push = (patch: Partial<LaunchFrame>, ms: number, report?: Report) => {
    Object.assign(l, patch);
    steps.push({ frame: { ...baseFrame(), report: report ?? null, launch: { ...l, poll: l.poll.map((s) => ({ ...s })) } }, ms });
  };
  const answer = (station: string, go: boolean | null) => {
    l.poll = l.poll.map((s) => (s.station === station ? { ...s, go } : s));
  };
  const weatherNoGo = kind === "hold" || kind === "scrubbed";

  // ---- The poll, at T-00:20
  push({ line: "This is launch control. Stand by for the GO/NO-GO poll." }, 1100);
  for (const station of STATIONS) {
    const go = !(weatherNoGo && station === "WEATHER");
    answer(station, go);
    push({ line: go ? `${station}: GO.` : "WEATHER: NO-GO. Winds aloft are over the limit." }, go ? 450 : 1300);
  }
  if (weatherNoGo) {
    push({ stage: "hold", line: "Hold, hold, hold. The clock is holding at T-00:20." }, 1400);
    push({ line: "Holding. Weather team is watching the winds aloft." }, 1400);
    push({ line: "Still holding. Next weather balloon report in a few minutes." }, 1400);
    if (kind === "scrubbed") {
      push({ line: "Winds aloft are still over the limit." }, 1300);
      push({ line: "The launch window has closed. We are scrubbing for today.", outcome: "scrubbed" }, 0, REPORTS.scrubbed);
      return steps;
    }
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
    push({ met, line }, met < -10 ? 120 : 420);
  }

  // ---- Ascent
  const ascentSteps = 25;
  for (let i = 0; i <= ascentSteps; i++) {
    const p = i / ascentSteps;
    const stage = p < 0.12 ? "liftoff" : p < 0.38 ? "maxq" : p < 0.6 ? "staging" : p < 0.84 ? "fairing" : "orbit";
    const lines: Record<string, string> = {
      liftoff: "Liftoff! The vehicle has cleared the tower.",
      maxq: "Through max Q: the vehicle is past the peak air pressure.",
      staging: "Main engine cutoff. Stage separation. Second stage ignition.",
      fairing: "Fairing separation. The payload is in open space.",
      orbit: "Second stage burning for orbit.",
    };
    push({ stage, met: Math.round(p * ASCENT_S), progress: p, altitudeKm: altitude(p), velocityKms: velocity(p),
      line: i === ascentSteps ? "Engine cutoff. We are in orbit." : lines[stage]! }, i === 0 ? 900 : 320);
    if (kind === "ascentLost" && stage === "staging" && p >= 0.44) {
      // Symptoms first: the numbers stop moving, then the signal goes. The cause is in the report.
      push({ met: l.met + 9, line: "Telemetry is flat." }, 900);
      push({ met: l.met + 9, line: "We have lost telemetry from the vehicle." }, 1300);
      push({ line: "No signal from the vehicle. Flight control is declaring it lost.", outcome: "lost" }, 0, REPORTS.ascentLost);
      return steps;
    }
  }
  push({ line: "Engine cutoff. We are in orbit." }, 900);

  // ---- Separation and deployment
  push({ stage: "separation", met: 3300, line: "Separation confirmed. The CubeSat is free." }, 1400);
  push({ stage: "deploy", met: 3600, line: "Waiting for the first signal from the CubeSat." }, 1500);
  if (kind === "noDeploy") {
    push({ met: 9200, line: "No signal on the first ground pass." }, 1500);
    push({ met: 14800, line: "No signal on the second ground pass." }, 1500);
    push({ met: 20400, line: "Still nothing from the CubeSat. We are declaring it lost.", outcome: "lost" }, 0, REPORTS.noDeploy);
    return steps;
  }
  push({ stage: "done", met: 3900, line: "Signal acquired. Solar wings out, battery charging. Welcome to orbit.", outcome: "ok" }, 2600);
  return steps;
}
