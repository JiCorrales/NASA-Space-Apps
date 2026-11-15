// MarsWorld: the state of a run and the rules of a sol. Seeded, with no drawing code and no randomness outside
// `roll`, so the same seed, design and choices replay the same run.
//
// A sol: beginSol (links, passes, faults) -> briefing (viewFor) -> choose -> resolveSol (the work, the hazards,
// power, the satellite, supplies, gauges, tasks) -> evening report (eveningFor) -> next sol.
import { ACTIVITIES } from "./activities";
import { deriveCapabilities } from "./capabilities";
import type { Hazard, HazardOccurrence } from "./contracts";
import { NASA, TEAM } from "./data";
import { HAZARDS } from "./hazards";
import { cheb, dist, findPath, generateMap, tileCost, type GameMap, type Site } from "./map";
import { MODULE_IDS, MODULES } from "./modules";
import { createPlayer, type Player } from "./player";
import { roll } from "./rng";
import { buildAttemptResult } from "./score";
import { TASKS } from "./tasks";
import { buildView } from "./view";
import {
  NO_TARGET, PLAYER_IDS, RUN_SOLS, type Act1Design, type Act1Extras, type Attempt, type Choice, type CrewSetup,
  type EveningView, type GaugeId, type HazardId, type LinkCause, type LoseReason, type ModuleId, type PlayerId, type PlayerView, type Pos,
  type RelayCapabilities, type RunResult, type SiteId, type SolEvent, type SolEventKind, type SolRecord, type SolReport,
  type TaskId, type Target,
} from "./types";

export interface WorldOptions {
  seed: number;
  design: Act1Design;
  extras?: Act1Extras;
  crew?: CrewSetup[];
  /** Override the derived capabilities (tests). */
  capabilities?: RelayCapabilities;
  /** Override the drawn hazards (tests). */
  hazards?: HazardOccurrence[];
  startedAt?: string;
}

export const DEFAULT_CREW: CrewSetup[] = [
  { name: "Mara", role: "commander", look: "round" },
  { name: "Dev", role: "engineer", look: "broad" },
  { name: "Ines", role: "scientist", look: "tall" },
  { name: "Kofi", role: "comms", look: "compact" },
];

export interface SatFault { kind: "scheduled" | "brownout"; since: number; deadline: number; diagnosed: boolean; diagWork: number; fixWork: number }
export interface SiteState { sampled: boolean; inLab: boolean; analysed: boolean; analysisWork: number; sentMb: number; earthMb: number }

export interface ChoiceResult { ok: boolean; reason?: string }

const SITE_IDS: SiteId[] = ["site-1", "site-2", "site-3"];
const LEVEL_EFFORT = [0.5, 1, 1.25, 1.4];
const LEVEL_FAIL = [0.35, 0.18, 0.1, 0.06];
const GAUGE_IDS: GaugeId[] = ["radiation", "energy", "rest", "air", "water", "food", "body", "morale"];
const DEAD: string[] = ["air", "water", "food", "body"];

export class MarsWorld {
  readonly seed: number;
  readonly design: Act1Design;
  readonly extras: Act1Extras;
  readonly caps: RelayCapabilities;
  readonly map: GameMap;
  readonly players: Player[];
  readonly crew: CrewSetup[];
  readonly schedule: HazardOccurrence[];
  readonly startedAt: string;

  sol = 1;
  status: "running" | "won" | "lost" = "running";
  loseReason: LoseReason | null = null;

  modules: Record<ModuleId, { built: boolean; progress: number; wear: number }>;
  stock = { oxygen: 0, water: 0, food: 0, materials: 0, spares: 0 };
  battery = TEAM.batteryStartWh.value;
  dust = 0;
  extraLoadWh = 0;
  planBonus = 0;
  powerShort = false;
  lastPower = { generatedWh: 0, usedWh: 0, storedWh: TEAM.batteryStartWh.value, capacityWh: TEAM.batteryWh.value };
  sites: Record<SiteId, SiteState>;
  analysedOrder: SiteId[] = [];
  bufferMb = 0;
  sat = { charge: 100, fault: null as SatFault | null, lost: false, saves: 0, passToday: false, passCapLeft: 0, forcedPass: false, storedMb: 0 };
  knownRadius: number;
  seen: Uint8Array;
  soloSeen = new Map<PlayerId, number[]>();

