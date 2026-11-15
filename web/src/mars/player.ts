// The four roles. `Player` holds what all four share; each role adds its skills and its own activities.
// Any role may attempt any activity (see `World.activityFor`): the arrays below say what a role does best.
import { ACTIVITIES } from "./activities";
import type { Activity } from "./contracts";
import { TEAM } from "./data";
import type {
  ActivityId, CarryView, GaugeId, GaugeView, Look, OutReason, PlayerId, Pos, Role, Skill, SkillId, SiteId, LinkCause,
} from "./types";

const act = (...ids: ActivityId[]): Activity[] => ids.map((id) => ACTIVITIES[id]);
const sk = (id: SkillId, name: string, level: number): Skill => ({ id, name, level });
/** Everyone can do these without a skill. */
const COMMON: ActivityId[] = ["rest", "shelter", "travel", "handOver"];

export interface Carry { rations: number; samples: SiteId[]; spares: number }

export abstract class Player {
  abstract readonly role: Role;
  abstract readonly skills: Skill[];
  abstract readonly activities: Activity[];

  position: Pos;
  energy = 100;
  rest = 100;
  dose = 0;
  air = 100;
  water = 100;
  food = 100;
  body = 100;
  morale = 100;
  commIntegrity = 100;
  carry: Carry = { rations: 0, samples: [], spares: 0 };
  /** The communicator works this sol. */
  linked = true;
  linkCause: LinkCause | null = null;
  /** Sols the failed link stays down after this one. */
  linkDownSols = 0;
  /** The next sol's failure roll is skipped (a link was restored). */
  linkGuard = false;
  /** Sheltering this sol. */
  sheltered = false;
  /** Was outside the habitat at some point this sol. */
  outdoorsToday = false;
  out: OutReason | null = null;
  outSol: number | null = null;
  // counters for the score
  workDone = 0;
  hazardResponses = 0;
  deadLinkActions = 0;
  solsOut = 0;

  constructor(readonly id: PlayerId, readonly name: string, readonly look: Look, start: Pos) {
    this.position = { ...start };
  }

  skillLevel(id: SkillId | null): number {
    if (!id) return 1;
    return this.skills.find((s) => s.id === id)?.level ?? 0;
  }

  get active(): boolean { return this.out === null; }

  isOwn(id: ActivityId): boolean { return this.activities.some((a) => a.id === id); }

  /** Gauges that are below the line that slows the player down. */
  lowCount(): number {
    const lim = TEAM.lowGauge.value;
    let n = [this.energy, this.rest, this.air, this.water, this.food, this.body, this.morale].filter((v) => v < lim).length;
    if (this.dose >= 250) n++;
    return n;
  }

  /** 1 when well; each low gauge slows the player. */
  healthFactor(): number { return Math.max(0.35, Math.pow(0.85, this.lowCount())); }

  gaugeValue(id: GaugeId): number {
    return { radiation: this.dose, energy: this.energy, rest: this.rest, air: this.air, water: this.water, food: this.food, body: this.body, morale: this.morale }[id];
  }

  gauges(): GaugeView[] {
    const lim = TEAM.lowGauge.value;
    const g = (id: GaugeId, label: string, value: number, source: string, unit = "points", max = 100): GaugeView => {
      const good = id === "radiation" ? Math.max(0, 1 - value / max) : Math.max(0, Math.min(1, value / max));
      return { id, label, value: Math.round(value * 10) / 10, max, unit, good, low: id === "radiation" ? value >= 250 : value < lim, source };
    };
    return [
      g("radiation", "Radiation dose", this.dose, "R07", "mSv", 600),
      g("energy", "Energy", this.energy, "team"),
      g("rest", "Rest", this.rest, "HL28"),
      g("air", "Air", this.air, "HL19"),
      g("water", "Water", this.water, "HL20"),
      g("food", "Food", this.food, "HL21"),
      g("body", "Body", this.body, "team"),
      g("morale", "Morale", this.morale, "team"),
    ];
  }

  carrying(): CarryView { return { rations: this.carry.rations, samples: [...this.carry.samples], spares: this.carry.spares }; }
}

export class Commander extends Player {
  readonly role = "commander" as const;
  readonly skills = [sk("planning", "Planning", 2), sk("logistics", "Logistics", 2), sk("firstAid", "First aid", 2)];
  readonly activities = act("plan", "moveSupplies", "bringSupplies", "firstAid", ...COMMON);
}

export class Engineer extends Player {
  readonly role = "engineer" as const;
  readonly skills = [sk("construction", "Construction", 2), sk("repair", "Repair", 2), sk("power", "Power", 2)];
  readonly activities = act("build", "repair", "clearDust", ...COMMON);
}

export class Scientist extends Player {
  readonly role = "scientist" as const;
  readonly skills = [sk("geology", "Geology", 2), sk("analysis", "Analysis", 2), sk("navigation", "Navigation", 2)];
  readonly activities = act("sample", "analyse", "readMap", ...COMMON);
}

export class CommsOfficer extends Player {
  readonly role = "comms" as const;
  readonly skills = [sk("radio", "Radio", 2), sk("relay", "Relay", 2), sk("forecasting", "Forecasting", 2)];
  readonly activities = act("restoreLink", "schedulePass", "sendData", "diagnoseSatellite", "recoverSatellite", ...COMMON);
}

export function createPlayer(role: Role, id: PlayerId, name: string, look: Look, start: Pos): Player {
  switch (role) {
    case "commander": return new Commander(id, name, look, start);
    case "engineer": return new Engineer(id, name, look, start);
    case "scientist": return new Scientist(id, name, look, start);
    case "comms": return new CommsOfficer(id, name, look, start);
  }
}
