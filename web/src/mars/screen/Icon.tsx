import type { ActivityId, GaugeId, ResourceView } from "../types";
import type { Sprite } from "../art/paint";
import { CHARS, GEAR, ICON, LOOK_ART, spriteUrl } from "./sprites";
import type { Look, Role } from "../types";

/** A pixel sprite as an image: whole pixels, scaled by an integer, never smoothed. Decorative: the text beside it says it all. */
export function Pix({ sprite, scale = 1, className = "" }: { sprite: Sprite | undefined; scale?: number; className?: string }) {
  if (!sprite) return null;
  const w = Math.max(...sprite.rows.map((r) => r.length)) * scale, h = sprite.rows.length * scale;
  return <img className={`pix ${className}`} src={spriteUrl(sprite)} width={w} height={h} alt="" aria-hidden="true" draggable={false} />;
}

export const Icon = ({ name, large = false }: { name: string; large?: boolean }) => <Pix sprite={ICON[name]} scale={large ? 2 : 1} className={large ? "ico ico--l" : "ico"} />;

export const GAUGE_ICON: Record<GaugeId, string> = { radiation: "radiation", energy: "energy", rest: "rest", air: "air", water: "water", food: "food", body: "body", morale: "morale" };
export const RESOURCE_ICON: Record<ResourceView["kind"], string> = { power: "power", mass: "mass", budget: "budget", data: "data", communications: "communications", time: "time" };
export const ACTIVITY_ICON: Record<ActivityId, string> = {
  build: "build", repair: "repair", clearDust: "clear_dust", sample: "sample", analyse: "analyse", readMap: "read_map", restoreLink: "restore_link",
  schedulePass: "schedule_pass", sendData: "data", moveSupplies: "move_supplies", firstAid: "first_aid", rest: "rest", shelter: "shelter", plan: "plan",
  travel: "read_map", diagnoseSatellite: "sat_fault", recoverSatellite: "sat_fault",
};

/** The player's portrait with the role's badge beside it. */
export function Portrait({ look, role }: { look: Look; role: Role }) {
  return (
    <span className="portrait">
      <Pix sprite={CHARS[LOOK_ART[look]].portrait} scale={1} />
      <Pix sprite={GEAR[role].badge} scale={1} className="portrait__badge" />
    </span>
  );
}
