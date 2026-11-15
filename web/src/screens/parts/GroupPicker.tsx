import type { GroupDef, MissionState } from "../../bridge/types";
import { OptionCard } from "../../ui";
import type { Send } from "../send";

/** Names of the decision groups as the player reads them. */
export const GROUP_LABEL: Record<string, string> = {
  region: "Region to watch", orbit: "Orbit", revisit: "How often to see the region", format: "Format",
  power: "Power", attitude: "Attitude control", storage: "Image storage", instrument: "Instrument",
  radio: "Radio", groundStation: "Ground station", backupStation: "Backup station", launch: "Launch", tests: "Tests",
};

export function findGroup(state: MissionState, group: string): GroupDef | undefined {
  return state.groups.find((g) => g.group === group);
}

export function isPicked(state: MissionState, group: string, id: string): boolean {
  const v = state.design[group as keyof MissionState["design"]];
  return Array.isArray(v) ? v.includes(id) : v === id;
}

/**
 * One decision group: its options as cards. Single groups send choose, multi groups send toggle.
 * A missing group (not in the state) shows a line instead of failing.
 */
export function GroupPicker({ state, group, send, heading = "h3", compact = false }: {
  state: MissionState; group: string; send: Send; heading?: "h2" | "h3"; compact?: boolean;
}) {
  const def = findGroup(state, group);
  const H = heading;
  const label = GROUP_LABEL[group] ?? group;
  const id = `group-${group}`;
  return (
    <section className={`group ${compact ? "group--compact" : ""}`} aria-labelledby={id}>
      <H id={id} className="group__title">{label}</H>
      {!def ? (
        <p className="muted">Options coming.</p>
      ) : (
        <ul className="group__options">
          {def.options.map((o) => (
            <li key={o.id}>
              <OptionCard option={o} selected={isPicked(state, group, o.id)}
                onSelect={() => def.multi ? send("toggle", { group: def.group, id: o.id }) : send("choose", { group: def.group, id: o.id })} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
