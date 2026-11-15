// Every number of the Mars rules, in one place, each with its source: the id of a row of
// Resources/10-mars-surface/data/mars-surface-numbers.csv, or "team" for a game-balance value. A screen may show
// the tag. A "team" number is never to be presented as NASA's.
import type { Sourced } from "./types";

const n = (label: string, value: number, unit: string, source: string, note?: string): Sourced =>
  note ? { label, value, unit, source, note } : { label, value, unit, source };

export const NASA = {
  sunlight: n("Sunlight at Mars", 586.2, "W/m2", "B24"),
  solHours: n("Length of a sol", 24.6597, "hours", "B01"),
  dosePerSol: n("Surface dose per sol", 0.69, "mSv", "HL10", "0.67 mSv per day measured by Curiosity (R02), converted to a sol"),
  careerLimit: n("Career dose limit", 600, "mSv", "R07"),
  stormEvent: n("Solar particle event limit", 250, "mSv", "R08", "The game sizes an unsheltered solar storm at this limit"),
  passMinutesMin: n("Shortest relay pass", 10, "min", "C17"),
  passMinutesMax: n("Longest relay pass", 17, "min", "C18"),
  passesPerSolMin: n("Fewest passes per sol", 2, "passes", "C15"),
  passesPerSolMax: n("Most passes per sol", 4, "passes", "C15"),
  relayMbpsMax: n("Relay rate, maximum", 2, "Mbps", "C14"),
  relayMbPerSolMin: n("Data per day through Odyssey", 170.4, "Mb", "C21"),
  relayMbPerSolMax: n("Data per day through ExoMars TGO", 1562.7, "Mb", "C23"),
  oxygenPerDay: n("Oxygen per person per day", 0.771, "kg", "HL19"),
  waterPerDay: n("Drinking water per person per day", 2.5, "L", "HL20"),
  foodPerDay: n("Food per person per day", 3035, "kcal", "HL21"),
  arrayFullWh: n("Array output with clean panels (InSight after landing)", 5000, "Wh per sol", "D28"),
  arrayDustedWh: n("Array output under heavy dust (InSight, 2022)", 500, "Wh per sol", "D29"),
  arraySweepGain: n("Gain from sweeping a quarter of the panels", 0.2, "of full output", "D32", "1000 of 5000 Wh per sol"),
  stormDurationMax: n("Longest regional dust storm", 21, "sols", "D05", "up to three weeks; the game uses shorter ones"),
  coldNight: n("Night air temperature", -90, "C", "T05"),
  sleepNeed: n("Sleep an adult needs", 8, "hours", "HL28"),
  hazardSolar: n("Solar particle events reaching Mars", 2, "events", "E05", "2017 (E04) and 2024 (E05)"),
  hazardSatellite: n("Orbiter safe modes", 3, "events", "E07", "MRO 2014 (E07), Odyssey 2012 (E09, E10)"),
};

/** Game-balance values. Illustrative; tuned by Balance.test.ts. */
const t = (label: string, value: number, unit: string, note?: string): Sourced => n(label, value, unit, "team", note);

