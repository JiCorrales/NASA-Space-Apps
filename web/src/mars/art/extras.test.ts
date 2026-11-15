import { describe, expect, it } from "vitest";
import * as extras from "./extras";
import { spriteSize, type Sprite } from "./paint";
import { problems, VERSIONS } from "./raster";

describe("extras", () => {
  it.each(VERSIONS)("version %s: equal rows, known characters, colour limit", (v) => {
    const bad = (Object.entries(extras[v]) as [string, Sprite[]][]).flatMap(([k, frames]) =>
      frames.flatMap((s, i) => problems(s, v).map((p) => `${k}[${i}]: ${p}`)),
    );
    expect(bad).toEqual([]);
  });

  it("the three versions have the same keys, frames and sizes", () => {
    const shape = (v: "A" | "B" | "C") =>
      (Object.entries(extras[v]) as [string, Sprite[]][]).map(([k, f]) => `${k}:${f.length}:${f.map((s) => JSON.stringify(spriteSize(s))).join()}`);
    expect(shape("B")).toEqual(shape("A"));
    expect(shape("C")).toEqual(shape("A"));
  });
});
