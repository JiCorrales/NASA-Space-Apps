/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the built page works from any folder (Unity WebGL template, static host).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // Fixed file names so a Unity WebGL template can reference the page without hashes.
    rollupOptions: { output: { entryFileNames: "assets/page.js", assetFileNames: "assets/page[extname]" } },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
