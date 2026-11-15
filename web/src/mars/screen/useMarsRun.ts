// Owns one world, the four demo controllers and the phase machine of a run: briefing, choosing, playing, evening,
// ended. It never computes a rule: it asks the engine for views and reports and keeps time between them.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActivityId, Attempt, Choice, EveningView, PlayerId, PlayerView, Pos, RunResult, SolEvent, SolReport, Target } from "../types";
import { PLAYER_IDS } from "../types";
import { appendHistory, readHandoff, readHistory, type DesignId, type Handoff, type RunFactory, type RunKit } from "./engine";

export type Phase = "briefing" | "choosing" | "playing" | "evening" | "ended";
export interface Reveal { player: PlayerId; name: string; lines: string[]; paths: Pos[][] }

const BRIEFING_S = 1.4, CHOOSE_GAP_S = 0.45, REVISE_GAP_S = 0.3, EVENING_S = 3.2;
const reducedMotion = () => (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) ?? false;

export interface MarsRun {
  phase: Phase;
  views: PlayerView[];
  /** The views after the sol, while it plays (modules reach their new look when their event comes). */
  after: PlayerView[] | null;
  report: SolReport | null;
  evening: EveningView[] | null;
  result: RunResult | null;
  attempts: Attempt[];
  playId: number;
  reveals: Reveal[];
  /** Linked players who changed their plan after seeing the others' (the second round of the choice). */
  revised: PlayerId[];
  /** Sol shown in the counter. */
  sol: number;
  totalSols: number;
  running: boolean;
  fast: boolean;
  seed: number;
  design: DesignId;
  handoff: Handoff | null;
  crew: RunKit["crew"];
  controlled: boolean[];
  /** A controlled player is deciding: the sol waits for them. */
  waitingFor: PlayerId[];
  reduced: boolean;
  /** Speed the scenes run at; 0 when paused. */
  speed: number;
  play(): void; pause(): void; step(): void; toggleFast(): void;
  restart(newSeed: boolean): void;
  setDesign(d: DesignId): void;
  toggleControl(p: PlayerId): void;
  choose(p: PlayerId, activity: ActivityId, target: Target): void;
  letDemoChoose(p: PlayerId): void;
  sceneBeat(p: PlayerId, ev: SolEvent): void;
  sceneDone(p: PlayerId): void;
  onSound: { current: ((ev: SolEvent) => void) | null };
}

