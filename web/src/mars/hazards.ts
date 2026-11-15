// The hazards. Each is a real condition (source tag), drawn from the seed, with a cost in the world.
import type { Hazard, HazardOccurrence } from "./contracts";
import { NASA, TEAM } from "./data";
import { rangeInt, roll } from "./rng";
import type { HazardId } from "./types";

const occ = (hazard: HazardId, startSol: number, durationSols: number, intensity: number): HazardOccurrence => ({ hazard, startSol, durationSols, intensity });

export const dustStorm: Hazard = {
  id: "dust-storm", name: "Dust storm", source: "D05",
  plan(seed) {
    if (roll(seed, 1) >= TEAM.dustStormRun.value) return [];
    return [occ("dust-storm", rangeInt(roll(seed, 2), 6, 20), rangeInt(roll(seed, 3), TEAM.dustStormMin.value, TEAM.dustStormMax.value), 0.7 + 0.3 * roll(seed, 4))];
  },
  apply(w, o) {
    if (!o) return;
    const i = w.stormIntensity();
    if (i <= 0) return;
    w.dust = Math.min(TEAM.dustMax.value, w.dust + TEAM.dustPerStormSol.value);
    for (const p of w.players) {
      if (!p.active) continue;
      p.commIntegrity = Math.max(0, p.commIntegrity - TEAM.commWear.value * i);
      if (p.outdoorsToday) p.body = Math.max(0, p.body - 3);
      p.morale = Math.max(0, p.morale - TEAM.moraleBadNews.value);
    }
    if (i >= 0.7 && w.modules.array.built) w.modules.array.wear = Math.min(100, w.modules.array.wear + 12);
    w.sat.charge = Math.max(0, w.sat.charge - TEAM.satDrainStorm.value * (1 - w.caps.satPowerMargin));
    w.emit("hazard", [], "Dust fills the air. The array makes far less power.", { hazard: "dust-storm", amount: i, scope: "team" });
  },
  cause: (o, w) => o
    ? `Sols ${o.startSol} to ${o.startSol + o.durationSols - 1}: a dust storm. It cut the array's output (InSight's fell from ${NASA.arrayFullWh.value} to ${NASA.arrayDustedWh.value} Wh per sol under dust), the base spent ${w.stats.powerShortSols} sol(s) short of power, and ${w.stats.linkCuts["dust-storm"]} player-sol(s) of contact were lost to it.`
    : "",
};

export const coldNight: Hazard = {
  id: "cold-night", name: "Cold night", source: "T05",
  plan(seed) {
    const n = rangeInt(roll(seed, 10), TEAM.coldNightsMin.value, TEAM.coldNightsMax.value);
    const out: HazardOccurrence[] = [];
    for (let i = 0; i < n; i++) {
      const sol = rangeInt(roll(seed, 11, i), 3, 29);
      if (!out.some((o) => o.startSol === sol)) out.push(occ("cold-night", sol, 1, 1));
    }
    return out;
  },
  apply(w, o) {
    if (!o) return;
    w.extraLoadWh += TEAM.coldNightExtraWh.value;
    w.emit("hazard", [], "A very cold night. The heaters take more power.", { hazard: "cold-night", scope: "team" });
  },
  cause: (o, w) => (o ? `Sol ${o.startSol}: a night as cold as ${NASA.coldNight.value} C. The heaters drew ${TEAM.coldNightExtraWh.value} Wh more from the battery (lowest battery level of the run: ${Math.round(w.stats.minBatteryWh)} Wh).` : ""),
};

export const dustSettling: Hazard = {
  id: "dust-settling", name: "Dust on the array", source: "D32",
  plan: () => [],
  apply(w) {
    if (w.stormIntensity() > 0) return;
    const before = w.dust;
    w.dust = Math.min(TEAM.dustMax.value, w.dust + TEAM.dustPerSol.value);
    for (const edge of [0.2, 0.4]) if (before < edge && w.dust >= edge && w.modules.array.built) w.emit("hazard", [], "Dust has settled on the array; it makes less power.", { hazard: "dust-settling", scope: "team" });
  },
  cause: (_o, w) => `Dust settled on the array all run long (sweeping a quarter of InSight's panels would have given back about ${NASA.arraySweepGain.value * NASA.arrayFullWh.value} Wh per sol). Output lost to dust over the run: ${Math.round(w.stats.dustOutputLostWh)} Wh.`,
};

