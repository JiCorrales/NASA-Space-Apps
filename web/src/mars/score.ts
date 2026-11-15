// Score and the report after the run. Only built when the run has ended.
import { HAZARDS } from "./hazards";
import { TEAM } from "./data";
import { TASKS } from "./tasks";
import type { CauseLine, HazardId, RoleScore, RunResult, Score } from "./types";
import type { MarsWorld } from "./world";

const ROLE_LINE: Record<string, (r: Omit<RoleScore, "line">) => string> = {
  commander: (r) => `${r.name} (commander): ${r.hazardResponses} response(s) to trouble, ${r.workDone.toFixed(0)} units of work.`,
  engineer: (r) => `${r.name} (engineer): ${r.workDone.toFixed(0)} units of work, ${r.hazardResponses} repair or sweep response(s).`,
  scientist: (r) => `${r.name} (scientist): ${r.workDone.toFixed(0)} units of work, ${r.deadLinkActions} sol(s) of work alone.`,
  comms: (r) => `${r.name} (communications): ${r.hazardResponses} link or satellite response(s), ${r.workDone.toFixed(0)} units of work.`,
};

export function buildScore(w: MarsWorld): Score {
  const tasksDone = TASKS.filter((t) => t.isDone(w)).length;
  const sites = w.siteIds().filter((s) => w.siteDelivered(s)).length;
  const mb = Math.round(w.siteIds().reduce((a, s) => a + w.sites[s].earthMb, 0));
  const days = Math.round(w.rationsInStock());
  const resourcesLeft = [
    { label: "Crew-sols of air, water and food", value: days, unit: "sols" },
    { label: "Battery", value: Math.round(w.battery), unit: "Wh" },
    { label: "Spare parts", value: w.stock.spares, unit: "parts" },
    { label: "Materials", value: Math.round(w.stock.materials), unit: "kg" },
  ];
  const hazardResponses = w.players.reduce((a, p) => a + p.hazardResponses, 0);
  const deadLinkActions = w.players.reduce((a, p) => a + p.deadLinkActions, 0);
  const lines: string[] = [];
  if (hazardResponses) lines.push(`${hazardResponses} action(s) taken against a hazard: sheltering, sweeping, repairs, resets and work on the satellite.`);
  if (deadLinkActions) lines.push(`${deadLinkActions} sol(s) of useful work done by someone cut off from the team.`);
  const components = {
    tasks: tasksDone * TEAM.pointsPerTask.value,
    science: sites * TEAM.pointsPerSite.value,
    resources: Math.round(TEAM.pointsPerResource.value * Math.min(1, w.rationsInStock() / 30) * 0.5 + TEAM.pointsPerResource.value * Math.min(1, w.battery / w.batteryCap()) * 0.5),
    decisions: Math.min(TEAM.pointsResponseMax.value, (hazardResponses + deadLinkActions) * TEAM.pointsPerResponse.value),
  };
  const perRole: RoleScore[] = w.players.map((p) => {
    const r = { role: p.role, player: p.id, name: p.name, workDone: Math.round(p.workDone * 10) / 10, hazardResponses: p.hazardResponses, deadLinkActions: p.deadLinkActions, solsOut: p.solsOut };
    return { ...r, line: ROLE_LINE[p.role]!(r) };
  });
  return {
    tasksCompleted: tasksDone, tasksTotal: TASKS.length, scienceDelivered: { sites, megabits: mb }, resourcesLeft,
    decisions: { hazardResponses, deadLinkActions, lines }, components,
    total: components.tasks + components.science + components.resources + components.decisions, perRole,
  };
}

export function buildAttemptResult(w: MarsWorld): RunResult {
  const endedOnSol = w.sol;
  const causes: CauseLine[] = [];
  const seen = new Set<HazardId>();
  for (const h of HAZARDS) {
    if (h.id === "dust-settling" || h.id === "satellite-fault") {
      if (h.id === "satellite-fault" && w.stats.faultsOpened === 0) continue;
      seen.add(h.id); causes.push({ sol: endedOnSol, hazard: h.id, text: h.cause(null, w) });
      continue;
    }
    for (const o of w.schedule.filter((x) => x.hazard === h.id && x.startSol <= endedOnSol)) { seen.add(h.id); causes.push({ sol: o.startSol, hazard: h.id, text: h.cause(o, w) }); }
  }
  const lc = w.stats.linkCuts;
  causes.push({ sol: endedOnSol, hazard: "time", text: `Player-sols cut off, by cause: distance from the antenna ${lc.distance}, dust ${lc["dust-storm"]}, solar storm ${lc["solar-storm"]}, satellite ${lc["satellite-fault"]}, communicator wear ${lc.hardware}.` });
  if (w.status === "lost") {
    const text = w.loseReason === "window-closed" ? `The window home closed on sol ${endedOnSol} with ${TASKS.filter((t) => !t.isDone(w)).map((t) => t.name.toLowerCase()).join(", ")} unfinished.`
      : w.loseReason === "resource-exhausted" ? "Air, water or food ran out." : "Nobody was left able to work.";
    causes.push({ sol: endedOnSol, hazard: w.loseReason === "window-closed" ? "time" : w.loseReason === "resource-exhausted" ? "supplies" : "crew", text });
    for (const p of w.players) if (p.out) causes.push({ sol: p.outSol ?? endedOnSol, hazard: "crew", text: `${p.name} went out of action on sol ${p.outSol}: ${p.out}.` });
  }
  return {
    outcome: w.status === "won" ? "won" : "lost", loseReason: w.loseReason, endedOnSol,
    tasks: TASKS.map((t) => ({ id: t.id, name: t.name, done: t.isDone(w), failed: t.isFailed(w), doneOnSol: w.taskDoneSol.get(t.id) ?? null })),
    score: buildScore(w), causes, hazardsSeen: [...seen],
  };
}
