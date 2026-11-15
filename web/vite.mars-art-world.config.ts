import { defineConfig, type Plugin } from "vite";

/** Builds web/mars-art-world.html into one file with the script inlined: out/mars-art-world.html. */
function inlineScript(): Plugin {
  return {
    name: "inline-script",
    enforce: "post",
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.type === "asset" && f.fileName.endsWith(".html"));
      if (!html || html.type !== "asset") return;
      let text = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== "chunk") continue;
        const re = new RegExp(`<script[^>]*src="[^"]*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*></script>`);
        text = text.replace(re, () => `<script type="module">\n${file.code.replace(/<\/script/gi, "<\\/script")}\n</script>`);
        delete bundle[name];
      }
      html.source = text;
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [inlineScript()],
  build: {
    outDir: "out",
    emptyOutDir: false,
    assetsInlineLimit: 100000000,
    rollupOptions: { input: "mars-art-world.html" },
  },
});