export function useMarsRun(factory: RunFactory, opts: { seed?: number; design?: DesignId; autoplay?: boolean; handoff?: Handoff | null } = {}): MarsRun {
  const handoff = useMemo(() => (opts.handoff !== undefined ? opts.handoff : readHandoff()), [opts.handoff]);
  const [design, setDesignState] = useState<DesignId>(opts.design ?? (handoff ? "yours" : "good"));
  const [seed, setSeed] = useState(opts.seed ?? 7);
  const kit = useRef<RunKit | null>(null);
  const [, setVersion] = useState(0);
  const [phase, setPhase] = useState<Phase>("briefing");
  const [views, setViews] = useState<PlayerView[]>([]);
  const [after, setAfter] = useState<PlayerView[] | null>(null);
  const [report, setReport] = useState<SolReport | null>(null);
  const [evening, setEvening] = useState<EveningView[] | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>(() => readHistory());
  const [playId, setPlayId] = useState(0);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [revised, setRevised] = useState<PlayerId[]>([]);
  const reviewed = useRef(new Set<PlayerId>());
  /** Players the demo already tried this sol: a refused choice must not be asked again forever (they rest). */
  const tried = useRef(new Set<PlayerId>());
  const [running, setRunning] = useState(opts.autoplay ?? true);
  const [stepping, setStepping] = useState(false);
  const [fast, setFast] = useState(false);
  const [controlled, setControlled] = useState<boolean[]>([false, false, false, false]);
  const [ready, setReady] = useState<boolean[]>([false, false, false, false]);
  const reduced = useMemo(reducedMotion, []);
  const done = useRef(new Set<PlayerId>());
  const beatSeen = useRef(new Set<string>());
  const onSound = useRef<((ev: SolEvent) => void) | null>(null);
  const soloLog = useRef<Record<number, { lines: string[]; paths: Pos[][] }>>({});
  const go = running || stepping;

  const readViews = useCallback((): PlayerView[] => PLAYER_IDS.map((p) => kit.current!.engine.viewFor(p)), []);

  const begin = useCallback((s: number, d: DesignId) => {
    kit.current = factory({ seed: s, design: d, handoff });
    soloLog.current = {};
    setViews(readViews()); setAfter(null); setReport(null); setEvening(null); setResult(null); setReveals([]);
    setReady([false, false, false, false]); setStepping(false); setPhase("briefing"); setVersion((v) => v + 1);
    setRevised([]); reviewed.current = new Set(); tried.current = new Set();
  }, [factory, handoff, readViews]);

  useEffect(() => { begin(seed, design); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const k = fast ? 4 : 1;
  const active = (v: PlayerView) => v.self.status === "active";
  const needsChoice = (p: PlayerId) => views[p] && active(views[p]!) && !controlled[p] && !views[p]!.myChoice && !tried.current.has(p);
  // second round: players whose link works have seen the others' plans and may change theirs; a cut-off player never does
  const canRevise = (p: PlayerId) => !!views[p] && active(views[p]!) && views[p]!.self.linked && !controlled[p] && !reviewed.current.has(p);
  const waitingFor = PLAYER_IDS.filter((p) => views[p] && active(views[p]!) && controlled[p] && !ready[p]);

  const resolve = useCallback(() => {
    const e = kit.current!.engine;
    const before = readViews();
    const rep = e.resolveSol();
    const next = readViews();
    // what a cut-off player did alone is kept until their link is back, then shown to the others
    const back: Reveal[] = [];
    for (const q of PLAYER_IDS) {
      const log = (soloLog.current[q] ??= { lines: [], paths: [] });
      if (rep.cutOff.includes(q)) {
        for (const ev of rep.events) if (ev.scope === "solo" && ev.players.includes(q) && ev.kind !== "link") { log.lines.push(ev.text); if (ev.path) log.paths.push(ev.path); }
        if (next[q]!.self.linked && log.lines.length) { back.push({ player: q, name: before[q]!.self.name, lines: log.lines.slice(), paths: log.paths.slice() }); soloLog.current[q] = { lines: [], paths: [] }; }
      }
    }
    setViews(before); setAfter(next); setReport(rep); setReveals(back);
    setEvening(PLAYER_IDS.map((p) => e.eveningFor(p)));
    done.current = new Set(); beatSeen.current = new Set();
    setPlayId((n) => n + 1); setPhase("playing");
  }, [readViews]);

  // the phase machine: one timer at a time, none while paused
  useEffect(() => {
    if (!kit.current || !go) return;
    const e = kit.current.engine;
    let t: ReturnType<typeof setTimeout> | undefined;
    const later = (s: number, f: () => void) => { t = setTimeout(f, reduced ? 20 : (s * 1000) / k); };
    if (phase === "briefing") later(BRIEFING_S, () => setPhase("choosing"));
    else if (phase === "choosing") {
      const who = PLAYER_IDS.find((p) => needsChoice(p));
      if (who !== undefined) later(CHOOSE_GAP_S, () => {
        tried.current.add(who);
        const c = kit.current!.demo(who).choose(e.viewFor(who));
        if (c) e.choose(c); // a refused choice leaves the player resting: the world fills in a missing choice
        setViews(readViews());
      });
      else {
        const rev = PLAYER_IDS.find(canRevise);
        if (rev !== undefined) later(REVISE_GAP_S, () => {
          reviewed.current.add(rev);
          const v = e.viewFor(rev), c = kit.current!.demo(rev).choose(v), was = v.myChoice;
          if (c && was && (c.activity !== was.activity || JSON.stringify(c.target) !== JSON.stringify(was.target))) {
            const r = e.choose(c);
            if (!r || r.ok) setRevised((x) => (x.includes(rev) ? x : [...x, rev]));
          }
          setViews(readViews());
        });
        else if (waitingFor.length === 0) later(0.6, resolve);
      }
    } else if (phase === "evening") {
      later(EVENING_S, () => {
        if (report?.ended) {
          const r = e.result(), a = e.attempt();
          setResult(r); if (a) setAttempts(appendHistory(a));
          setPhase("ended");
        } else { setViews(after ?? readViews()); setAfter(null); setReveals(reveals); setStepping(false); setPhase("briefing"); }
      });
    } else if (phase === "playing") {
      // safety net: a scene that never reports its end must not hang the run
      later(45, () => setPhase("evening"));
    }
    return () => clearTimeout(t);
  }, [phase, go, k, views, controlled, ready, reduced, resolve]); // eslint-disable-line react-hooks/exhaustive-deps

  const sceneDone = useCallback((p: PlayerId) => {
    done.current.add(p);
    if (done.current.size >= 4) { setViews((v) => after ?? v); setPhase((ph) => (ph === "playing" ? "evening" : ph)); }
  }, [after]);

  const sceneBeat = useCallback((p: PlayerId, ev: SolEvent) => {
    const key = `${playId}:${ev.order}`;
    if (beatSeen.current.has(key)) return;
    beatSeen.current.add(key); void p;
    onSound.current?.(ev);
  }, [playId]);

  const api: MarsRun = {
    phase, views, after, report, evening, result, attempts, playId, reveals, revised, running, fast, seed, design, handoff, controlled, waitingFor, reduced,
    crew: kit.current?.crew ?? [], totalSols: views[0]?.totalSols ?? 30,
    sol: report && (phase === "playing" || phase === "evening" || phase === "ended") ? report.sol : views[0]?.sol ?? 1,
    speed: go ? k : 0, onSound,
    play: () => setRunning(true), pause: () => { setRunning(false); setStepping(false); },
    step: () => { if (phase === "ended") return; setRunning(false); setStepping(true); },
    toggleFast: () => setFast((f) => !f),
    restart: (newSeed) => { const s = newSeed ? Math.floor(Math.random() * 90000) + 1 : seed; setSeed(s); begin(s, design); },
    setDesign: (d) => { setDesignState(d); const s = Math.floor(Math.random() * 90000) + 1; setSeed(s); begin(s, d); },
    toggleControl: (p) => {
      setControlled((c) => c.map((x, i) => (i === p ? !x : x)));
      setReady((r) => r.map((x, i) => (i === p ? false : x)));
    },
    choose: (p, activity, target) => {
      const c: Choice = { player: p, activity, target };
      kit.current!.engine.choose(c);
      setReady((r) => r.map((x, i) => (i === p ? true : x)));
      setViews(readViews());
    },
    letDemoChoose: (p) => {
      const e = kit.current!.engine;
      if (!e.viewFor(p).myChoice) { const c = kit.current!.demo(p).choose(e.viewFor(p)); if (c) e.choose(c); }
      setReady((r) => r.map((x, i) => (i === p ? true : x))); setViews(readViews());
    },
    sceneBeat, sceneDone,
  };
  // a new sol clears who is ready (controlled players decide again every sol)
  const prevSol = useRef(0);
  useEffect(() => {
    const s = views[0]?.sol ?? 0;
    if (s !== prevSol.current) { prevSol.current = s; setReady([false, false, false, false]); setRevised([]); reviewed.current = new Set(); tried.current = new Set(); }
  }, [views]);
  return api;
}
