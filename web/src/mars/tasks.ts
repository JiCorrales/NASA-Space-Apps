// The mission list.
import type { MissionTask } from "./contracts";
import type { SiteId } from "./types";

const SITES: SiteId[] = ["site-1", "site-2", "site-3"];

export const TASKS: MissionTask[] = [
  {
    id: "power-up", name: "Power up the base", summary: "Build the solar array.",
    isDone: (w) => w.modules.array.built, isFailed: () => false,
    progress: (w) => ({ done: w.modules.array.built ? 1 : 0, total: 1 }),
  },
  {
    id: "antenna", name: "Raise the antenna", summary: "Build the antenna.",
    isDone: (w) => w.modules.antenna.built, isFailed: () => false,
    progress: (w) => ({ done: w.modules.antenna.built ? 1 : 0, total: 1 }),
  },
  {
    id: "samples", name: "Sample three sites", summary: "Take a sample at each site and send its data to Earth through the satellite.",
    isDone: (w) => SITES.every((s) => w.siteDelivered(s)),
    isFailed: (w) => w.sat.lost && SITES.some((s) => !w.siteDelivered(s)),
    progress: (w) => ({ done: SITES.filter((s) => w.siteDelivered(s)).length, total: 3 }),
  },
  {
    id: "satellite", name: "Save the satellite", summary: "Bring the satellite back when it gets into trouble.",
    isDone: (w) => w.sat.saves >= 1 && w.sat.fault === null && !w.sat.lost,
    isFailed: (w) => w.sat.lost,
    progress: (w) => ({ done: w.sat.saves >= 1 && w.sat.fault === null && !w.sat.lost ? 1 : 0, total: 1 }),
  },
];
