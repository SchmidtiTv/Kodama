// Captures browser-console output for the settings Debug tab without coupling that UI to App.
// The store survives Vite module reloads so console methods are wrapped only once.
const MAX_FRONTEND_LOGS = 500;
const debugStore =
  globalThis.__kodamaConsoleCapture ||
  (globalThis.__kodamaConsoleCapture = { logs: [], patched: false });

export const frontendLogs = debugStore.logs;

if (!debugStore.patched) {
  debugStore.patched = true;
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };
  ["log", "warn", "error", "info"].forEach((level) => {
    console[level] = (...args) => {
      original[level](...args);
      const message = args
        .map((value) => {
          if (value instanceof Error) return value.stack || value.message;
          if (typeof value === "object" && value !== null) {
            try {
              return JSON.stringify(value);
            } catch {
              return String(value);
            }
          }
          return String(value);
        })
        .join(" ");
      debugStore.logs.push({
        ts: Date.now() / 1000,
        level: level.toUpperCase(),
        msg: message,
        source: "frontend",
      });
      if (debugStore.logs.length > MAX_FRONTEND_LOGS) debugStore.logs.shift();
    };
  });
}
