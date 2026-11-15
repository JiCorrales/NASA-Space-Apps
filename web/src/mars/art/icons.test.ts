import { describe, expect, it } from "vitest";
import * as icons from "./icons";
import { spriteSize } from "./paint";
import { problems, VERSIONS } from "./raster";

describe("icons", () => {
  it.each(VERSIONS)("version %s: 12 x 12, equal rows, known characters, colour limit", (v) => {
    const bad: string[] = [];
    for (const k of icons.ICON_KEYS) {
      const s = icons[v][k];
      const { w, h } = spriteSize(s);
      if (w !== 12 || h !== 12) bad.push(`${k}: ${w}x${h}`);
      bad.push(...problems(s, v).map((p) => `${k}: ${p}`));
    }
    expect(bad).toEqual([]);
  });

  it("the three versions have the same keys", () => {
    expect(Object.keys(icons.B)).toEqual(Object.keys(icons.A));
    expect(Object.keys(icons.C)).toEqual(Object.keys(icons.A));
  });

  it("every icon is in a group, and no two icons share a shape", () => {
    expect(Object.values(icons.ICON_GROUPS).flat().sort()).toEqual([...icons.ICON_KEYS].sort());
    const shapes = icons.ICON_KEYS.map((k) => icons.A[k].rows.join("\n"));
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});
