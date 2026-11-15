import { describe, expect, it } from "vitest";
import type { Art, Sprite } from "./paint";
import { COLOUR_LIMIT, VERSIONS, type Ver } from "./marsPalette";
import * as terrain from "./terrain";
import * as base from "./base";
import * as satellite from "./satellite";
import * as hazards from "./hazards";
import * as vehicles from "./vehicles";

const families = { terrain, base, satellite, hazards, vehicles } as Record<string, Record<Ver, Record<string, Art>>>;
const frames = (a: Art): Sprite[] => (Array.isArray(a) ? a : [a]);

describe.each(Object.entries(families))("world art: %s", (_name, mod) => {
  it("has the same keys in A, B and C", () => {
    const keys = Object.keys(mod.A).sort();
    expect(Object.keys(mod.B).sort()).toEqual(keys);
    expect(Object.keys(mod.C).sort()).toEqual(keys);
  });

  it("has equal-length rows, only palette characters, and the same size and frame count in every version", () => {
    for (const v of VERSIONS) {
      for (const [key, art] of Object.entries(mod[v])) {
        for (const s of frames(art)) {
          const w = s.rows[0]!.length;
          for (const r of s.rows) expect(r.length, `${v} ${key}`).toBe(w);
          for (const ch of s.rows.join("")) if (ch !== ".") expect(s.palette[ch], `${v} ${key} "${ch}"`).toBeTypeOf("string");
        }
        const a = frames(mod.A[key]!), f = frames(art);
        expect(f.length, `${v} ${key} frames`).toBe(a.length);
        expect([f[0]!.rows.length, f[0]!.rows[0]!.length], `${v} ${key} size`).toEqual([a[0]!.rows.length, a[0]!.rows[0]!.length]);
      }
    }
  });

  it("respects the colour limit of each version, and C has no outline colour", () => {
    for (const v of VERSIONS)
      for (const [key, art] of Object.entries(mod[v]))
        for (const s of frames(art)) {
          const used = new Set([...s.rows.join("")].filter((c) => c !== "."));
          expect(new Set([...used].map((c) => s.palette[c])).size, `${v} ${key}`).toBeLessThanOrEqual(COLOUR_LIMIT[v]);
          if (v === "C") expect(used.has("o"), `C ${key} has an outline`).toBe(false);
        }
  });
});

describe("terrain tiles", () => {
  it("are 16 x 16 and the seamless ones have no seam: the sprites are drawn on a torus", () => {
    for (const v of VERSIONS) for (const k of terrain.SEAMLESS) {
      const s = terrain[v][k] as Sprite;
      expect([s.rows.length, s.rows[0]!.length]).toEqual([16, 16]);
      expect(s.rows.join("").includes("."), `${v} ${k} must be opaque`).toBe(false);
    }
  });
  it("tiles do not jump at the seam: the edge columns look like their neighbours inside the tile", () => {
    // Same-colour neighbours across the wrap are as common as inside the tile (within a margin): no hard border.
    for (const v of VERSIONS) for (const k of terrain.SEAMLESS) {
      const s = terrain[v][k] as Sprite;
      const same = (a: string, b: string) => s.palette[a] === s.palette[b];
      let seam = 0, inner = 0;
      for (let y = 0; y < 16; y++) {
        if (same(s.rows[y]![15]!, s.rows[y]![0]!)) seam++;
        if (same(s.rows[y]![7]!, s.rows[y]![8]!)) inner++;
        if (same(s.rows[15]![y]!, s.rows[0]![y]!)) seam++;
        if (same(s.rows[7]![y]!, s.rows[8]![y]!)) inner++;
      }
      expect(seam, `${v} ${k}`).toBeGreaterThanOrEqual(inner - 14);
    }
  });
});
