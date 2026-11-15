// What one player may know this sol. The only door from the world to the four screens: if something is not built
// here, no screen can show it. A cut-off player gets their surroundings and their own gauges, nothing shared.
import { ACTIVITIES } from "./activities";
import { NASA, TEAM } from "./data";
import { cheb } from "./map";
import { MODULES, MODULE_IDS } from "./modules";
import type { Player } from "./player";
import { TASKS } from "./tasks";
import type {
  ActivityOption, CrewView, MapPatch, ModuleView, ObjectView, PlayerId, PlayerView, ResourceView, SatelliteView, SelfView,
  SharedView, SiteView, SkyState, Surroundings, Warning,
} from "./types";
import { RUN_SOLS } from "./types";
import type { MarsWorld } from "./world";

const SKY_TEXT: Record<SkyState, string> = {
  clear: "The sky is clear.", hazy: "The air is hazy with dust.", dust: "Dust fills the air.", dark: "The sky is dark with dust.",
};

export function skyOf(w: MarsWorld): SkyState {
  const i = w.stormIntensity();
  return i <= 0 ? "clear" : i < 0.6 ? "hazy" : i < 0.9 ? "dust" : "dark";
}

function patch(w: MarsWorld, x0: number, y0: number, x1: number, y1: number, known?: (x: number, y: number) => boolean): MapPatch {
  const rows: string[] = [];
  for (let y = y0; y <= y1; y++) {
    let r = "";
    for (let x = x0; x <= x1; x++) r += !known || known(x, y) ? w.map.tiles[y]![x]! : "?";
    rows.push(r);
  }
  return { x0, y0, width: x1 - x0 + 1, height: y1 - y0 + 1, rows };
}

function warnings(w: MarsWorld): Warning[] {
  if (w.sat.fault || w.sat.lost || w.caps.warningLeadSols <= 0) return [];
  const out: Warning[] = [];
  for (const o of w.schedule) {
    const inSols = o.startSol - w.sol;
    if ((o.hazard !== "dust-storm" && o.hazard !== "solar-storm") || inSols < 1 || inSols > w.caps.warningLeadSols) continue;
    out.push({
      hazard: o.hazard, inSols,
      text: o.hazard === "dust-storm" ? `A storm front is building: dust expected over the base in ${inSols} sol${inSols > 1 ? "s" : ""}.` : `A flare was seen on the Sun: particles expected at the surface in ${inSols} sol${inSols > 1 ? "s" : ""}.`,
    });
  }
  return out;
}

function sharedView(w: MarsWorld): SharedView {
  const m = w.map, V = TEAM.vision.value;
  void V;
  const sites: SiteView[] = w.siteIds().filter((id) => w.siteKnown(id)).map((id) => {
    const s = w.sites[id], site = w.siteOf(id);
    return { id, name: site.name, pos: site.pos, sampled: s.sampled, analysed: s.analysed, sentMb: Math.round(s.sentMb), datasetMb: TEAM.datasetMb.value, deliveredMb: Math.round(s.earthMb) };
  });
  const modules: ModuleView[] = MODULE_IDS.map((id) => {
    const st = w.modules[id], def = MODULES[id];
    return {
      id, name: def.name, pos: w.modulePos(id), effect: def.effect, progress: Math.round(st.progress * 10) / 10, needed: def.workUnits,
      status: st.built ? (st.wear >= 40 ? "damaged" : "working") : st.progress > 0 ? "building" : "absent",
      dust: id === "array" ? Math.round(w.dust * 100) / 100 : 0, wear: Math.round(st.wear),
    };
  });
  const crew: CrewView[] = w.players.map((p) => {
    const k = w.teamKnown[p.id]!, c = w.choices[p.id];
    return {
      id: p.id, name: p.name, look: p.look, role: p.role, status: p.active ? "active" : "out", linked: p.linked && p.active,
      position: { ...(p.linked ? p.position : k.position) },
      plan: p.linked && p.active && c ? { player: p.id, activity: c.activity, target: c.target } : null,
      known: k.log.map((e) => ({ ...e })), lastContactSol: k.lastContactSol,
      health: p.linked && p.active ? p.gauges() : null, carrying: p.linked && p.active ? p.carrying() : null, commHealth: p.linked && p.active ? Math.round(p.commIntegrity) : null,
    };
  });
  const sat: SatelliteView = {
    state: w.sat.lost ? "lost" : w.sat.fault ? "trouble" : "working", passToday: w.sat.passToday, passMinutes: w.caps.passMinutes, passes: w.caps.passesPerSol,
    capacityMb: Math.round(w.sat.passCapLeft), storedMb: Math.round(w.sat.storedMb), storageMb: w.caps.relayStorageMb, diagnosed: !!w.sat.fault?.diagnosed,
  };
  const linked = w.players.filter((p) => p.active && p.linked).length;
  const days = (n: number) => Math.round(n * 10) / 10;
  const resources: ResourceView[] = [
    { kind: "power", label: "Power", value: Math.round(w.battery), unit: "Wh stored", detail: `Last sol the array made ${w.lastPower.generatedWh} Wh and the base used ${w.lastPower.usedWh} Wh. Dust on the array: ${Math.round(w.dust * 100) / 100} of its output lost.`, source: "D28" },
    { kind: "mass", label: "Supplies", value: Math.round(w.stock.materials), unit: "kg of materials", detail: `Air for ${days(w.stock.oxygen / NASA.oxygenPerDay.value)} crew-sols, water for ${days(w.stock.water / NASA.waterPerDay.value)}, food for ${days(w.stock.food / NASA.foodPerDay.value)}.`, source: "HL19" },
    { kind: "budget", label: "Spare parts", value: w.stock.spares, unit: "parts", detail: "What the budget kept in reserve bought.", source: "team" },
    { kind: "data", label: "Data", value: Math.round(w.bufferMb), unit: "Mb waiting", detail: `${Math.round(w.sat.storedMb)} Mb are in the satellite, on their way to Earth.`, source: "C14" },
    { kind: "communications", label: "Communications", value: linked, unit: "players in contact", detail: w.sat.passToday ? "The satellite passes over the base today." : "No satellite pass today.", source: "C15" },
    { kind: "time", label: "Time", value: Math.max(0, RUN_SOLS - w.sol + 1), unit: "sols left", detail: "Until the window home closes.", source: "team" },
  ];
  return {
    map: { width: m.width, height: m.height, rows: patch(w, 0, 0, m.width - 1, m.height - 1, (x, y) => w.tileKnown(x, y)).rows, base: m.base, knownRadius: Math.round(w.knownRadius * 10) / 10 },
    sites, labSamples: w.siteIds().filter((id) => w.sites[id].inLab && !w.sites[id].analysed), modules, resources, forecast: warnings(w),
    tasks: TASKS.map((t) => ({ id: t.id, name: t.name, summary: t.summary, done: t.isDone(w), failed: t.isFailed(w), ...(() => { const p = t.progress(w); return { progress: p.done, total: p.total }; })() })),
    satellite: sat, crew, news: [...w.news],
  };
}

