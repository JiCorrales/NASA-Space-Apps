import { describe, expect, it } from "vitest";
import * as characters from "./characters";
import * as gear from "./gear";
import { spriteSize } from "./paint";
import { problems, VERSIONS } from "./raster";

describe("gear", () => {
  it.each(VERSIONS)("version %s: equal rows, known characters, colour limit", (v) => {
    const bad: string[] = [];
    for (const role of gear.ROLES) {
      const r = gear[v][role];
      bad.push(...problems(r.badge, v).map((p) => `${role}.badge: ${p}`));
      if (spriteSize(r.badge).w !== 12 || spriteSize(r.badge).h !== 12) bad.push(`${role}.badge size`);
      for (const look of characters.LOOKS)
        for (const p of gear.GEAR_POSES)
          r.overlays[look][p].forEach((s, i) => bad.push(...problems(s, v).map((x) => `${role}.${look}.${p}[${i}]: ${x}`)));
    }
    expect(bad).toEqual([]);
  });

  it("the three versions have the same keys", () => {
    const keys = (v: "A" | "B" | "C") =>
      gear.ROLES.flatMap((r) => characters.LOOKS.flatMap((l) => gear.GEAR_POSES.map((p) => `${r}.${l}.${p}.${gear[v][r].overlays[l][p].length}`)));
    expect(keys("B")).toEqual(keys("A"));
    expect(keys("C")).toEqual(keys("A"));
  });

  it("overlays have the character's size and as many frames as the pose they fit", () => {
    for (const v of VERSIONS)
      for (const role of gear.ROLES)
        for (const look of characters.LOOKS)
          for (const p of gear.GEAR_POSES) {
            const o = gear[v][role].overlays[look][p];
            expect(o.length).toBe(characters[v][look].poses[p].length);
            for (const s of o) expect(spriteSize(s)).toEqual({ w: 16, h: 24 });
          }
  });

  it("the four roles differ in the shape of their gear, not only in colour", () => {
    const shape = (r: gear.RoleId) => gear.A[r].overlays.round.stand_down[0]!.rows.map((x) => x.replace(/[^.]/g, "#")).join("");
    expect(new Set(gear.ROLES.map(shape)).size).toBe(4);
  });
});
