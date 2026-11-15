// 8-bit sound effects: square-wave notes from the Web Audio API. No audio files, no dependency.
// Browsers only allow sound after a click or key press, so the first sound may be the first button click.
import type { SimFrame } from "./bridge/types";

export type Sound = "click" | "launch" | "image" | "lost" | "alert" | "success" | "failure" | "linkLost" | "linkBack" | "taskDone" | "storm" | "solEnd";

// Each sound is a list of [frequency in Hz, duration in seconds]; 0 Hz is a rest.
const TUNES: Record<Sound, [number, number][]> = {
  click: [[660, 0.04]],
  launch: [[262, 0.08], [330, 0.08], [392, 0.08], [523, 0.16]],
  image: [[880, 0.05], [1175, 0.08]],
  lost: [[196, 0.1], [147, 0.18]],
  alert: [[740, 0.1], [0, 0.05], [740, 0.1], [0, 0.05], [740, 0.1]],
  success: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
  failure: [[392, 0.15], [330, 0.15], [262, 0.3]],
  // Act 2 (Mars)
  linkLost: [[523, 0.07], [392, 0.07], [262, 0.07], [165, 0.2]],
  linkBack: [[262, 0.06], [392, 0.06], [523, 0.06], [784, 0.14]],
  taskDone: [[659, 0.07], [880, 0.07], [1320, 0.16]],
  storm: [[110, 0.2], [98, 0.2], [123, 0.25]],
  solEnd: [[392, 0.08], [294, 0.14]],
};

const KEY = "earthwatch.muted";
let muted = (() => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } })();
let ctx: AudioContext | null = null;

export const isMuted = () => muted;
export function setMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem(KEY, m ? "1" : "0"); } catch { /* private mode: the choice lasts for this visit */ }
}

export function play(sound: Sound): void {
  if (muted || typeof AudioContext === "undefined") return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  let t = ctx.currentTime;
  for (const [hz, dur] of TUNES[sound]) {
    if (hz > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.06, t); // quiet: square waves are harsh
      gain.gain.setValueAtTime(0, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    }
    t += dur;
  }
}

/** A click blip on every button of the page. */
export function installClickSound(): void {
  document.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest("button:not(:disabled)")) play("click");
  });
}

/** Which sounds a new flight frame calls for, given the one before it. */
export function flightSounds(prev: SimFrame | null, next: SimFrame | null): Sound[] {
  if (!next) return [];
  const out: Sound[] = [];
  if (!prev || next.week < prev.week) out.push("launch"); // first frame, or a retry
  if (next.alert && next.alert.code !== prev?.alert?.code) out.push("alert");
  if (prev && next.week >= prev.week) {
    if (next.imagesLost > prev.imagesLost) out.push("lost");
    // In fast forward a blip per image would be a buzz; the alert and the lost image still sound.
    else if (next.imagesDelivered > prev.imagesDelivered && next.speed !== "fast") out.push("image");
  }
  if (next.report && !prev?.report) out.push(next.report.successRate >= 50 ? "success" : "failure"); // below 50 the report is red
  return out;
}