  choices: (Choice | null)[] = [null, null, null, null];
  events: SolEvent[] = [];
  news: string[] = [];
  lastReport: SolReport | null = null;
  records: SolRecord[] = [];
  taskDoneSol = new Map<TaskId, number>();
  result_: RunResult | null = null;

  /** What the team knows of each player. */
  teamKnown: { position: Pos; lastContactSol: number; log: { sol: number; activity: Choice["activity"]; target: Target }[]; pending: { sol: number; activity: Choice["activity"]; target: Target; texts: string[] }[] }[];
  wasLinked: boolean[] = [true, true, true, true];

  stats = {
    powerShortSols: 0, minBatteryWh: TEAM.batteryStartWh.value, dustOutputLostWh: 0, stormDose: 0, faultsOpened: 0,
    linkCuts: { "dust-storm": 0, distance: 0, "solar-storm": 0, "satellite-fault": 0, hardware: 0 } as Record<LinkCause, number>,
    deliveredSol: {} as Record<string, number>,
  };

  private order = 0;
  private gaugeSnap: number[][] = [];

  constructor(o: WorldOptions) {
    this.seed = o.seed;
    this.design = o.design;
    this.extras = o.extras ?? {};
    this.caps = o.capabilities ?? deriveCapabilities(o.design, this.extras);
    this.crew = o.crew ?? DEFAULT_CREW;
    this.startedAt = o.startedAt ?? new Date(0).toISOString();
    this.map = generateMap(o.seed);
    // four distinct tiles around the lander, none on a module's tile
    const offsets: Pos[] = [{ x: -1, y: 1 }, { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }];
    this.players = this.crew.map((c, i) => createPlayer(c.role, i as PlayerId, c.name, c.look, { x: this.map.base.x + offsets[i]!.x, y: this.map.base.y + offsets[i]!.y }));
    this.modules = Object.fromEntries(MODULE_IDS.map((id) => [id, { built: MODULES[id].builtAtStart, progress: 0, wear: 0 }])) as MarsWorld["modules"];
    const days = Math.max(1, RUN_SOLS + this.caps.supplyDays) * this.players.length;
    this.stock = { oxygen: days * NASA.oxygenPerDay.value, water: days * NASA.waterPerDay.value, food: days * NASA.foodPerDay.value, materials: this.caps.materialsKg, spares: this.caps.spares };
    this.sites = Object.fromEntries(SITE_IDS.map((id) => [id, { sampled: false, inLab: false, analysed: false, analysisWork: 0, sentMb: 0, earthMb: 0 }])) as MarsWorld["sites"];
    this.knownRadius = this.caps.mapRadiusStart;
    this.seen = new Uint8Array(this.map.width * this.map.height);
    this.schedule = o.hazards ?? HAZARDS.flatMap((h) => h.plan(o.seed, this.caps));
    this.teamKnown = this.players.map((p) => ({ position: { ...p.position }, lastContactSol: 1, log: [], pending: [] }));
    this.beginSol();
  }

  // ------------------------------------------------------------ small helpers used by activities and views

  siteIds(): SiteId[] { return SITE_IDS; }
  siteOf(id: SiteId): Site { return this.map.sites.find((s) => s.id === id)!; }
  modulePos(id: ModuleId): Pos { const o = MODULES[id].offset; return { x: this.map.base.x + o.x, y: this.map.base.y + o.y }; }
  atBase(p: Player): boolean { return cheb(p.position, this.map.base) <= 2; }
  linkRange(): number { return this.modules.antenna.built ? TEAM.antennaRange.value : TEAM.handheldRange.value; }
  batteryCap(): number { return TEAM.batteryWh.value + (this.modules.storage.built ? TEAM.storageBatteryWh.value : 0); }
  bufferCap(): number { return this.modules.storage.built ? TEAM.storageBufferMb.value : TEAM.baseBufferMb.value; }
  siteDelivered(id: SiteId): boolean { return this.sites[id].earthMb >= TEAM.datasetMb.value - 1e-6; }
  labSite(): SiteId | null { return SITE_IDS.find((id) => this.sites[id].inLab && !this.sites[id].analysed) ?? null; }
  rationsInStock(): number { return Math.min(this.stock.oxygen / NASA.oxygenPerDay.value, this.stock.water / NASA.waterPerDay.value, this.stock.food / NASA.foodPerDay.value); }
  takeRations(n: number) { this.stock.oxygen -= n * NASA.oxygenPerDay.value; this.stock.water -= n * NASA.waterPerDay.value; this.stock.food -= n * NASA.foodPerDay.value; }
  /** Air, water or food is gone from the stores and nobody has any left in their pack. */
  vitalsGone(): boolean {
    const dry = this.stock.oxygen <= 1e-6 || this.stock.water <= 1e-6 || this.stock.food <= 1e-6;
    return dry && this.players.every((p) => !p.active || p.carry.rations <= 0);
  }
  spendPower(wh: number) { this.battery -= wh; }
  respond(p: Player) { p.hazardResponses++; }

