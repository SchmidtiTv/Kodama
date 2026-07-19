const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const args = [
  "run",
  "tauri",
  "--",
  "build",
  "--debug",
  "--no-bundle",
  "--features",
  "e2e",
  "--config",
  "src-tauri/tauri.e2e.conf.json",
];

const child = spawn(npmCommand, args, {
  cwd: root,
  env: { ...process.env, VITE_E2E: "true" },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Failed to start the E2E desktop build:", error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`E2E desktop build stopped by ${signal}.`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
