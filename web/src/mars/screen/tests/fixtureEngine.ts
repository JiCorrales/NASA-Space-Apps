// A small hand-written stand-in for `MarsWorld`: it only has to produce well-formed views and reports so the screen
// can be built and tested. It is NOT the rules and is never shipped as the game (see main.tsx).
import type {
  ActivityId, ActivityOption, Attempt, Choice, CrewSetup, CrewView, EveningView, GaugeId, GaugeView, ModuleId,
  ModuleView, ObjectView, PlayerController, PlayerId, PlayerView, PlanView, Pos, ResourceView, Role, RunResult,
  SiteId, SiteView, SolEvent, SolReport, TaskId, TaskView, Warning,
} from "../../types";
import { NO_TARGET, PLAYER_IDS, RUN_SOLS } from "../../types";
import type { DesignId, MarsEngine, RunKit } from "../engine";

const W = 40, H = 24, BASE: Pos = { x: 6, y: 12 };
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const SITES: { id: SiteId; name: string; pos: Pos }[] = [
  { id: "site-1", name: "Dune Edge", pos: { x: 14, y: 10 } }, { id: "site-2", name: "Ridge Foot", pos: { x: 21, y: 16 } },
  { id: "site-3", name: "Far Basin", pos: { x: 29, y: 8 } },
];
const MODULES: { id: ModuleId; name: string; pos: Pos; needed: number }[] = [
  { id: "habitat", name: "Habitat", pos: { x: 7, y: 11 }, needed: 3 }, { id: "array", name: "Solar array", pos: { x: 9, y: 13 }, needed: 3 },
  { id: "antenna", name: "Antenna", pos: { x: 5, y: 10 }, needed: 3 }, { id: "storage", name: "Storage", pos: { x: 8, y: 15 }, needed: 3 },
];

function tileAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= W || y >= H) return "?";
  const rim = Math.abs(Math.hypot(x - 24, y - 5) - 3.4) < 0.6;
  if (rim) return "#";
  const n = Math.sin(x * 0.9 + y * 0.4) + Math.sin(y * 1.3 - x * 0.2) + Math.sin((x + y) * 0.35);
  if (Math.hypot(x - BASE.x, y - BASE.y) < 3.2) return ".";
  return n > 1.5 ? "^" : n > 0.7 ? "~" : n > -0.3 ? "," : ".";
}

export const FIXTURE_CREW: CrewSetup[] = [
  { name: "Ines", role: "commander", look: "amber" }, { name: "Marco", role: "engineer", look: "teal" },
  { name: "Aiko", role: "scientist", look: "violet" }, { name: "Zed", role: "comms", look: "coral" },
];

const SKILLED: Record<Role, ActivityId[]> = {
  commander: ["plan", "moveSupplies", "firstAid"], engineer: ["build", "repair", "clearDust"],
  scientist: ["sample", "analyse", "readMap"], comms: ["restoreLink", "schedulePass", "sendData"],
};
const NAMES: Record<ActivityId, string> = {
  build: "Build a module", repair: "Repair", clearDust: "Clear dust", sample: "Take a sample", analyse: "Analyse a sample",
  readMap: "Read the satellite map", restoreLink: "Restore a link", schedulePass: "Schedule a pass", sendData: "Send data",
  moveSupplies: "Move supplies", firstAid: "First aid", rest: "Rest", shelter: "Shelter", plan: "Plan the sol",
  travel: "Travel", diagnoseSatellite: "Diagnose the satellite", recoverSatellite: "Recover the satellite",
};
const TARGET_KIND: Partial<Record<ActivityId, ActivityOption["targetKind"]>> = {
  build: "module", repair: "module", clearDust: "module", sample: "site", analyse: "site", sendData: "site", firstAid: "player", travel: "tile",
};
const OFFERED: ActivityId[] = ["build", "repair", "clearDust", "sample", "analyse", "readMap", "restoreLink", "schedulePass", "sendData", "moveSupplies", "firstAid", "rest", "shelter", "plan", "travel"];

