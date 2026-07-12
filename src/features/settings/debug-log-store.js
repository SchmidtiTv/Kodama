// Captures browser-console output for the settings Debug tab without coupling that UI to App.
export const frontendLogs = [];
const MAX_FRONTEND_LOGS = 500;

const original = { log: console.log, warn: console.warn, error: console.error, info: console.info };
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
    frontendLogs.push({ ts: Date.now() / 1000, level: level.toUpperCase(), msg: message, source: "frontend" });
    if (frontendLogs.length > MAX_FRONTEND_LOGS) frontendLogs.shift();
  };
});
