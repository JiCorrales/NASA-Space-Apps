/** Entry of the crew half's preview page (`mars-art-crew.html`): characters, gear and icons. */
import * as characters from "../characters";
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

renderSheet(
  document.getElementById("root")!,
  "Mars version: crew and interface art (half 1)",
  "Every asset in versions A (8-bit), B (16-bit) and C (flat), at 4x on the UI background and on Mars ground, then at 1x and 2x.",
  [characterFamily()],
);