const GAUGE_META: Record<GaugeId, [string, string, string]> = {
  radiation: ["Radiation dose", "mSv", "HL10"], energy: ["Energy", "%", "team"], rest: ["Rest", "%", "HL28"], air: ["Air", "%", "HL19"],
  water: ["Water", "%", "HL20"], food: ["Food", "%", "HL21"], body: ["Body", "%", "team"], morale: ["Morale", "%", "team"],
};

interface Pl { pos: Pos; g: Record<GaugeId, number>; out: boolean; linkDown: boolean; sampled: SiteId[]; log: { sol: number; activity: ActivityId; target: typeof NO_TARGET }[] }

export function createFixtureEngine(seed: number, design: DesignId, crew: CrewSetup[] = FIXTURE_CREW): RunKit {
  const ROLES: Role[] = crew.map((c) => c.role);
  const r = rng(seed);
  const speed = design === "good" ? 1.5 : design === "middling" ? 1 : 0.55;
  let sol = 1, outcome: RunResult | null = null;
  const choices = new Map<PlayerId, Choice>();
  const mod: Record<ModuleId, number> = { habitat: 0, array: 0, antenna: 0, storage: 0 };
  const sites: Record<SiteId, { sampled: boolean; sent: number }> = { "site-1": { sampled: false, sent: 0 }, "site-2": { sampled: false, sent: 0 }, "site-3": { sampled: false, sent: 0 } };
  let satellite: "working" | "trouble" | "lost" = "working", satFixed = false, knownR = 7;
  const stormFrom = 8 + Math.floor(r() * 4), stormLen = 3, solarSol = 18 + Math.floor(r() * 4);
  const cutOffSols = new Map<number, PlayerId>();
  for (const s of [5, 6, 13, 14, 15, 22]) cutOffSols.set(s, ((s * 7 + seed) % 4) as PlayerId);
  const pl: Pl[] = crew.map((_, i) => ({
    pos: { x: BASE.x + (i % 2), y: BASE.y + 1 + Math.floor(i / 2) }, out: false, linkDown: false, sampled: [], log: [],
    g: { radiation: 0, energy: 90, rest: 85, air: 100, water: 100, food: 100, body: 100, morale: 80 },
  }));
  const known: Record<number, { sol: number; activity: ActivityId; target: typeof NO_TARGET }[]> = { 0: [], 1: [], 2: [], 3: [] };
  const history: { sol: number; events: string[] }[] = [];
  const skyOf = (s: number) => (s >= stormFrom && s < stormFrom + stormLen ? "dust" : s === stormFrom - 1 ? "hazy" : "clear") as "clear" | "hazy" | "dust";
  const linkedNow = (p: PlayerId) => cutOffSols.get(sol) !== p && !pl[p]!.out;
  const wantsTask = (): TaskView[] => {
    const tasks: [TaskId, string, string, number, number][] = [
      ["power-up", "Power up the base", "Habitat and array working", Math.min(mod.habitat, 3) + Math.min(mod.array, 3), 6],
      ["antenna", "Raise the antenna", "Antenna working", mod.antenna, 3],
      ["samples", "Sample three sites and send the data", "Three samples sent", Object.values(sites).filter((s) => s.sent > 0).length, 3],
      ["satellite", "Save the satellite", "Satellite working again", satFixed ? 1 : 0, 1],
    ];
    return tasks.map(([id, name, summary, progress, total]) => ({ id, name, summary, progress, total, done: progress >= total, failed: false }));
  };

  const patch = (p: Pos, rad = 4) => ({ x0: p.x - rad, y0: p.y - rad, width: rad * 2 + 1, height: rad * 2 + 1,
    rows: Array.from({ length: rad * 2 + 1 }, (_, j) => Array.from({ length: rad * 2 + 1 }, (_, i) => tileAt(p.x - rad + i, p.y - rad + j)).join("")) });

  function options(p: PlayerId): ActivityOption[] {
    const role = ROLES[p]!;
    return OFFERED.map((id) => {
      const kind = TARGET_KIND[id] ?? "none";
      const targets = kind === "module" ? MODULES.map((m) => ({ kind: "module" as const, id: m.id })) : kind === "site" ? SITES.map((s) => ({ kind: "site" as const, id: s.id }))
        : kind === "player" ? PLAYER_IDS.filter((q) => q !== p).map((q) => ({ kind: "player" as const, id: q })) : [];
      const blocked = id === "restoreLink" && linkedNow(p) ? "Your communicator works." : id === "clearDust" && mod.array < 3 ? "The array is not built." : null;
      return { id, name: NAMES[id], summary: `${NAMES[id]}. ${SKILLED[role].includes(id) ? "Your role does this best." : "Slower without the skill."}`, targetKind: kind, targets,
        skilled: SKILLED[role].includes(id), own: SKILLED[role].includes(id), blocked };
    });
  }

  function gaugeViews(p: PlayerId): GaugeView[] {
    return (Object.keys(GAUGE_META) as GaugeId[]).map((id) => {
      const [label, unit, source] = GAUGE_META[id]; const v = pl[p]!.g[id];
      const max = id === "radiation" ? 600 : 100; const good = id === "radiation" ? 1 - v / max : v / max;
      return { id, label, value: Math.round(v), max, unit, good, low: good < 0.3, source };
    });
  }

  function resources(): ResourceView[] {
    const power = Math.round(2400 + mod.array * 700 - (skyOf(sol) === "dust" ? 1800 : 0));
    return [
      { kind: "power", label: "Power", value: power, unit: "Wh/sol", detail: "Array output", source: "D28" },
      { kind: "mass", label: "Mass", value: 380 - sol * 6, unit: "kg", detail: "Supplies and spares", source: "team" },
      { kind: "budget", label: "Budget", value: 12, unit: "M$", detail: "Left from Act 1", source: "team" },
      { kind: "data", label: "Data", value: Object.values(sites).filter((s) => s.sampled && !s.sent).length * 120, unit: "Mb", detail: "Waiting to be sent", source: "team" },
      { kind: "communications", label: "Links", value: PLAYER_IDS.filter(linkedNow).length, unit: "of 4", detail: "Communicators working", source: "C17" },
      { kind: "time", label: "Time", value: RUN_SOLS - sol + 1, unit: "sols", detail: "Until the window closes", source: "team" },
    ];
  }

  function viewFor(p: PlayerId): PlayerView {
    const me = pl[p]!, role = ROLES[p]!, linked = linkedNow(p);
    const objs: ObjectView[] = [];
    const near = (q: Pos) => Math.hypot(q.x - me.pos.x, q.y - me.pos.y) <= 5;
    MODULES.forEach((m) => { if (near(m.pos)) objs.push({ kind: "module", id: m.id, label: m.name, pos: m.pos, state: mod[m.id] >= m.needed ? "working" : mod[m.id] > 0 ? "building" : "absent" }); });
    SITES.forEach((s) => { if (near(s.pos)) objs.push({ kind: "site", id: s.id, label: s.name, pos: s.pos, state: sites[s.id].sampled ? "sampled" : "found" }); });
    PLAYER_IDS.forEach((q) => { if (q !== p && near(pl[q]!.pos)) objs.push({ kind: "player", id: String(q), label: crew[q]!.name, pos: pl[q]!.pos, state: "active" }); });
    const warn: Warning[] = sol < stormFrom && stormFrom - sol <= 2 && design !== "poor" ? [{ hazard: "dust-storm", inSols: stormFrom - sol, text: `Storm front expected in ${stormFrom - sol} sol${stormFrom - sol > 1 ? "s" : ""}.` }] : [];
    const crewViews: CrewView[] = PLAYER_IDS.map((q) => {
      const c = choices.get(q);
      return { id: q, name: crew[q]!.name, look: crew[q]!.look, role: ROLES[q]!, status: pl[q]!.out ? "out" : "active", linked: linkedNow(q), position: pl[q]!.pos,
        plan: linked && c && linkedNow(q) ? { player: q, activity: c.activity, target: c.target } : null, known: known[q]!, lastContactSol: linkedNow(q) ? sol : sol - 1 };
    });
    const plans: PlanView[] | null = linked ? crewViews.filter((c) => c.id !== p && c.plan).map((c) => c.plan!) : null;
    return {
      sol, totalSols: RUN_SOLS,
      self: { id: p, name: crew[p]!.name, look: crew[p]!.look, role, position: me.pos, status: me.out ? "out" : "active", outReason: null, gauges: gaugeViews(p),
        skills: [], carrying: { rations: 3, samples: me.sampled, spares: 1 }, linked },
      surroundings: { patch: patch(me.pos), sky: skyOf(sol), objects: objs },
      options: options(p),
      briefing: [`Sol ${sol}. ${skyOf(sol) === "dust" ? "The sky is thick with dust." : "The sky is clear."}`, linked ? "Your communicator works." : "Your communicator is down. You decide alone."],
      shared: linked ? {
        map: { width: W, height: H, rows: Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (Math.hypot(x - BASE.x, y - BASE.y) <= knownR || PLAYER_IDS.some((q) => Math.hypot(x - pl[q]!.pos.x, y - pl[q]!.pos.y) <= 4) ? tileAt(x, y) : "?")).join("")), base: BASE, knownRadius: knownR },
        sites: SITES.map((s): SiteView => ({ id: s.id, name: s.name, pos: s.pos, sampled: sites[s.id].sampled, analysed: sites[s.id].sent > 0, sentMb: sites[s.id].sent, datasetMb: 120, deliveredMb: sites[s.id].sent })),
        modules: MODULES.map((m): ModuleView => ({ id: m.id, name: m.name, status: mod[m.id] >= m.needed ? "working" : mod[m.id] > 0 ? "building" : "absent", progress: mod[m.id], needed: m.needed, pos: m.pos, effect: m.id === "antenna" ? "Shortens link failures" : "Part of the base" })),
        resources: resources(), forecast: warn, tasks: wantsTask(), satellite: { state: satellite, passToday: sol % 2 === 0, passMinutes: 14, passes: 3, capacityMb: 400, storedMb: 60, storageMb: 500, diagnosed: satFixed },
        crew: crewViews, news: history.at(-1)?.events.slice(0, 3) ?? [] } : null,
      plans, myChoice: choices.get(p) ?? null,
    };
  }

  const line = (a: Pos, b: Pos): Pos[] => {
    const out: Pos[] = []; let { x, y } = a;
    while ((x !== b.x || y !== b.y) && out.length < 40) { x += Math.sign(b.x - x); y += Math.sign(b.y - y); out.push({ x, y }); }
    return out;
  };
  const targetPos = (c: Choice): Pos => c.target.kind === "module" ? MODULES.find((m) => m.id === (c.target as { id: ModuleId }).id)!.pos : c.target.kind === "site" ? SITES.find((s) => s.id === (c.target as { id: SiteId }).id)!.pos : c.activity === "restoreLink" || c.activity === "rest" || c.activity === "shelter" || c.activity === "plan" ? BASE : BASE;

  function resolveSol(): SolReport {
    const events: SolEvent[] = []; let order = 0;
    const push = (e: Omit<SolEvent, "order">) => events.push({ order: order++, ...e });
    const cut = cutOffSols.get(sol); const cutList: PlayerId[] = cut !== undefined ? [cut] : [];
    if (skyOf(sol) === "dust" && sol === stormFrom) push({ kind: "hazard", players: [], scope: "team", text: "A dust storm rolls over the base.", hazard: "dust-storm" });
    if (cut !== undefined) push({ kind: "link", players: [cut], scope: "team", text: `${crew[cut]!.name}'s communicator goes down.`, ok: false });
    if (sol === solarSol) push({ kind: "hazard", players: [], scope: "team", text: "A solar storm: the crew takes shelter.", hazard: "solar-storm" });
    if (sol % 2 === 0) push({ kind: "pass", players: [], scope: "team", text: "The satellite passes over the base." });
    for (const p of PLAYER_IDS) {
      const c = choices.get(p) ?? { player: p, activity: "rest" as ActivityId, target: NO_TARGET };
      const me = pl[p]!; if (me.out) continue;
      const scope = cut === p ? "solo" : "team";
      const dest = targetPos(c); const path = line(me.pos, dest).slice(0, 12);
      if (path.length) { push({ kind: "move", players: [p], scope, text: `${crew[p]!.name} walks.`, from: me.pos, path, at: path.at(-1) }); me.pos = path.at(-1)!; }
      const skilled = SKILLED[ROLES[p]!].includes(c.activity); const ok = r() < (skilled ? 0.9 : 0.55) * Math.min(1, speed);
      push({ kind: "work", players: [p], scope, text: `${crew[p]!.name}: ${NAMES[c.activity]}.`, at: me.pos, activity: c.activity, target: c.target, ok });
      me.log.push({ sol, activity: c.activity, target: NO_TARGET });
      if (cut === p) known[p]!.push({ sol, activity: c.activity, target: NO_TARGET });
      const gain = ok ? (skilled ? 1.5 : 1) * speed : 0;
      if (c.target.kind === "module" && (c.activity === "build" || c.activity === "repair")) {
        const id = c.target.id; const before = mod[id]; mod[id] = Math.min(3, mod[id] + Math.round(gain + 0.4));
        if (mod[id] !== before) push({ kind: "module", players: [p], scope, text: `${MODULES.find((m) => m.id === id)!.name} ${mod[id] >= 3 ? "is working" : "grows"}.`, module: id, at: MODULES.find((m) => m.id === id)!.pos, ok: true });
      }
      if (c.activity === "sample" && c.target.kind === "site" && ok && !sites[c.target.id].sampled) { sites[c.target.id].sampled = true; me.sampled.push(c.target.id); push({ kind: "data", players: [p], scope, text: "A sample is in the bag.", site: c.target.id, ok: true }); }
      if (c.activity === "sendData" && c.target.kind === "site" && sites[c.target.id].sampled && ok) { sites[c.target.id].sent = 120; push({ kind: "data", players: [p], scope, text: "Data goes up the relay.", site: c.target.id, ok: true }); }
      if (c.activity === "readMap") knownR += 2;
      if (c.activity === "restoreLink" && ok) satFixed = satFixed || sol > 10;
      me.g.energy = Math.max(0, me.g.energy - 12 + (c.activity === "rest" ? 28 : 0)); me.g.rest = Math.max(0, me.g.rest - 5 + (c.activity === "rest" ? 15 : 0));
      me.g.air -= 0.8; me.g.water -= 1; me.g.food -= 1; me.g.radiation += sol === solarSol && c.activity !== "shelter" ? 90 : 0.7;
      me.g.morale = Math.max(0, me.g.morale + (cut === p ? -8 : ok ? 2 : -2)); me.g.body -= ok ? 0.5 : 2;
      push({ kind: "gauge", players: [p], scope, text: `${crew[p]!.name}'s gauges move.`, amount: -12 });
    }
    if (cut !== undefined && cutOffSols.get(sol + 1) !== cut) push({ kind: "link", players: [cut], scope: "solo", text: `${crew[cut]!.name}'s communicator is back.`, ok: true });
    const tasks = wantsTask();
    tasks.filter((t) => t.done).forEach((t) => { if (!done.has(t.id)) { done.set(t.id, sol); push({ kind: "task", players: [], scope: "team", text: `Done: ${t.name}.`, ok: true }); } });
    history.push({ sol, events: events.map((e) => e.text) });
    const report: SolReport = { sol, choices: [...choices.values()], cutOff: cutList, events, lines: [`Sol ${sol} is over.`, ...events.filter((e) => e.kind === "task" || e.kind === "hazard").map((e) => e.text)],
      power: { generatedWh: 3000, usedWh: 2600, storedWh: 9000, capacityWh: 12000 }, ended: false };
    choices.clear();
    const won = done.size === 4 || false; const lost = sol >= RUN_SOLS && !won;
    sol++;
    if (won || lost) { report.ended = true; outcome = makeResult(won); }
    return report;
  }
  const done = new Map<TaskId, number>();
  function makeResult(won: boolean): RunResult {
    const tasks = wantsTask().map((t) => ({ id: t.id, name: t.name, done: t.done, failed: false, doneOnSol: done.get(t.id) ?? null }));
    return { outcome: won ? "won" : "lost", loseReason: won ? null : "window-closed", endedOnSol: sol - 1, tasks,
      score: { tasksCompleted: done.size, tasksTotal: 4, scienceDelivered: { sites: Object.values(sites).filter((s) => s.sent).length, megabits: Object.values(sites).reduce((a, s) => a + s.sent, 0) },
        resourcesLeft: [{ label: "Supplies", value: 380 - sol * 6, unit: "kg" }], decisions: { hazardResponses: 3, deadLinkActions: 2, lines: ["Sheltered from the solar storm.", "Kept working while cut off."] },
        components: { tasks: done.size * 100, science: 80, resources: 60, decisions: 40 }, total: done.size * 100 + 180,
        perRole: PLAYER_IDS.map((p) => ({ role: ROLES[p]!, player: p, name: crew[p]!.name, workDone: 8 + p, hazardResponses: 1, deadLinkActions: p === 0 ? 1 : 0, solsOut: 0, line: `${crew[p]!.name} did the work of the ${ROLES[p]}.` })) },
      causes: won ? [] : [{ sol: RUN_SOLS, hazard: "time", text: "The window home closed before the list was done." }], hazardsSeen: ["dust-storm", "solar-storm"] };
  }

  const engine: MarsEngine = {
    viewFor, choose: (c) => { choices.set(c.player, c); }, resolveSol,
    eveningFor: (): EveningView => { const h = history.at(-1); return { sol: h?.sol ?? 0, events: [], lines: h?.events.slice(0, 4) ?? [] }; },
    result: () => outcome,
    attempt: (): Attempt | null => outcome ? { id: `fx-${seed}-${design}`, startedAt: "2026-11-15T00:00:00Z", seed, design: { satellite: design }, extras: {}, crew,
      capabilities: {} as never, sols: [], result: outcome } : null,
  };
  const demo = (p: PlayerId): PlayerController => ({ player: p, choose: (view) => {
    const role = ROLES[p]!; const open = view.options.filter((o) => !o.blocked);
    const want: ActivityId[] = sol < 6 ? ["build", "build", "readMap", "restoreLink"] : sol < 16 ? ["sample", "build", "sendData", "sendData"] : ["analyse", "repair", "sendData", "plan"];
    const id = (SKILLED[role].includes(want[p]!) ? want[p]! : SKILLED[role][sol % 3]!);
    const o = open.find((x) => x.id === id) ?? open[0]!;
    const t = o.targets.length ? (o.targets.find((x) => x.kind === "module" && mod[x.id] < 3) ?? o.targets.find((x) => x.kind === "site" && !sites[x.id].sampled) ?? o.targets[sol % o.targets.length]!) : NO_TARGET;
    return { player: p, activity: o.id, target: t };
  } });
  return { engine, demo, crew };
}

import type { RunFactory } from "../engine";
export const fixtureFactory: RunFactory = ({ seed, design, handoff }) => createFixtureEngine(seed, design, handoff && design === "yours" ? handoff.crew : FIXTURE_CREW);