  occurrencesActive(id: HazardId): HazardOccurrence[] {
    return this.schedule.filter((o) => o.hazard === id && this.sol >= o.startSol && this.sol < o.startSol + o.durationSols);
  }
  stormIntensity(): number {
    const o = this.occurrencesActive("dust-storm")[0];
    if (!o) return 0;
    const k = this.sol - o.startSol;
    return o.intensity * (k === 0 || k === o.durationSols - 1 ? 0.5 : 1);
  }
  solarStormToday(): boolean { return this.occurrencesActive("solar-storm").length > 0; }

  idx(p: Pos): number { return p.y * this.map.width + p.x; }
  tileKnown(x: number, y: number): boolean { return dist({ x, y }, this.map.base) <= this.knownRadius || this.seen[y * this.map.width + x] === 1; }
  siteKnown(id: SiteId): boolean { const s = this.siteOf(id).pos; return this.tileKnown(s.x, s.y); }
  /** A site the player may pick: known to the team (if linked) or in sight (if not). */
  canSeeSite(p: Player, id: SiteId, informed: boolean): boolean {
    return (informed && this.siteKnown(id)) || cheb(p.position, this.siteOf(id).pos) <= TEAM.vision.value;
  }
  private markSeen(p: Player) {
    const V = TEAM.vision.value;
    for (let y = Math.max(0, p.position.y - V); y <= Math.min(this.map.height - 1, p.position.y + V); y++)
      for (let x = Math.max(0, p.position.x - V); x <= Math.min(this.map.width - 1, p.position.x + V); x++) {
        const i = y * this.map.width + x;
        if (p.linked) this.seen[i] = 1;
        else { let a = this.soloSeen.get(p.id); if (!a) { a = []; this.soloSeen.set(p.id, a); } a.push(i); }
      }
  }

