// The test reads the CSS files straight from disk.
import { readFileSync } from "node:fs";

const read = (f: string): string => readFileSync(f, "utf8");
const files = ["src/screens/phone.css", "src/mars/act1/ui/act1.css", "src/mars/act1/launch/launch.css"].map(read);

/** The text inside every `@media (max-width: 640px) { ... }` block, found by matching braces. */
function phoneBlocks(css: string): string[] {
  const out: string[] = [];
  for (let at = css.indexOf("@media (max-width: 640px)"); at >= 0; at = css.indexOf("@media (max-width: 640px)", at + 1)) {
    let depth = 0, i = css.indexOf("{", at);
    const start = i;
    for (; i < css.length; i++) { if (css[i] === "{") depth++; else if (css[i] === "}" && --depth === 0) break; }
    out.push(css.slice(start + 1, i));
  }
  return out;
}

describe("phone layout CSS", () => {
  const blocks = files.flatMap(phoneBlocks);
  it("has phone rules in every file", () => {
    files.forEach((f) => expect(phoneBlocks(f).length).toBeGreaterThan(0));
  });
  it("sets no fixed minimum width wider than a 390 px phone's content inside the narrow query", () => {
    for (const b of blocks) {
      for (const m of b.matchAll(/min-width:\s*(\d+)px/g)) expect(Number(m[1])).toBeLessThanOrEqual(366);
      for (const m of b.matchAll(/minmax\(\s*(\d+)px/g)) expect(Number(m[1])).toBeLessThanOrEqual(366);
    }
  });
  it("keeps touch targets at 44 px for buttons", () => {
    expect(blocks.join("\n")).toMatch(/\.pxbtn \{[^}]*min-height: 44px/);
  });
});
