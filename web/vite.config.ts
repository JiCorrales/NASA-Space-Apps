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
    // The cockpit tests render every recorded frame; with all files in parallel on a slow PC that took longer
    // than the 5 s default (it already did before the launch act), so they get more room.
    testTimeout: 20000,
  },
});
