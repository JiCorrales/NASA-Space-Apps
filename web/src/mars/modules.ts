// The base: a habitat that lands built, and three modules the crew builds by spending materials, power and sols.
import type { BaseModule } from "./contracts";
import { TEAM } from "./data";
import type { ModuleId } from "./types";

export const MODULES: Record<ModuleId, BaseModule> = {
  habitat: {
    id: "habitat", name: "Habitat", builtAtStart: true, materialsKg: 0, workUnits: 0, powerWhPerWork: 0,
    effect: "Air, water and a place out of the worst of the radiation. Draws the base load.", offset: { x: 0, y: 0 },
  },
  array: {
    id: "array", name: "Solar array", builtAtStart: false, materialsKg: TEAM.arrayMaterials.value, workUnits: TEAM.arrayWork.value,
    powerWhPerWork: TEAM.buildPowerWh.value, effect: "Makes the base's power. Dust settles on it.", offset: { x: 2, y: -1 },
  },
  antenna: {
    id: "antenna", name: "Antenna", builtAtStart: false, materialsKg: TEAM.antennaMaterials.value, workUnits: TEAM.antennaWork.value,
    powerWhPerWork: TEAM.buildPowerWh.value, effect: "Reaches the satellite. Communicators work farther out and come back sooner.", offset: { x: -2, y: -1 },
  },
  storage: {
    id: "storage", name: "Storage", builtAtStart: false, materialsKg: TEAM.storageMaterials.value, workUnits: TEAM.storageWork.value,
    powerWhPerWork: TEAM.buildPowerWh.value, effect: "More battery and room for data waiting to be sent.", offset: { x: 0, y: 2 },
  },
};

export const MODULE_IDS: ModuleId[] = ["habitat", "array", "antenna", "storage"];