function surroundings(w: MarsWorld, p: Player): Surroundings {
  const V = TEAM.vision.value, m = w.map;
  const x0 = Math.max(0, p.position.x - V), x1 = Math.min(m.width - 1, p.position.x + V);
  const y0 = Math.max(0, p.position.y - V), y1 = Math.min(m.height - 1, p.position.y + V);
  const near = (pos: { x: number; y: number }) => cheb(pos, p.position) <= V;
  const objects: ObjectView[] = [];
  for (const id of MODULE_IDS) {
    const pos = w.modulePos(id);
    if (!near(pos)) continue;
    const st = w.modules[id];
    objects.push({ kind: "module", id, label: MODULES[id].name, pos, state: st.built ? (st.wear >= 40 ? "damaged" : id === "array" && w.dust >= 0.2 ? "dusty" : "working") : st.progress > 0 ? "building" : "absent" });
  }
  for (const id of w.siteIds()) {
    const s = w.siteOf(id);
    if (near(s.pos)) objects.push({ kind: "site", id, label: s.name, pos: s.pos, state: w.sites[id].sampled ? "sampled" : "unsampled" });
  }
  for (const q of w.players) if (q.id !== p.id && q.active && near(q.position)) objects.push({ kind: "player", id: String(q.id), label: q.name, pos: { ...q.position }, state: q.role });
  return { patch: patch(w, x0, y0, x1, y1), sky: skyOf(w), objects };
}

function options(w: MarsWorld, p: Player): ActivityOption[] {
  const informed = p.linked;
  const exhausted = p.energy <= 5 || p.rest <= 5;
  return Object.values(ACTIVITIES).map((a) => {
    const targets = a.targets(w, p, informed);
    let blocked: string | null = null;
    const b = a.blocked(w, p, targets[0] ?? { kind: "none" });
    if (b && (!b.shared || informed)) blocked = b.reason;
    else if (!b && targets.length === 0 && a.targetKind !== "none" && a.targetKind !== "tile") blocked = "Nothing here to work on.";
    if (exhausted && a.id !== "rest" && a.id !== "shelter") blocked = "Too exhausted to do more than rest.";
    return { id: a.id, name: a.name, summary: a.summary, targetKind: a.targetKind, targets, skilled: p.skillLevel(a.skill) >= 1, own: p.isOwn(a.id), blocked };
  });
}

export function buildView(w: MarsWorld, id: PlayerId): PlayerView {
  const p = w.players[id]!;
  const linked = p.linked && p.active;
  const self: SelfView = {
    id, name: p.name, look: p.look, role: p.role, position: { ...p.position }, status: p.active ? "active" : "out", outReason: p.out,
    gauges: p.gauges(), skills: p.skills.map((s) => ({ ...s })), carrying: p.carrying(), linked, commHealth: Math.round(p.commIntegrity),
  };
  const sky = skyOf(w);
  const briefing = [`Sol ${w.sol} of ${RUN_SOLS}.`, SKY_TEXT[sky]];
  let shared: SharedView | null = null;
  let plans: PlayerView["plans"] = null;
  if (!p.active) briefing.push("You can no longer work.");
  else if (linked) {
    shared = sharedView(w);
    briefing.push(...shared.news, ...shared.forecast.map((x) => x.text));
    if (shared.satellite.passToday) briefing.push("The satellite passes over the base today.");
    plans = w.players.filter((q) => q.id !== id && q.active && q.linked && w.choices[q.id]).map((q) => ({ player: q.id, activity: w.choices[q.id]!.activity, target: w.choices[q.id]!.target }));
  } else briefing.push("Your communicator is silent. You see only what is around you.");
  return {
    sol: w.sol, totalSols: RUN_SOLS, self, surroundings: surroundings(w, p), options: p.active ? options(w, p) : [],
    briefing, shared, plans, myChoice: w.choices[id] ? { ...w.choices[id]! } : null,
  };
}