export const solarStorm: Hazard = {
  id: "solar-storm", name: "Solar storm", source: "R08",
  plan(seed) {
    const out: HazardOccurrence[] = [];
    if (roll(seed, 20) < TEAM.solarStormRun.value) {
      out.push(occ("solar-storm", rangeInt(roll(seed, 21), 5, 27), 1, 1));
      if (roll(seed, 22) < 0.2) out.push(occ("solar-storm", rangeInt(roll(seed, 23), 5, 27), 1, 1));
    }
    return out.filter((o, i) => out.findIndex((x) => x.startSol === o.startSol) === i);
  },
  apply(w, o) {
    if (!o) return;
    for (const p of w.players) {
      if (!p.active) continue;
      const indoors = w.atBase(p) && !p.outdoorsToday;
      const f = p.sheltered ? TEAM.shelterStorm.value : indoors ? TEAM.indoorsStorm.value : 1;
      const dose = NASA.stormEvent.value * f;
      p.dose += dose;
      w.stats.stormDose += dose;
      if (f >= 1) p.body = Math.max(0, p.body - 20);
      p.commIntegrity = Math.max(0, p.commIntegrity - 10);
      p.morale = Math.max(0, p.morale - TEAM.moraleBadNews.value);
      w.emit("gauge", [p.id], `${p.name}'s dosimeter reads ${Math.round(dose)} mSv.`, { hazard: "solar-storm", amount: dose, scope: "team" });
    }
    w.sat.charge = Math.max(0, w.sat.charge - TEAM.satDrainStorm.value * 1.5 * (1 - w.caps.satPowerMargin));
    w.emit("hazard", [], "Solar storm: charged particles reach the surface.", { hazard: "solar-storm", scope: "team" });
  },
  cause: (o, w) => (o ? `Sol ${o.startSol}: a solar storm (NASA limits one such event to ${NASA.stormEvent.value} mSv). The crew took ${Math.round(w.stats.stormDose)} mSv in all, and communicators were hit.` : ""),
};

export const satelliteFault: Hazard = {
  id: "satellite-fault", name: "Satellite fault", source: "E07",
  plan(seed, caps) {
    const first = rangeInt(roll(seed, 30), TEAM.satFirstFaultMin.value, TEAM.satFirstFaultMax.value);
    const out = [occ("satellite-fault", first, TEAM.satFaultWindow.value, 1)];
    for (let s = first + 3; s <= 27; s++) if (roll(seed, 31, s) < caps.faultPerSol) out.push(occ("satellite-fault", s, TEAM.satFaultWindow.value, 1));
    return out;
  },
  apply(w) {
    // slow recharge, brownout when the charge runs out, loss when the window to save it closes
    w.sat.charge = Math.min(100, w.sat.charge + TEAM.satRecharge.value);
    if (!w.sat.fault && !w.sat.lost && w.sat.charge <= 0) w.openFault("brownout");
    const f = w.sat.fault;
    if (f && w.sol >= f.deadline) {
      w.sat.fault = null; w.sat.lost = true;
      w.emit("satellite", [], "The satellite is gone: no answer, and nothing more will come from it.", { scope: "team" });
    }
  },
  cause: (_o, w) => `The satellite had ${w.stats.faultsOpened} fault(s) (orbiters have gone into safe mode before: MRO in 2014, Odyssey in 2012). ${w.sat.lost ? "It was not brought back in time and was lost." : `${w.sat.saves} were fixed.`}`,
};

export const HAZARDS: Hazard[] = [dustStorm, coldNight, dustSettling, solarStorm, satelliteFault];
