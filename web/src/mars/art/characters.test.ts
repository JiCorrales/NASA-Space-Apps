import { describe, expect, it } from "vitest";
import * as characters from "./characters";
import { problems, VERSIONS } from "./raster";
import { spriteSize, type Sprite } from "./paint";

function all(v: "A" | "B" | "C"): [string, Sprite][] {
  const out: [string, Sprite][] = [];
  for (const look of characters.LOOKS) {
    const s = characters[v][look];
    out.push([`${look}.portrait`, s.portrait]);
    for (const p of characters.POSES) s.poses[p].forEach((f, i) => out.push([`${look}.${p}[${i}]`, f]));
  }
  return out;
}

describe("characters", () => {
  it.each(VERSIONS)("version %s: equal rows, known characters, colour limit", (v) => {
    const bad = all(v).flatMap(([k, s]) => problems(s, v).map((p) => `${k}: ${p}`));
    expect(bad).toEqual([]);
  });

  it("the three versions have the same keys and frame counts", () => {
    const shape = (v: "A" | "B" | "C") => all(v).map(([k]) => k);
    expect(shape("B")).toEqual(shape("A"));
    expect(shape("C")).toEqual(shape("A"));
  });

  it("characters are 16 x 24, portraits 32 x 32, animations 2 to 4 frames", () => {
    for (const v of VERSIONS) {
      for (const look of characters.LOOKS) {
        expect(spriteSize(characters[v][look].portrait)).toEqual({ w: 32, h: 32 });
        for (const p of characters.POSES) {
          const frames = characters[v][look].poses[p];
          expect(frames.length === 1 || (frames.length >= 2 && frames.length <= 4)).toBe(true);
          for (const f of frames) expect(spriteSize(f)).toEqual({ w: 16, h: 24 });
        }
      }
    }
  });

  it("the four looks differ in silhouette, not only in colour", () => {
    const silhouette = (look: characters.LookId) =>
      characters.A[look].poses.stand_down[0]!.rows.map((r) => r.replace(/[^.]/g, "#")).join("\n");
    const set = new Set(characters.LOOKS.map(silhouette));
    expect(set.size).toBe(4);
  });
});
