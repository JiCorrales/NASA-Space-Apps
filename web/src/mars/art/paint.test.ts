import { describe, expect, it } from "vitest";
import { paint, spriteSize, type Sprite } from "./paint";

describe("paint", () => {
  const s: Sprite = { rows: ["aab.", ".bb."], palette: { a: "#ff0000", b: "#00ff00" } };

  it("measures a sprite", () => {
    expect(spriteSize(s)).toEqual({ w: 4, h: 2 });
  });

  it("paints one scaled rectangle per run of a colour and skips transparent pixels", () => {
    const calls: [string, number, number, number, number][] = [];
    const fake = { fillStyle: "", fillRect: (x: number, y: number, w: number, h: number) => calls.push([fake.fillStyle, x, y, w, h]) };
    const ctx = fake as unknown as CanvasRenderingContext2D;
    paint(ctx, s, 10, 20, 3);
    expect(calls).toEqual([
      ["#ff0000", 10, 20, 6, 3],
      ["#00ff00", 16, 20, 3, 3],
      ["#00ff00", 13, 23, 6, 3],
    ]);
  });
});
