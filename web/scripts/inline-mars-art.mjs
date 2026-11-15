// Builds a Mars art preview page into one static HTML file with its script inlined (no imports, no network).
// Usage: node scripts/inline-mars-art.mjs <half> [out-file]    e.g. node scripts/inline-mars-art.mjs crew
// Without an out-file it writes web/out/mars-art-<half>.html.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const half = process.argv[2] ?? "crew";
const out = resolve(process.argv[3] ?? resolve(web, "out", `mars-art-${half}.html`));
const result = await build({
  root: web,
  configFile: false,
  logLevel: "warn",
  build: {
    write: false,
    minify: true,
    lib: {
      entry: resolve(web, `src/mars/art/preview/${half}.ts`),
      formats: ["iife"],
      name: "MarsArt",
      fileName: () => "page.js",
    },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
const js = outputs.find((o) => o.type === "chunk").code.replace(/<\/script/gi, "<\\/script");
const html = readFileSync(resolve(web, `mars-art-${half}.html`), "utf8").replace(
  /<script type="module" src="[^"]*"><\/script>/,
  () => `<script>\n${js}\n</script>`,
);
if (/<script[^>]+src=/.test(html)) throw new Error("the page still loads a script");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out}: ${(html.length / 1024).toFixed(0)} KB`);
