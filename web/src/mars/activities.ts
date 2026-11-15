// The activities. Each is one object: what it needs, where it is done, what it does to the world.
// Any role may attempt any activity; the world makes it slower and less steady without the skill.
import type { Activity, Block, PerformResult } from "./contracts";
import { MODULES } from "./modules";
import { TEAM } from "./data";
import { cheb } from "./map";
import type { MarsWorld } from "./world";
import type { Player } from "./player";
import type { ActivityId, ModuleId, SiteId, Target } from "./types";

const NONE: Target = { kind: "none" };
const block = (reason: string, shared = true): Block => ({ reason, shared });
const SKILLED_EFFORT = TEAM.baseEffort.value * 1.25;

type Partial_ = Pick<Activity, "id" | "name" | "summary" | "skill" | "targetKind"> & Partial<Activity>;

function make(a: Partial_): Activity {
  return {
    heavy: false, outdoors: false, reach: 2, fallible: true,
    blocked: () => null,
    where: (w) => w.map.base,
    targets: () => [],
    perform: () => ({ text: "", ok: true }),
    ...a,
  } as Activity;
}

const atBasePlayers = (w: MarsWorld): Player[] => w.players.filter((q) => q.active && w.atBase(q));
const playerTargets = (ps: Player[]): Target[] => ps.map((q) => ({ kind: "player", id: q.id }));

function visiblePlayers(w: MarsWorld, p: Player, informed: boolean, filter: (q: Player) => boolean = () => true): Player[] {
  return w.players.filter((q) => q.active && filter(q) && (q.id === p.id || informed || cheb(q.position, p.position) <= TEAM.vision.value));
}

const playerOf = (w: MarsWorld, t: Target): Player | null => (t.kind === "player" ? w.players[t.id] ?? null : null);

