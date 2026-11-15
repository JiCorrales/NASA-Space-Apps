import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Act 1 of the Mars version (mars-act1.html) is its own build into the same dist/, run after the main one so that the
// main page keeps its fixed file names. Output: dist/mars-act1.html, dist/assets/mars-act1.js, dist/assets/mars-act1.css.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: "mars-act1.html",
      output: { entryFileNames: "assets/mars-act1.js", chunkFileNames: "assets/mars-act1-[name].js", assetFileNames: "assets/mars-act1[extname]" },
    },
  },
});
