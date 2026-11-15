import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Act 2 page (mars.html) is its own build into the same dist/, run after the main one so that the main page keeps
// its fixed file names. Output: dist/mars.html, dist/assets/mars.js, dist/assets/mars.css.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: "mars.html",
      output: { entryFileNames: "assets/mars.js", chunkFileNames: "assets/mars-[name].js", assetFileNames: "assets/mars[extname]" },
    },
  },
});