export const ACTIVITIES: Record<ActivityId, Activity> = {
  build: make({
    id: "build", name: "Build", summary: "Work on a base module: spends materials, power and sols.", skill: "construction", targetKind: "module",
    heavy: true, outdoors: true,
    blocked(w, _p, t) {
      if (t.kind !== "module") return block("Pick a module to build.", false);
      const m = MODULES[t.id], st = w.modules[t.id];
      if (st.built) return block(`The ${m.name.toLowerCase()} is built.`, false);
      if (w.stock.materials < m.materialsKg / m.workUnits) return block("Not enough materials left.");
      if (w.battery < m.powerWhPerWork) return block("Not enough power stored.");
      return null;
    },
    targets: (w, p, informed) => (!informed && !w.atBase(p) ? [] : (["array", "antenna", "storage"] as ModuleId[]).filter((id) => !w.modules[id].built).map((id) => ({ kind: "module" as const, id }))),
    perform(w, p, t, c): PerformResult {
      const id = (t as { id: ModuleId }).id, m = MODULES[id], st = w.modules[id];
      const perWork = m.materialsKg / m.workUnits;
      const delta = Math.min(c.effort, m.workUnits - st.progress, w.stock.materials / perWork, w.battery / m.powerWhPerWork);
      if (delta <= 0) return { text: `${p.name} could not go on with the ${m.name.toLowerCase()}: materials or power ran short.`, ok: false };
      w.stock.materials -= delta * perWork;
      w.spendPower(delta * m.powerWhPerWork);
      st.progress += delta;
      if (st.progress >= m.workUnits - 1e-9) {
        st.built = true; st.progress = m.workUnits;
        w.emit("module", [p.id], `The ${m.name.toLowerCase()} is built.`, { module: id, at: w.modulePos(id) });
        return { text: `${p.name} finished the ${m.name.toLowerCase()}.`, ok: true };
      }
      return { text: `${p.name} worked on the ${m.name.toLowerCase()}: ${Math.round(st.progress * 10) / 10} of ${m.workUnits} done.`, ok: true };
    },
  }),

  repair: make({
    id: "repair", name: "Repair", summary: "Fix the array, or a teammate's communicator. Uses a spare part.", skill: "repair", targetKind: "module",
    heavy: true, outdoors: true,
    blocked(w, p, t) {
      if (t.kind === "module") {
        if (t.id !== "array" || !w.modules.array.built) return block("Nothing there to repair.", false);
        if (w.modules.array.wear <= 0) return block("The array is sound.");
      } else if (t.kind === "player") {
        const q = playerOf(w, t);
        if (!q || !q.active) return block("They cannot be reached.", false);
        if (q.commIntegrity >= 95) return block("Their communicator is sound.");
      } else return block("Pick the array or a teammate.", false);
      if (w.stock.spares <= 0 && p.carry.spares <= 0) return block("No spare parts left.");
      return null;
    },
    where: (w, p, t) => (t.kind === "player" && t.id !== p.id ? w.players[t.id]!.position : w.map.base),
    targets(w, p, informed) {
      const out: Target[] = [];
      if (w.modules.array.built && (informed || w.atBase(p))) out.push({ kind: "module", id: "array" });
      for (const q of visiblePlayers(w, p, informed)) out.push({ kind: "player", id: q.id });
      return out;
    },
    perform(w, p, t, c) {
      if (p.carry.spares > 0) p.carry.spares--; else w.stock.spares -= 1;
      const amount = (40 * c.effort) / SKILLED_EFFORT;
      if (t.kind === "module") {
        const hurt = w.modules.array.wear > 0;
        w.modules.array.wear = Math.max(0, w.modules.array.wear - amount);
        if (hurt) w.respond(p);
        return { text: `${p.name} repaired the array.`, ok: true };
      }
      const q = playerOf(w, t)!;
      q.commIntegrity = Math.min(100, q.commIntegrity + amount);
      if (q.commIntegrity < 100) w.respond(p);
      return { text: `${p.name} repaired ${q.id === p.id ? "their own" : `${q.name}'s`} communicator.`, ok: true };
    },
  }),

  clearDust: make({
    id: "clearDust", name: "Clear dust", summary: "Sweep dust off the solar array.", skill: "power", targetKind: "none", heavy: true, outdoors: true,
    blocked(w) {
      if (!w.modules.array.built) return block("There is no array to sweep.", false);
      if (w.dust < 0.03) return block("The panels are clean.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p, _t, c) {
      const before = w.dust;
      w.dust = Math.max(0, w.dust - (TEAM.clearDustAmount.value * c.effort) / SKILLED_EFFORT);
      if (before > 0.15) w.respond(p);
      return { text: `${p.name} swept the array.`, ok: true };
    },
  }),

  sample: make({
    id: "sample", name: "Take a sample", summary: "Collect rock and soil at a site. The data counts once it is sent home.", skill: "geology", targetKind: "site",
    heavy: true, outdoors: true, reach: 1,
    blocked(w, p, t) {
      if (t.kind !== "site") return block("Pick a site.", false);
      if (w.sites[t.id].sampled && !p.carry.samples.includes(t.id)) return block("That site is sampled.");
      if (p.carry.samples.includes(t.id)) return block("You carry this sample already.", false);
      return null;
    },
    where: (w, _p, t) => (t.kind === "site" ? w.siteOf(t.id).pos : w.map.base),
    targets: (w, p, informed) => w.siteIds().filter((id) => w.canSeeSite(p, id, informed) && !w.sites[id].sampled).map((id) => ({ kind: "site", id })),
    perform(w, p, t) {
      const id = (t as { id: SiteId }).id;
      w.sites[id].sampled = true;
      p.carry.samples.push(id);
      return { text: `${p.name} took a sample at ${w.siteOf(id).name}.`, ok: true };
    },
  }),

  analyse: make({
    id: "analyse", name: "Analyse", summary: "Turn a sample in the lab into data ready to send.", skill: "analysis", targetKind: "none",
    blocked(w) {
      if (!w.labSite()) return block("No sample waiting in the lab.");
      if (w.bufferMb + TEAM.datasetMb.value > w.bufferCap()) return block("The data store is full: send data first.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p, _t, c) {
      const id = w.labSite()!;
      const s = w.sites[id];
      s.analysisWork += c.effort;
      if (s.analysisWork >= TEAM.analyseWork.value) {
        s.analysed = true; s.inLab = false; w.analysedOrder.push(id);
        w.bufferMb += TEAM.datasetMb.value;
        return { text: `${p.name} finished analysing ${w.siteOf(id).name}: ${TEAM.datasetMb.value} Mb of data wait to be sent.`, ok: true };
      }
      return { text: `${p.name} worked on the sample from ${w.siteOf(id).name}.`, ok: true };
    },
  }),

  readMap: make({
    id: "readMap", name: "Read the map", summary: "Work the satellite's pictures into more of the map.", skill: "navigation", targetKind: "none",
    blocked(w) {
      if (w.sat.fault || w.sat.lost) return block("The satellite is not sending pictures.");
      if (w.knownRadius >= w.caps.mapRadiusMax) return block("There is nothing more to read from the pictures.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p, _t, c) {
      const step = (TEAM.readMapStep.value * c.effort) / SKILLED_EFFORT;
      w.knownRadius = Math.min(w.caps.mapRadiusMax, w.knownRadius + step);
      return { text: `${p.name} read the satellite's pictures: the known map reaches ${Math.round(w.knownRadius)} tiles from the base.`, ok: true };
    },
  }),

  restoreLink: make({
    id: "restoreLink", name: "Restore link", summary: "Bring a teammate's communicator back on the network.", skill: "radio", targetKind: "player",
    reach: 0, where: () => null,
    blocked(w, p, t) {
      const q = playerOf(w, t);
      if (!q || !q.active) return block("Pick a teammate.", false);
      if (!p.linked && q.id !== p.id) return block("Your own communicator is down: you can only reset yours.");
      if (q.linked) return block("Their communicator works.");
      return null;
    },
    targets(w, p, informed) {
      if (!p.linked) return [{ kind: "player", id: p.id }];
      return playerTargets(w.players.filter((q) => q.active && !q.linked && informed));
    },
    perform(w, p, t) {
      const q = playerOf(w, t)!;
      const range = w.linkRange();
      if (q.linkCause === "distance" || cheb(q.position, w.map.base) > range) {
        return { text: `${p.name} tried to reach ${q.id === p.id ? "their own" : `${q.name}'s`} communicator, but it is too far out.`, ok: false };
      }
      q.linkGuard = true; q.linkDownSols = 0;
      w.respond(p);
      return { text: `${p.name} reset ${q.id === p.id ? "their own" : `${q.name}'s`} communicator.`, ok: true };
    },
  }),

  schedulePass: make({
    id: "schedulePass", name: "Schedule a pass", summary: "Ask the satellite for a pass over the base tomorrow.", skill: "relay", targetKind: "none",
    blocked(w) {
      if (!w.modules.antenna.built) return block("There is no antenna to reach the satellite.");
      if (w.sat.fault || w.sat.lost) return block("The satellite is not answering.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p) {
      w.sat.forcedPass = true;
      w.sat.charge = Math.max(0, w.sat.charge - 6);
      return { text: `${p.name} booked a satellite pass for tomorrow.`, ok: true };
    },
  }),

  sendData: make({
    id: "sendData", name: "Send data", summary: "Send analysed data up to the satellite during a pass.", skill: "relay", targetKind: "none",
    blocked(w) {
      if (!w.modules.antenna.built) return block("There is no antenna to reach the satellite.");
      if (w.bufferMb <= 0) return block("No data is waiting to be sent.");
      if (w.sat.lost || w.sat.fault) return block("The satellite is not answering.");
      if (!w.sat.passToday) return block("The satellite does not pass over today.");
      if (w.sat.passCapLeft <= 0) return block("The pass is used up.");
      if (w.sat.storedMb >= w.caps.relayStorageMb) return block("The satellite's storage is full.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p, _t, c) {
      const room = w.caps.relayStorageMb - w.sat.storedMb;
      const mb = Math.min(w.bufferMb, w.sat.passCapLeft, (w.caps.relayMbPerSol * c.effort) / SKILLED_EFFORT, room);
      const sent = w.sendUp(mb);
      return { text: `${p.name} sent ${Math.round(sent)} Mb up to the satellite.`, ok: sent > 0 };
    },
  }),

  moveSupplies: make({
    id: "moveSupplies", name: "Load supplies", summary: "Load air, water and food for a teammate who will be away from the base.", skill: "logistics", targetKind: "player", fallible: false,
    blocked(w, p, t) {
      const q = playerOf(w, t);
      if (!q || !q.active) return block("Pick a teammate.", false);
      if (!w.atBase(q)) return block("They are away from the base.", !(q.id === p.id));
      if (q.carry.rations >= TEAM.packMax.value) return block("Their pack is full.");
      if (w.rationsInStock() < 1) return block("The stores are empty.");
      return null;
    },
    targets: (w, p, informed) => playerTargets(atBasePlayers(w).filter((q) => q.id === p.id || informed || cheb(q.position, p.position) <= TEAM.vision.value)),
    perform(w, p, t, c) {
      const q = playerOf(w, t)!;
      const n = Math.max(1, Math.min(TEAM.packMax.value - q.carry.rations, Math.max(3, Math.round((TEAM.packMax.value * c.effort) / SKILLED_EFFORT)), Math.floor(w.rationsInStock())));
      w.takeRations(n); q.carry.rations += n;
      if (q.carry.spares === 0 && w.stock.spares > 1) { w.stock.spares--; q.carry.spares = 1; }
      return { text: `${p.name} loaded ${n} sols of supplies for ${q.id === p.id ? "themselves" : q.name}.`, ok: true };
    },
  }),

  handOver: make({
    id: "handOver", name: "Hand over", summary: "Give a teammate beside you what you carry: samples, supplies, a spare part.", skill: "logistics", targetKind: "player",
    reach: 1, fallible: false,
    blocked(w, p, t) {
      const q = playerOf(w, t);
      if (!q || !q.active || q.id === p.id) return block("Pick a teammate.", false);
      if (p.carry.samples.length === 0 && p.carry.rations === 0 && p.carry.spares === 0) return block("You carry nothing to hand over.", false);
      return null;
    },
    where: (w, p, t) => (t.kind === "player" && t.id !== p.id ? w.players[t.id]!.position : null),
    targets: (w, p, informed) => playerTargets(visiblePlayers(w, p, informed, (q) => q.id !== p.id)),
    perform(w, p, t) {
      const q = playerOf(w, t)!;
      const bits: string[] = [];
      if (p.carry.samples.length) { bits.push(`${p.carry.samples.length} sample${p.carry.samples.length > 1 ? "s" : ""}`); q.carry.samples.push(...p.carry.samples); p.carry.samples = []; }
      const give = Math.min(TEAM.packMax.value - q.carry.rations, Math.ceil(p.carry.rations / 2));
      if (give > 0) { p.carry.rations -= give; q.carry.rations += give; bits.push(`${give} sols of supplies`); }
      if (p.carry.spares > 0) { q.carry.spares += p.carry.spares; p.carry.spares = 0; bits.push("a spare part"); }
      return { text: bits.length ? `${p.name} handed ${bits.join(", ")} to ${q.name}.` : `${p.name} had nothing ${q.name} could take.`, ok: bits.length > 0 };
    },
  }),

  bringSupplies: make({
    id: "bringSupplies", name: "Bring supplies out", summary: "Load at the base, walk to a teammate who is away, and restore their air, water and food on arrival.", skill: "logistics", targetKind: "player",
    reach: 1, heavy: true, outdoors: true, fallible: false,
    blocked(w, p, t) {
      const q = playerOf(w, t);
      if (!q || !q.active || q.id === p.id) return block("Pick a teammate.", false);
      if (p.carry.rations <= 0 && !(w.atBase(p) && w.rationsInStock() >= 1)) return block("You have no supplies to bring.", false);
      return null;
    },
    prepare(w, p) {
      if (!w.atBase(p)) return;
      const n = Math.min(p.skillLevel("logistics") >= 2 ? TEAM.packMax.value : 6, TEAM.packMax.value - p.carry.rations, Math.floor(w.rationsInStock()));
      if (n > 0) { w.takeRations(n); p.carry.rations += n; w.emit("supplies", [p.id], `${p.name} loaded ${n} sols of supplies to bring out.`, { amount: n }); }
    },
    where: (w, _p, t) => (t.kind === "player" ? w.players[t.id]!.position : null),
    targets: (w, p, informed) => playerTargets(visiblePlayers(w, p, informed, (q) => q.id !== p.id && cheb(q.position, w.map.base) > 3)),
    perform(w, p, t) {
      const q = playerOf(w, t)!;
      const give = Math.max(0, Math.min(TEAM.packMax.value - q.carry.rations, Math.max(p.carry.rations - 2, 1), p.carry.rations));
      p.carry.rations -= give; q.carry.rations += give;
      for (const g of ["air", "water", "food"] as const) q[g] = Math.min(100, q[g] + TEAM.suppliesRecover.value);
      return { text: `${p.name} brought ${give} sols of supplies to ${q.name}, who ate and drank.`, ok: true };
    },
  }),

  firstAid: make({
    id: "firstAid", name: "First aid", summary: "Treat a teammate: body, morale and a little of the radiation dose.", skill: "firstAid", targetKind: "player", reach: 1,
    blocked(w, p, t) {
      const q = playerOf(w, t);
      if (!q || !q.active) return block("Pick a teammate.", false);
      if (q.body >= 95 && q.morale >= 95 && q.dose < 20) return block("They need no treatment.", q.id !== p.id);
      return null;
    },
    where: (w, p, t) => (t.kind === "player" && t.id !== p.id ? w.players[t.id]!.position : null),
    targets: (w, p, informed) => playerTargets(visiblePlayers(w, p, informed)),
    perform(w, p, t, c) {
      const q = playerOf(w, t)!;
      const e = c.effort / SKILLED_EFFORT;
      if (q.body < 70 || q.dose >= 100) w.respond(p);
      q.body = Math.min(100, q.body + TEAM.firstAidBody.value * e);
      q.morale = Math.min(100, q.morale + TEAM.firstAidMorale.value * e);
      q.dose = Math.max(0, q.dose - TEAM.firstAidDose.value * e);
      return { text: `${p.name} gave first aid to ${q.id === p.id ? "themselves" : q.name}.`, ok: true };
    },
  }),

  rest: make({
    id: "rest", name: "Rest", summary: "A quiet sol: sleep, eat, recover.", skill: null, targetKind: "none", reach: 0, fallible: false,
    where: () => null, targets: () => [NONE],
    perform(w, p) {
      p.rest = Math.min(100, p.rest + TEAM.restRecover.value);
      p.energy = Math.min(100, p.energy + 20);
      p.morale = Math.min(100, p.morale + TEAM.moraleRest.value);
      if (w.atBase(p)) p.body = Math.min(100, p.body + TEAM.bodyHealPerSol.value);
      return { text: `${p.name} rested.`, ok: true };
    },
  }),

  shelter: make({
    id: "shelter", name: "Shelter", summary: "Stay inside the habitat, in its most shielded corner.", skill: null, targetKind: "none", fallible: false,
    targets: () => [NONE],
    perform(w, p) {
      p.sheltered = true;
      p.rest = Math.min(100, p.rest + 10);
      if (w.solarStormToday()) w.respond(p);
      return { text: `${p.name} sheltered in the habitat.`, ok: true };
    },
  }),

  plan: make({
    id: "plan", name: "Plan the sol", summary: "Coordinate the others: whoever is in contact works faster today.", skill: "planning", targetKind: "none", reach: 0, fallible: false,
    where: () => null, targets: () => [NONE],
    perform(w, p) {
      if (!p.linked) return { text: `${p.name} made a plan but had no one to tell.`, ok: false };
      w.planBonus = Math.max(w.planBonus, p.skillLevel("planning") >= 2 ? 0.2 : 0.08);
      return { text: `${p.name} set the plan of the sol.`, ok: true };
    },
  }),

  travel: make({
    id: "travel", name: "Travel", summary: "Walk to a place on the map. Rough ground costs more.", skill: null, targetKind: "tile", reach: 0, outdoors: true, fallible: false,
    blocked(w, _p, t) {
      if (t.kind !== "tile") return block("Pick a tile.", false);
      if (t.x < 0 || t.y < 0 || t.x >= w.map.width || t.y >= w.map.height) return block("That is off the map.", false);
      return null;
    },
    where: (w, _p, t) => (t.kind === "tile" ? w.passableNear({ x: t.x, y: t.y }) : null),
    targets: () => [],
    perform: (_w, p) => ({ text: `${p.name} got there.`, ok: true }),
  }),

  diagnoseSatellite: make({
    id: "diagnoseSatellite", name: "Diagnose the satellite", summary: "Read the satellite's telemetry to find what is wrong.", skill: "radio", targetKind: "none",
    blocked(w) {
      if (!w.modules.antenna.built) return block("There is no antenna to reach the satellite.");
      if (!w.sat.fault) return block("The satellite shows no fault.");
      if (w.sat.fault.diagnosed) return block("The fault is already diagnosed.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p, _t, c) {
      const f = w.sat.fault!;
      f.diagWork += c.effort;
      if (f.diagWork >= TEAM.satDiagnoseWork.value) {
        f.diagnosed = true;
        w.respond(p);
        return { text: `${p.name} found what is wrong with the satellite.`, ok: true };
      }
      return { text: `${p.name} read the satellite's telemetry but has not found the fault yet.`, ok: true };
    },
  }),

  recoverSatellite: make({
    id: "recoverSatellite", name: "Recover the satellite", summary: "Send the commands that bring a diagnosed satellite back.", skill: "relay", targetKind: "none",
    blocked(w) {
      if (!w.modules.antenna.built) return block("There is no antenna to reach the satellite.");
      if (!w.sat.fault) return block("The satellite shows no fault.");
      if (!w.sat.fault.diagnosed) return block("The fault is not diagnosed yet.");
      return null;
    },
    targets: () => [NONE],
    perform(w, p, _t, c) {
      const f = w.sat.fault!;
      f.fixWork += c.effort;
      w.respond(p);
      if (f.fixWork >= TEAM.satRecoverWork.value) {
        w.sat.fault = null; w.sat.saves++;
        w.sat.charge = Math.max(w.sat.charge, 50);
        w.emit("satellite", [p.id], "The satellite answers again.");
        return { text: `${p.name} brought the satellite back.`, ok: true };
      }
      return { text: `${p.name} sent recovery commands; the satellite is not back yet.`, ok: true };
    },
  }),
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[];
