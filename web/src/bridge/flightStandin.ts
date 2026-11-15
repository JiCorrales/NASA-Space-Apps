// Stand-in for Unity during step "fly": on `fly launch` (or `retry`) it plays one of the recorded launches in
// `fixtures/launch.ts`, picked by a seed that moves on with every attempt, then hands over to the recorded
// flight in `fixtures/flight.ts`, all as `simTick` messages, and it answers the `fly` and `command` messages.
// It does not simulate anything: the launch outcome is the recording's, a command only releases the flight
// recording when it is waiting at an alert, and the recording then shows the answer it was recorded with.

import type { FlightRecording } from "./fixtures/flight";
// The launch recordings are small and built on demand, so they load with the page (the year-long flight
// recording stays a separate chunk).
import { launchCaseFor, recordLaunch, type LaunchCase, type LaunchStep } from "./fixtures/launch";
import type { PageToUnity, SimFrame, UnityToPage } from "./types";

export interface FlightStandinOptions {
  /** Seed of the first launch; each attempt moves it on, so retries play a different case. Default 0. */
  seed?: number;
  /** Id of the launch option chosen in the design, for the vehicle the window draws. */
  vehicle?: () => string | null | undefined;
}

/** Milliseconds per recorded frame at each speed. */
const STEP_MS = { detail: 900, fast: 160 } as const;
/** How long the recording waits at an alert before going on without an answer. */
const AWAIT_MS = 15000;

export function createFlightStandin(emit: (m: UnityToPage) => void, opts: FlightStandinOptions = {}) {
  let seed = opts.seed ?? 0;
  let lastCase: LaunchCase | null = null;
  let launchSteps: LaunchStep[] | null = null;
  let launchIndex = -1;
  let launchTimer: ReturnType<typeof setTimeout> | null = null;
  /** "launch" while a launch plays, "flight" once the recorded year plays, "ended" after a failed launch. */
  let phase: "idle" | "launch" | "flight" | "ended" = "idle";
  let rec: FlightRecording | null = null;
  let loading: Promise<FlightRecording> | null = null;
  let index = -1;
  let speed: "detail" | "fast" | "paused" = "paused";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let waitingSince = 0;

  // The recording is loaded on first use, so it stays out of the page bundle that ships with Unity.
  const load = () =>
    (loading ??= import("./fixtures/flight").then((m) => (rec = m.recordFlight())));

  const current = (): SimFrame | null => {
    const step = rec?.steps[index];
    return step ? { ...step.frame, speed: step.frame.report ? "paused" : speed } : null;
  };
  const show = () => {
    const f = current();
    if (f) emit({ type: "simTick", payload: f });
  };
  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const schedule = () => {
    stop();
    if (!rec || speed === "paused") return;
    const step = rec.steps[index];
    if (!step || step.frame.report) return;
    const next = rec.steps[index + 1];
    // Fast forward stops at an alert, as the brief asks.
    if (speed === "fast" && next?.frame.alert && !step.frame.alert) {
      timer = setTimeout(() => { speed = "detail"; advance(); }, STEP_MS.fast);
      return;
    }
    if (step.awaits) {
      if (!waitingSince) waitingSince = Date.now();
      timer = setTimeout(advance, Math.max(0, AWAIT_MS - (Date.now() - waitingSince)));
      return;
    }
    timer = setTimeout(advance, STEP_MS[speed]);
  };
  function advance() {
    if (!rec || index >= rec.steps.length - 1) return;
    index++;
    waitingSince = 0;
    show();
    schedule();
  }

  const stopLaunch = () => {
    if (launchTimer) clearTimeout(launchTimer);
    launchTimer = null;
  };
  /** Shows the current launch frame; after the last one, hands over to the flight or ends the attempt. */
  function playLaunch() {
    const step = launchSteps?.[launchIndex];
    if (!step) return;
    emit({ type: "simTick", payload: step.frame });
    const last = launchIndex >= launchSteps!.length - 1;
    if (!last) {
      launchTimer = setTimeout(() => { launchIndex++; playLaunch(); }, step.ms);
    } else if (step.frame.launch?.outcome === "ok") {
      launchTimer = setTimeout(() => {
        // Into week 1, at the speed last asked for during the launch.
        phase = "flight"; index = 0; waitingSince = 0; show(); schedule();
      }, step.ms);
    } else {
      phase = "ended"; // lost or scrubbed: the frame carries the report, and the attempt ends here
    }
  }

  function handle(msg: PageToUnity) {
    if (msg.type === "fly") {
      const a = msg.payload.action;
      if (a === "launch" || a === "retry") {
        stop(); stopLaunch();
        void load().then(() => {
          let kind = launchCaseFor(seed);
          while (kind === lastCase) kind = launchCaseFor(++seed);
          lastCase = kind;
          seed++;
          launchSteps = recordLaunch(kind, opts.vehicle?.() ?? "nasa");
          launchIndex = 0; phase = "launch"; speed = "detail";
          playLaunch();
        });
      } else if (phase !== "flight") {
        // The launch is watch-only: speed changes wait for week 1.
        if (a === "pause") speed = "paused"; else if (a === "resume") speed = "detail"; else if (a === "fast") speed = "fast";
      } else if (a === "pause") {
        speed = "paused"; stop(); show();
      } else if (a === "resume") {
        speed = "detail"; show(); schedule();
      } else if (a === "fast") {
        speed = "fast"; show(); schedule();
      }
    } else if (msg.type === "command") {
      if (phase !== "flight") return;
      const step = rec?.steps[index];
      const cmd = step?.frame.commands.find((c) => c.name === msg.payload.name);
      if (!step || !cmd?.enabled) return;
      // The recording continues with the answer it was recorded with.
      if (step.awaits) { if (speed === "paused") speed = "detail"; advance(); }
    }
  }

  return {
    handle,
    /** for tests */ get index() { return index; },
    /** for tests: the launch case of the last attempt */ get launchCase() { return lastCase; },
  };
}
