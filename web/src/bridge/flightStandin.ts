// Stand-in for Unity during step "fly": replays the recorded flight in `fixtures/flight.ts` as `simTick`
// messages and answers the `fly` and `command` messages. It does not simulate anything: a command only
// releases the recording when it is waiting at an alert, and the recording then shows the answer it was
// recorded with.

import type { FlightRecording } from "./fixtures/flight";
import type { PageToUnity, SimFrame, UnityToPage } from "./types";

/** Milliseconds per recorded frame at each speed. */
const STEP_MS = { detail: 900, fast: 160 } as const;
/** How long the recording waits at an alert before going on without an answer. */
const AWAIT_MS = 15000;

export function createFlightStandin(emit: (m: UnityToPage) => void) {
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

  function handle(msg: PageToUnity) {
    if (msg.type === "fly") {
      const a = msg.payload.action;
      if (a === "launch" || a === "retry") {
        void load().then(() => { index = 0; waitingSince = 0; speed = "detail"; show(); schedule(); });
      } else if (a === "pause") {
        speed = "paused"; stop(); show();
      } else if (a === "resume") {
        speed = "detail"; show(); schedule();
      } else if (a === "fast") {
        speed = "fast"; show(); schedule();
      }
    } else if (msg.type === "command") {
      const step = rec?.steps[index];
      const cmd = step?.frame.commands.find((c) => c.name === msg.payload.name);
      if (!step || !cmd?.enabled) return;
      // The recording continues with the answer it was recorded with.
      if (step.awaits) { if (speed === "paused") speed = "detail"; advance(); }
    }
  }

  return { handle, /** for tests */ get index() { return index; } };
}
