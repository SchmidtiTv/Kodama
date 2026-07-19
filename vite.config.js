import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Single source of truth for the app version: src-tauri/tauri.conf.json (the file tauri-action
// reads when building a release). Injected at build time so the in-app version can never drift
// from the actually-shipped version — no more hardcoded APP_VERSION to forget on bump.
const appVersion = JSON.parse(
  readFileSync(new URL("./src-tauri/tauri.conf.json", import.meta.url), "utf-8")
).version;

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // WDIO can intercept Tauri IPC only in E2E builds. Production resolves
      // this import to an empty module, so no test bridge is bundled or run.
      "@kodama/e2e-bridge":
        process.env.VITE_E2E === "true"
          ? "@wdio/tauri-plugin"
          : fileURLToPath(new URL("./src/e2e/noop.js", import.meta.url)),
    },
  },
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    watch: {
      // Ignore the Python backend directory — file writes there (custom lyrics,
      // cache, profiles, etc.) must NOT trigger Vite HMR and cause a full page reload.
      ignored: ["**/python-backend/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