  passableNear(t: Pos): Pos {
    const ok = (x: number, y: number) => this.map.tiles[y]?.[x] !== undefined && this.map.tiles[y]![x] !== "#";
    for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(t.x + dx, t.y + dy)) return { x: t.x + dx, y: t.y + dy };
    return t;
  }

  emit(kind: SolEventKind, players: PlayerId[], text: string, extra: Partial<SolEvent> = {}) {
    const solo = players.length > 0 && players.every((id) => !this.players[id]!.linked);
    this.events.push({ order: this.order++, kind, players, scope: solo ? "solo" : "team", text, ...extra });
  }

  sendUp(mb: number): number {
    mb = Math.max(0, mb);
    this.bufferMb -= mb; this.sat.storedMb += mb; this.sat.passCapLeft -= mb;
    let left = mb;
    for (const id of this.analysedOrder) {
      const s = this.sites[id], take = Math.min(left, TEAM.datasetMb.value - s.sentMb);
      if (take > 0) { s.sentMb += take; left -= take; }
    }
    return mb;
  }
  private downlink(mb: number) {
    this.sat.storedMb -= mb;
    let left = mb;
    for (const id of this.analysedOrder) {
      const s = this.sites[id], take = Math.min(left, s.sentMb - s.earthMb);
      if (take > 0) {
        const was = this.siteDelivered(id);
        s.earthMb += take; left -= take;
        if (!was && this.siteDelivered(id)) { this.stats.deliveredSol[id] = this.sol; this.emit("data", [], `The data from ${this.siteOf(id).name} reached Earth.`, { site: id, scope: "team" }); }
      }
    }
  }

  openFault(kind: SatFault["kind"]) {
    this.sat.fault = { kind, since: this.sol, deadline: this.sol + TEAM.satFaultWindow.value - 1, diagnosed: false, diagWork: 0, fixWork: 0 };
    this.stats.faultsOpened++;
    this.sat.passToday = false; this.sat.passCapLeft = 0;
    this.emit("satellite", [], "The satellite has stopped answering.", { scope: "team" });
  }

  // ------------------------------------------------------------ the start of a sol

  private beginSol() {
    this.events = []; this.order = 0; this.news = [];
    this.planBonus = 0; this.extraLoadWh = 0; this.powerShort = false;
    this.choices = [null, null, null, null];
    for (const p of this.players) { p.sheltered = false; p.outdoorsToday = false; }
    // satellite: scheduled faults open, passes are drawn
    if (!this.sat.fault && !this.sat.lost && this.schedule.some((o) => o.hazard === "satellite-fault" && o.startSol === this.sol)) this.openFault("scheduled");
    const working = !this.sat.fault && !this.sat.lost;
    this.sat.passToday = working && (this.sat.forcedPass || roll(this.seed, 40, this.sol) < this.caps.passSolFraction);
    this.sat.forcedPass = false;
    this.sat.passCapLeft = this.sat.passToday ? this.caps.relayMbPerSol : 0;
    // communicators
    for (const p of this.players) {
      if (!p.active) { p.linked = false; continue; }
      this.rollLink(p);
      const was = this.wasLinked[p.id]!;
      if (was && !p.linked) this.emit("link", [p.id], `${p.name}'s communicator has gone silent.`, { scope: "team" });
      if (!was && p.linked) this.reveal(p);
      this.wasLinked[p.id] = p.linked;
      if (p.linked) { this.teamKnown[p.id]!.position = { ...p.position }; this.teamKnown[p.id]!.lastContactSol = this.sol; }
      this.markSeen(p);
    }
  }

  private rollLink(p: Player) {
    const base = this.map.base;
    if (dist(p.position, base) > this.linkRange()) { p.linked = false; p.linkCause = "distance"; p.linkDownSols = 0; p.linkGuard = false; this.stats.linkCuts.distance++; return; }
    if (p.linkDownSols > 0) { p.linked = false; p.linkDownSols--; if (p.linkCause) this.stats.linkCuts[p.linkCause]++; return; }
    if (p.linkGuard) { p.linkGuard = false; p.linked = true; p.linkCause = null; return; }
    const i = this.stormIntensity();
    const comps: [LinkCause, number][] = [
      ["hardware", TEAM.linkFailBase.value],
      ["dust-storm", TEAM.linkFailDust.value * i],
      ["solar-storm", this.solarStormToday() ? TEAM.linkFailSolar.value : 0],
      ["satellite-fault", this.sat.fault || this.sat.lost ? TEAM.linkFailSatellite.value : 0],
    ];
    let keep = 1, top: LinkCause = "hardware", topV = -1;
    for (const [c, v] of comps) { keep *= 1 - v; if (v > topV) { topV = v; top = c; } }
    let pFail = 1 - keep;
    if (this.modules.antenna.built) pFail *= TEAM.linkAntennaFactor.value;
    pFail *= 1 + ((100 - p.commIntegrity) / 100) * 0.8;
    if (roll(this.seed, 50, this.sol, p.id) < pFail) {
      p.linked = false; p.linkCause = top;
      p.linkDownSols = this.modules.antenna.built ? 0 : TEAM.linkDownSols.value - 1;
      this.stats.linkCuts[top]++;
    } else { p.linked = true; p.linkCause = null; }
  }

  /** A player's link is back: the team learns what they did alone. */
  private reveal(p: Player) {
    const k = this.teamKnown[p.id]!;
    const sols = k.pending.length;
    if (sols) {
      const said = k.pending.flatMap((e) => e.texts).slice(-4).join(" ");
      this.news.push(`${p.name} is back in contact after ${sols} sol${sols > 1 ? "s" : ""} alone. ${said}`.trim());
      for (const e of k.pending) k.log.push({ sol: e.sol, activity: e.activity, target: e.target });
      k.pending = [];
    } else this.news.push(`${p.name} is back in contact.`);
    for (const i of this.soloSeen.get(p.id) ?? []) this.seen[i] = 1;
    this.soloSeen.delete(p.id);
    this.emit("link", [p.id], `${p.name}'s communicator is back.`, { scope: "team" });
  }

  // ------------------------------------------------------------ the briefing and the choice

  viewFor(id: PlayerId): PlayerView { return buildView(this, id); }
  views(): PlayerView[] { return PLAYER_IDS.map((id) => this.viewFor(id)); }

  /** Active players who have not chosen yet this sol. */
  waitingFor(): PlayerId[] { return this.players.filter((p) => p.active && !this.choices[p.id]).map((p) => p.id); }

  /** Players who may change their choice after seeing the others': active, communicator working. */
  revisable(): PlayerId[] { return this.players.filter((p) => p.active && p.linked).map((p) => p.id); }

  /** Round two: the views of the players who may revise, with `plans` filled from round one. */
  reviseViews(): PlayerView[] { return this.revisable().map((id) => this.viewFor(id)); }

  choose(c: Choice): ChoiceResult {
    if (this.status !== "running") return { ok: false, reason: "The run is over." };
    const p = this.players[c.player];
    if (!p || !p.active) return { ok: false, reason: "That player is out of action." };
    const act = ACTIVITIES[c.activity];
    if (!act) return { ok: false, reason: "Unknown activity." };
    if ((p.energy <= 5 || p.rest <= 5) && c.activity !== "rest" && c.activity !== "shelter") return { ok: false, reason: "Too exhausted to do more than rest." };
    const b = act.blocked(this, p, c.target);
    if (b && (!b.shared || p.linked)) return { ok: false, reason: b.reason };
    this.choices[p.id] = { player: p.id, activity: c.activity, target: c.target };
    return { ok: true };
  }

  // ------------------------------------------------------------ resolving the sol

  resolveSol(): SolReport {
    if (this.status !== "running") return this.lastReport!;
    const sol = this.sol;
    this.snapGauges();
    const linkedAtStart = this.players.map((p) => p.linked);
    const cutOff = this.players.filter((p) => p.active && !p.linked).map((p) => p.id);
    const finals: Choice[] = [];
    for (const p of this.players) {
      if (!p.active) continue;
      const c = this.choices[p.id] ?? { player: p.id, activity: "rest" as const, target: NO_TARGET };
      finals.push(c);
    }
    const phase = (c: Choice) => (c.activity === "plan" ? 0 : c.activity === "moveSupplies" ? 1 : 2);
    for (const c of [...finals].sort((a, b) => phase(a) - phase(b) || a.player - b.player)) { this.resolvePlayer(this.players[c.player]!, c); this.flushGauges(); }

    // hazards
    for (const h of HAZARDS) { this.applyHazard(h); this.flushGauges(); }
    const power = this.powerStep();
    this.flushGauges();
    this.satelliteStep();
    this.bodyStep();
    this.flushGauges();
    this.labStep();

    // what the team knows
    for (const c of finals) {
      const p = this.players[c.player]!, k = this.teamKnown[p.id]!;
      if (linkedAtStart[p.id]) { k.log.push({ sol, activity: c.activity, target: c.target }); k.position = { ...p.position }; k.lastContactSol = sol; }
      else k.pending.push({ sol, activity: c.activity, target: c.target, texts: this.events.filter((e) => e.kind === "work" && e.scope === "solo" && e.players[0] === p.id).map((e) => e.text) });
    }

    // tasks, win and lose
    for (const t of TASKS) if (!this.taskDoneSol.has(t.id) && t.isDone(this)) {
      this.taskDoneSol.set(t.id, sol);
      this.emit("task", [], `Done: ${t.name}.`, { scope: "team" });
      for (const p of this.players) if (p.active) p.morale = Math.min(100, p.morale + TEAM.moraleTaskDone.value);
    }
    let ended = false;
    if (TASKS.every((t) => t.isDone(this))) { this.status = "won"; ended = true; }
    else if (this.players.every((p) => !p.active)) { this.status = "lost"; this.loseReason = "crew-lost"; ended = true; }
    else if (this.vitalsGone()) { this.status = "lost"; this.loseReason = "resource-exhausted"; ended = true; }
    else if (sol >= RUN_SOLS) { this.status = "lost"; this.loseReason = "window-closed"; ended = true; }

    const report: SolReport = {
      sol, choices: finals, cutOff, events: this.events, ended, power,
      lines: this.eveningLines(power),
    };
    this.lastReport = report;
    this.records.push({
      sol, choices: finals,
      cutOff: cutOff.map((id) => ({ player: id, cause: this.players[id]!.linkCause, did: { activity: finals.find((f) => f.player === id)!.activity, target: finals.find((f) => f.player === id)!.target } })),
      events: this.events.filter((e) => !e.gauge).map((e) => e.text),
    });
    if (ended) this.result_ = buildAttemptResult(this);
    else { this.sol++; this.beginSol(); }
    return report;
  }

  private applyHazard(h: Hazard) {
    if (h.id === "dust-settling" || h.id === "satellite-fault") { h.apply(this, null); return; }
    for (const o of this.occurrencesActive(h.id)) h.apply(this, o);
  }

  private resolvePlayer(p: Player, c: Choice) {
    this.resolvePlayerWork(p, c);
    this.spread(p);
  }

  private resolvePlayerWork(p: Player, c: Choice) {
    let act = ACTIVITIES[c.activity], t = c.target;
    if ((p.energy <= 5 || p.rest <= 5) && act.id !== "rest" && act.id !== "shelter") {
      this.emit("work", [p.id], `${p.name} was too exhausted to do more than rest.`, { ok: false, activity: act.id });
      act = ACTIVITIES.rest; t = NO_TARGET;
    }
    const b = act.blocked(this, p, t);
    if (b) {
      this.emit("work", [p.id], `${p.name} could not ${act.name.toLowerCase()}: ${b.reason}`, { ok: false, activity: act.id, target: t, at: p.position });
      act = ACTIVITIES.rest; t = NO_TARGET;
    }
    act.prepare?.(this, p, t);
    const where = act.where(this, p, t);
    let fraction = 1, moved = false, arrived = true;
    if (where && cheb(p.position, where) > act.reach) {
      const path = findPath(this.map, p.position, where);
      if (!path) {
        this.emit("work", [p.id], `${p.name} found no way through to the place.`, { ok: false, activity: act.id, target: t });
        act = ACTIVITIES.rest; t = NO_TARGET;
      } else {
        moved = true;
        // leaving the base with an empty pack: the suit's own reserve is taken from the stores
        if (cheb(p.position, this.map.base) <= 3 && p.carry.rations === 0) {
          const n = Math.min(TEAM.suitReserve.value, Math.floor(this.rationsInStock()));
          if (n > 0) { this.takeRations(n); p.carry.rations = n; this.emit("supplies", [p.id], `${p.name} left with a suit reserve of ${n} sols.`, { amount: n }); }
        }
        let budget: number = TEAM.moveBudget.value;
        const from = { ...p.position }, walked: Pos[] = [];
        for (const step of path.path) {
          if (cheb(p.position, where) <= act.reach) break;
          const cost = this.stepCost(step);
          if (cost > budget) break;
          budget -= cost; p.position = { ...step }; walked.push(step);
        }
        arrived = cheb(p.position, where) <= act.reach;
        fraction = arrived ? 0.25 + 0.75 * (budget / TEAM.moveBudget.value) : 0;
        p.energy = Math.max(0, p.energy - TEAM.moveEnergy.value * (1 - budget / TEAM.moveBudget.value));
        p.outdoorsToday = true;
        this.markSeen(p);
        this.emit("move", [p.id], `${p.name} walked ${walked.length} tile${walked.length === 1 ? "" : "s"}${arrived ? "" : " and has farther to go"}.`, { from, at: { ...p.position }, path: walked, activity: act.id });
      }
    }
    if (act.id === "travel" || (moved && (!arrived || fraction < 0.4))) return;
    // the work
    const level = p.skillLevel(act.skill);
    const planned = p.linked && act.id !== "plan" ? this.planBonus : 0;
    const effort = TEAM.baseEffort.value * LEVEL_EFFORT[level]! * p.healthFactor() * fraction * (1 + planned);
    const storm = this.stormIntensity() > 0 && act.outdoors ? 0.05 : 0;
    const failP = act.fallible ? Math.max(0, LEVEL_FAIL[level]! + 0.07 * p.lowCount() + storm - planned * 0.15) : 0;
    const ok = !act.fallible || roll(this.seed, 60, this.sol, p.id) >= failP;
    if (act.outdoors) p.outdoorsToday = true;
    p.energy = Math.max(0, p.energy - (act.heavy ? 28 : act.id === "rest" ? 0 : 10) * (moved ? fraction : 1));
    if (ok) {
      const r = act.perform(this, p, t, { effort, fraction });
      this.emit("work", [p.id], r.text, { ok: r.ok, activity: act.id, target: t, at: { ...p.position } });
      if (r.ok && act.id !== "rest" && act.id !== "shelter") {
        p.workDone += effort;
        if (!p.linked) p.deadLinkActions++;
      }
    } else {
      this.emit("work", [p.id], `${p.name}'s attempt to ${act.name.toLowerCase()} went wrong.`, { ok: false, activity: act.id, target: t, at: { ...p.position } });
      if (act.outdoors && level === 0 && roll(this.seed, 61, this.sol, p.id) < 0.25) {
        p.body = Math.max(0, p.body - TEAM.accidentBody.value);
        this.emit("gauge", [p.id], `${p.name} was hurt in the attempt.`, { amount: TEAM.accidentBody.value });
      }
    }
  }

  /** Two people never end a move on one tile when a free tile beside them exists. */
  private spread(p: Player) {
    const taken = (x: number, y: number) => this.players.some((q) => q !== p && q.active && q.position.x === x && q.position.y === y);
    if (!taken(p.position.x, p.position.y)) return;
    const wasBase = this.atBase(p);
    let best: Pos | null = null, bd = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const x = p.position.x + dx, y = p.position.y + dy;
      const t = this.map.tiles[y]?.[x];
      if (t === undefined || t === "#" || taken(x, y)) continue;
      if (wasBase && cheb({ x, y }, this.map.base) > 2) continue;
      const d = Math.abs(dx) + Math.abs(dy) + tileCost(t) * 0.1;
      if (d < bd) { bd = d; best = { x, y }; }
    }
    if (best) p.position = best;
  }

  private snapGauges() { this.gaugeSnap = this.players.map((p) => GAUGE_IDS.map((g) => p.gaugeValue(g))); }

  /** Says, as it happens, every gauge that moved since the last look: who, which gauge, its new value. */
  private flushGauges() {
    const labels = Object.fromEntries(this.players[0]!.gauges().map((g) => [g.id, g.label.toLowerCase()]));
    for (const p of this.players) {
      const prev = this.gaugeSnap[p.id]!;
      GAUGE_IDS.forEach((g, i) => {
        const v = Math.round(p.gaugeValue(g) * 10) / 10;
        if (Math.abs(v - prev[i]!) < 0.5) return;
        prev[i] = v;
        this.emit("gauge", [p.id], `${p.name}'s ${labels[g]} is now ${v}.`, { gauge: g, value: v, at: { ...p.position } });
      });
    }
  }

  private stepCost(step: Pos): number { return tileCost(this.map.tiles[step.y]![step.x]!); }

  // ------------------------------------------------------------ the end of a sol

  private powerStep() {
    const i = this.stormIntensity(), arr = this.modules.array;
    const full = arr.built ? NASA.arrayFullWh.value : TEAM.landerWh.value;
    const gen = full * (arr.built ? 1 - this.dust : 1) * (1 - 0.9 * i) * (arr.built ? 1 - arr.wear / 200 : 1);
    if (arr.built) this.stats.dustOutputLostWh += full * this.dust;
    const load = TEAM.baseLoadWh.value + this.extraLoadWh;
    const net = this.battery + gen - load;
    this.powerShort = net < 0;
    this.battery = Math.min(this.batteryCap(), Math.max(0, net));
    this.stats.minBatteryWh = Math.min(this.stats.minBatteryWh, this.battery);
    if (this.powerShort) {
      this.stats.powerShortSols++;
      for (const p of this.players) if (p.active) { p.body = Math.max(0, p.body - 8); p.morale = Math.max(0, p.morale - 3); }
      this.emit("power", [], "The base ran out of power in the night. It is bitterly cold inside.", { scope: "team" });
    }
    this.lastPower = { generatedWh: Math.round(gen), usedWh: Math.round(load), storedWh: Math.round(this.battery), capacityWh: this.batteryCap() };
    return this.lastPower;
  }

  private satelliteStep() {
    if (!this.sat.fault && !this.sat.lost && this.sat.storedMb > 0) {
      const mb = Math.min(this.sat.storedMb, this.caps.dsnMbPerSol);
      this.downlink(mb);
    }
  }

  private bodyStep() {
    const eat = { air: NASA.oxygenPerDay.value, water: NASA.waterPerDay.value, food: NASA.foodPerDay.value };
    for (const p of this.players) {
      if (p.out && DEAD.includes(p.out)) continue;
      if (p.out) p.solsOut++;
      const away = cheb(p.position, this.map.base) > 3;
      let supplied: Record<"air" | "water" | "food", boolean>;
      if (away) {
        const has = p.carry.rations > 0;
        if (has) p.carry.rations--;
        supplied = { air: has, water: has, food: has };
      } else {
        const k = this.powerShort ? TEAM.powerShortOxygen.value : 1;
        const take = (stock: "oxygen" | "water" | "food", need: number) => { const ok = this.stock[stock] >= need; this.stock[stock] = Math.max(0, this.stock[stock] - need); return ok; };
        supplied = { air: take("oxygen", eat.air * k), water: take("water", eat.water * k), food: take("food", eat.food) };
      }
      if (!p.active) continue;
      for (const g of ["air", "water", "food"] as const) {
        p[g] = supplied[g] ? Math.min(100, p[g] + TEAM.suppliesRecover.value) : Math.max(0, p[g] - TEAM.suppliesLoss.value);
      }
      const indoors = this.atBase(p) && !p.outdoorsToday;
      p.dose += NASA.dosePerSol.value * (indoors ? TEAM.indoorsDose.value : 1);
      p.energy = Math.min(100, p.energy + TEAM.energyPerSol.value * (p.rest < TEAM.lowGauge.value ? 0.5 : 1));
      p.rest = Math.max(0, p.rest - TEAM.restPerSol.value);
      p.morale = p.linked ? Math.min(100, p.morale + TEAM.moraleLinked.value) : Math.max(0, p.morale - TEAM.moraleCutOff.value);
      const reason = p.dose >= NASA.careerLimit.value ? "radiation" : p.air <= 0 ? "air" : p.water <= 0 ? "water" : p.food <= 0 ? "food" : p.body <= 0 ? "body" : p.morale <= 0 ? "morale" : null;
      if (reason) {
        p.out = reason; p.outSol = this.sol;
        for (const s of p.carry.samples) this.sites[s].sampled = false;
        p.carry.samples = [];
        this.emit("out", [p.id], `${p.name} can no longer work.`, { scope: "team" });
      }
    }
  }

  private labStep() {
    for (const p of this.players) {
      if (!p.active || !this.atBase(p) || p.carry.samples.length === 0) continue;
      for (const s of p.carry.samples) this.sites[s].inLab = true;
      this.emit("supplies", [p.id], `${p.name} left ${p.carry.samples.length} sample${p.carry.samples.length > 1 ? "s" : ""} in the lab.`, {});
      p.carry.samples = [];
    }
  }

  private eveningLines(power: SolReport["power"]): string[] {
    const lines = this.events.filter((e) => e.scope === "team" && !e.gauge).map((e) => e.text);
    lines.push(`Power: the array made ${power.generatedWh} Wh and the base used ${power.usedWh} Wh; the battery holds ${power.storedWh} Wh.`);
    if (this.bufferMb > 0) lines.push(`${Math.round(this.bufferMb)} Mb of data wait at the base.`);
    return lines;
  }

  /** What one player may read this evening. A cut-off player reads only their own sol and the sky. */
  eveningFor(id: PlayerId): EveningView {
    const r = this.lastReport;
    if (!r) return { sol: this.sol, events: [], lines: [] };
    const cut = r.cutOff.includes(id);
    const events = r.events.filter((e) => {
      if (cut) return e.players.includes(id) || (e.kind === "hazard" && (e.hazard === "dust-storm" || e.hazard === "solar-storm"));
      return e.scope === "team";
    });
    const lines = cut ? [...events.map((e) => e.text), "Your communicator was silent today."] : r.lines;
    return { sol: r.sol, events, lines };
  }

  // ------------------------------------------------------------ after the run

  result(): RunResult | null { return this.result_; }

  attempt(): Attempt | null {
    if (!this.result_) return null;
    return {
      id: `${this.seed}-${this.startedAt}`, startedAt: this.startedAt, seed: this.seed, design: this.design, extras: this.extras,
      crew: this.crew, capabilities: this.caps, sols: this.records, result: this.result_,
    };
  }
}
