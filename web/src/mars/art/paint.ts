/**
 * Pixel sprites as code: one character per pixel, a palette from character to colour, `.` is transparent.
 * Same API in every art module so the two halves of the art (crew and world) merge without changes.
 */

export interface Sprite {
  rows: string[];
  palette: Record<string, string>;
}

/** A sprite or an animation (2 to 4 frames, played in order). */
export type Art = Sprite | Sprite[];

export const spriteSize = (s: Sprite): { w: number; h: number } => ({
  w: Math.max(0, ...s.rows.map((r) => r.length)),
  h: s.rows.length,
});

/**
 * Draws the sprite with its top-left corner at (x, y), each pixel as a `scale` x `scale` square: one rectangle per
 * run of a colour. `.`, a space, or any character missing from the palette is transparent.
 */
export function paint(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, scale = 1): void {
  sprite.rows.forEach((row, j) => {
    for (let i = 0; i < row.length; ) {
      const ch = row[i]!;
      let n = 1;
      while (i + n < row.length && row[i + n] === ch) n++;
      const colour = ch === "." || ch === " " ? undefined : sprite.palette[ch];
      if (colour) {
        ctx.fillStyle = colour;
        ctx.fillRect(x + i * scale, y + j * scale, n * scale, scale);
      }
      i += n;
    }
  });
}
