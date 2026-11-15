// 8-bit sound effects: square-wave notes from the Web Audio API. No audio files, no dependency.
// Browsers only allow sound after a click or key press, so the first sound may be the first button click.
import type { SimFrame } from "./bridge/types";

export type Sound =
  | "click" | "launch" | "image" | "lost" | "alert" | "success" | "failure"
  | "tick" | "ignition" | "staging" | "ping";

// Each sound is a list of [frequency in Hz, duration in seconds]; 0 Hz is a rest.
const TUNES: Record<Sound, [number, number][]> = {
  click: [[660, 0.04]],
  launch: [[262, 0.08], [330, 0.08], [392, 0.08], [523, 0.16]],
  image: [[880, 0.05], [1175, 0.08]],
  lost: [[196, 0.1], [147, 0.18]],
  alert: [[740, 0.1], [0, 0.05], [740, 0.1], [0, 0.05], [740, 0.1]],
  success: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
  failure: [[392, 0.15], [330, 0.15], [262, 0.3]],
  // The launch act (after Alexander's prototype): a countdown tick, ignition, a stage falling away, the
  // separation ping. Ignition and staging also rumble (see RUMBLE).
  tick: [[440, 0.08]],
  ignition: [[880, 0.25]],
  staging: [[200, 0.06], [150, 0.06], [110, 0.12]],
  ping: [[1500, 0.08], [0, 0.04], [1500, 0.05]],
};

/** Sounds that add a low noise rumble: [seconds, volume]. */
const RUMBLE: Partial<Record<Sound, [number, number]>> = { ignition: [4.5, 0.08], staging: [0.6, 0.05] };

const KEY = "earthwatch.muted";
let muted = (() => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } })();
let ctx: AudioContext | null = null;

export const isMuted = () => muted;
export function setMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem(KEY, m ? "1" : "0"); } catch { /* private mode: the choice lasts for this visit */ }
}

/** Low-passed white noise that fades out: the rumble of an engine. */
function noise(c: AudioContext, seconds: number, volume: number): void {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  src.buffer = buf;
  filter.type = "lowpass";
  filter.frequency.value = 420;
  gain.gain.value = volume;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
}

export function play(sound: Sound): void {
  if (muted || typeof AudioContext === "undefined") return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const rumble = RUMBLE[sound];
  if (rumble) noise(ctx, rumble[0], rumble[1]);
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

/** Which sounds a frame of the launch act calls for, given the one before it. */
function launchSounds(prev: SimFrame | null, next: SimFrame): Sound[] {
  const l = next.launch!;
  const p = prev?.launch ?? null;
  const out: Sound[] = [];
  const entered = (stage: string) => l.stage === stage && p?.stage !== stage;
  if (l.stage === "countdown" && l.met < 0 && l.met >= -10 && l.met !== p?.met) out.push("tick");
  if (entered("liftoff")) out.push("ignition", "launch");
  if (entered("staging") || entered("fairing")) out.push("staging");
  if (entered("separation")) out.push("ping");
  const noGo = l.poll.some((s) => s.go === false && p?.poll.find((q) => q.station === s.station)?.go !== false);
  if (entered("hold") || noGo) out.push("alert");
  if (l.outcome === "ok" && p?.outcome !== "ok") out.push("success");
  return out;
}

/** Which sounds a new flight frame calls for, given the one before it. */
export function flightSounds(prev: SimFrame | null, next: SimFrame | null): Sound[] {
  if (!next) return [];
  const out: Sound[] = next.launch ? launchSounds(prev, next) : [];
  // First frame, or a retry. With a launch act the launch tune plays at lift-off instead.
  if (!next.launch && !prev?.launch && (!prev || next.week < prev.week)) out.push("launch");
  if (next.alert && next.alert.code !== prev?.alert?.code) out.push("alert");
  if (prev && next.week >= prev.week) {
    if (next.imagesLost > prev.imagesLost) out.push("lost");
    // In fast forward a blip per image would be a buzz; the alert and the lost image still sound.
    else if (next.imagesDelivered > prev.imagesDelivered && next.speed !== "fast") out.push("image");
  }
  if (next.report && !prev?.report) out.push(next.report.successRate >= 50 ? "success" : "failure"); // below 50 the report is red
  return out;
}
