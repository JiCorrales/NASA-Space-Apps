/** Entry of the crew half's preview page (`mars-art-crew.html`): characters, gear and icons. */
import * as characters from "../characters";
import * as gear from "../gear";
import * as extras from "../extras";
import * as icons from "../icons";
import type { Version } from "../raster";
import { renderSheet, type Entry, type Family } from "./sheet";

const by = <T>(f: (v: Version) => T): Record<Version, T> => ({ A: f("A"), B: f("B"), C: f("C") });

function characterFamily(): Family {
  const entries: Entry[] = [];
  for (const look of characters.LOOKS) {
    entries.push({ name: `${look} portrait`, frames: by((v) => [[characters[v][look].portrait]]) });
    for (const pose of characters.POSES) {
      entries.push({
        name: `${look} ${pose.replace("_", " ")}`,
        frames: by((v) => characters[v][look].poses[pose].map((s) => [s])),
        ms: pose === "work" ? 450 : 260,
      });
    }
  }
  return {
    id: "characters",
    title: "Characters: four looks",
    note: characters.LOOKS.map((l) => characters.LOOK_LABEL[l]).join(" | "),
    entries,
  };
}

function gearFamily(): Family {
  const entries: Entry[] = [];
  const turn = ["stand_down", "stand_left", "stand_up", "stand_right"] as const;
  for (const role of gear.ROLES) {
    entries.push({ name: `${role} badge`, frames: by((v) => [[gear[v][role].badge]]) });
    entries.push({
      name: `${role} overlay alone`,
      frames: by((v) => turn.map((p) => [gear[v][role].overlays.round[p][0]!])),
      ms: 700,
    });
    for (const look of characters.LOOKS) {
      entries.push({
        name: `${role} on ${look}, turning`,
        frames: by((v) => turn.map((p) => [characters[v][look].poses[p][0]!, gear[v][role].overlays[look][p][0]!])),
        ms: 700,
      });
    }
    for (const pose of ["work", "carry", "rest", "cutoff", "hurt"] as const)
      entries.push({
        name: `${role} on broad, ${pose}`,
        frames: by((v) => characters[v].broad.poses[pose].map((s, i) => [s, gear[v][role].overlays.broad[pose][i]!])),
        ms: 450,
      });
    entries.push({
      name: `${role} on round, walking`,
      frames: by((v) =>
        characters[v].round.poses.walk_down.map((s, i) => [s, gear[v][role].overlays.round.walk_down[i]!]),
      ),
      ms: 260,
    });
  }
  return {
    id: "gear",
    title: "Role gear: overlays over any look, and badges",
    note: gear.ROLES.map((r) => gear.ROLE_LABEL[r]).join(" | ") + ". Sizes and colours are those of the overlay.",
    entries,
  };
}

function iconFamilies(): Family[] {
  return Object.entries(icons.ICON_GROUPS).map(([group, keys]) => ({
    id: `icons-${group.replace(/ /g, "-")}`,
    title: `Icons: ${group}`,
    entries: keys.map((k) => ({ name: k.replace(/_/g, " "), frames: by((v) => [[icons[v][k]]]) })),
  }));
}

function extrasFamily(): Family {
  const keys = Object.keys(extras.A) as (keyof extras.Extras)[];
  return {
    id: "extras",
    title: "Extras: communicator bubbles, emotes, boot prints",
    entries: keys.map((k) => ({ name: k.replace(/_/g, " "), frames: by((v) => extras[v][k].map((s) => [s])), ms: 120 })),
  };
}

renderSheet(
  document.getElementById("root")!,
  "Mars version: crew and interface art (half 1)",
  "Every asset in versions A (8-bit), B (16-bit) and C (flat), at 4x on the UI background and on Mars ground, then at 1x and 2x.",
  [characterFamily(), gearFamily(), ...iconFamilies(), extrasFamily()],
);