export const TEAM = {
  // map
  mapWidth: t("Map width", 40, "tiles"),
  mapHeight: t("Map height", 24, "tiles"),
  vision: t("How far a player sees", 4, "tiles"),
  moveBudget: t("Movement points per sol", 12, "points", "plain 1, rough 2, dune 3, boulders 3"),
  handheldRange: t("Communicator range without the antenna", 9, "tiles"),
  antennaRange: t("Communicator range with the antenna", 24, "tiles"),
  readMapStep: t("Tiles of map a reading adds", 6, "tiles"),
  // work
  baseEffort: t("Work a player does in a sol", 3, "units"),
  moveEnergy: t("Energy a full sol of walking costs", 26, "points"),
  // skill
  skillEffort: t("Work multiplier by skill level 0,1,2,3", 0.5, "x", "0.5, 1, 1.25, 1.4"),
  // power
  baseLoadWh: t("Base load: life support, heat, comms", 2800, "Wh per sol"),
  landerWh: t("Lander panels before the array", 500, "Wh per sol"),
  batteryWh: t("Battery capacity", 12000, "Wh"),
  batteryStartWh: t("Battery at landing", 8000, "Wh"),
  storageBatteryWh: t("Battery added by the storage module", 5000, "Wh"),
  coldNightExtraWh: t("Extra heating on a cold night", 3000, "Wh"),
  dustPerSol: t("Dust settling on the array per sol", 0.015, "of output"),
  dustPerStormSol: t("Dust settling per storm sol", 0.07, "of output"),
  dustMax: t("Most output dust can take", 0.7, "of output"),
  clearDustAmount: t("Dust a skilled sweep removes", 0.28, "of output"),
  powerShortOxygen: t("Life support use when power runs short", 1.3, "x"),
  // modules
  arrayMaterials: t("Array materials", 160, "kg"),
  antennaMaterials: t("Antenna materials", 120, "kg"),
  storageMaterials: t("Storage materials", 100, "kg"),
  arrayWork: t("Array work", 6, "units"),
  antennaWork: t("Antenna work", 8, "units"),
  storageWork: t("Storage work", 6, "units"),
  buildPowerWh: t("Power a unit of building work takes", 300, "Wh"),
  // crew gauges
  energyPerSol: t("Energy recovered by sleep", 40, "points"),
  restPerSol: t("Rest lost per sol", 7, "points"),
  restRecover: t("Rest gained by a quiet sol", 35, "points"),
  suppliesRecover: t("Air, water or food gauge recovered per supplied sol", 40, "points"),
  suppliesLoss: t("Air, water or food gauge lost per unsupplied sol", 28, "points"),
  packMax: t("Most sols of supplies a player can carry", 10, "sols"),
  bodyHealPerSol: t("Body healed by a quiet sol", 5, "points"),
  firstAidBody: t("Body a skilled first aid restores", 35, "points"),
  firstAidMorale: t("Morale a first aid restores", 12, "points"),
  firstAidDose: t("Dose a skilled treatment takes off", 30, "mSv", "the game's own simplification of medical care"),
  moraleCutOff: t("Morale lost per sol cut off", 6, "points"),
  moraleLinked: t("Morale gained per sol with contact", 2, "points"),
  moraleTaskDone: t("Morale gained when a task is finished", 12, "points"),
  moraleBadNews: t("Morale lost when a hazard hits", 3, "points"),
  moraleRest: t("Morale gained by a quiet sol", 8, "points"),
  accidentBody: t("Body lost in an accident", 18, "points"),
  lowGauge: t("A gauge below this slows the player", 30, "points"),
  indoorsDose: t("Dose factor indoors", 0.6, "x"),
  indoorsStorm: t("Dose factor in the habitat during a solar storm", 0.35, "x"),
  shelterStorm: t("Dose factor sheltering during a solar storm", 0.05, "x"),
  // links
  linkFailDust: t("Link failure rate in a dust storm", 0.4, "per player-sol"),
  linkFailSolar: t("Link failure rate in a solar storm", 0.6, "per player-sol"),
  linkFailSatellite: t("Link failure rate with the satellite in trouble", 0.5, "per player-sol"),
  linkFailBase: t("Link failure rate on a calm sol", 0.05, "per player-sol"),
  linkAntennaFactor: t("Failure rate with the antenna", 0.55, "x"),
  linkDownSols: t("Sols a failed link stays down", 2, "sols"),
  commWear: t("Communicator wear in a storm", 12, "points"),
  // data
  datasetMb: t("Data of one analysed site", 800, "Mb"),
  baseBufferMb: t("Data the base holds", 1700, "Mb"),
  storageBufferMb: t("Data the base holds with the storage module", 3000, "Mb"),
  relayEfficiency: t("Share of the radio rate that becomes data", 0.25, "x"),
  analyseWork: t("Analysis work of one site", 4, "units"),
  // hazards
  dustStormRun: t("Runs with a dust storm", 0.75, "share of seeds"),
  dustStormMin: t("Shortest dust storm", 5, "sols"),
  dustStormMax: t("Longest dust storm", 11, "sols"),
  solarStormRun: t("Runs with a solar storm", 0.8, "share of seeds"),
  coldNightsMin: t("Fewest cold nights", 2, "nights"),
  coldNightsMax: t("Most cold nights", 4, "nights"),
  satFirstFaultMin: t("Earliest guaranteed satellite fault", 8, "sol"),
  satFirstFaultMax: t("Latest guaranteed satellite fault", 17, "sol"),
  satFaultWindow: t("Sols to save the satellite", 5, "sols"),
  satDiagnoseWork: t("Work to diagnose a fault", 2, "units"),
  satRecoverWork: t("Work to recover the satellite", 3, "units"),
  satDrainStorm: t("Satellite charge lost per storm sol", 26, "points"),
  satRecharge: t("Satellite charge regained per sol", 10, "points"),
  // supplies
  sparePerRepair: t("Spare parts a repair uses", 1, "parts"),
  repairWork: t("Repair work", 2, "units"),
  // score weights
  pointsPerTask: t("Points per task", 200, "points"),
  pointsPerSite: t("Points per site delivered", 60, "points"),
  pointsPerResource: t("Points for resources left, at most", 120, "points"),
  pointsPerResponse: t("Points per decision under pressure", 8, "points"),
  pointsResponseMax: t("Most points decisions can give", 120, "points"),
};
