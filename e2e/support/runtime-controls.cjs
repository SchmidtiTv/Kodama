function callRuntime(method, ...args) {
  return browser.execute(
    (runtimeMethod, runtimeArgs) => window.__kodamaE2e.clock[runtimeMethod](...runtimeArgs),
    method,
    args
  );
}

const clock = {
  advance: (milliseconds) => callRuntime("advance", milliseconds),
  enableFakeTimers: () => callRuntime("enableFakeTimers"),
  now: () => callRuntime("now"),
  pending: () => callRuntime("pending"),
  reset: (timestamp) => callRuntime("reset", timestamp),
  set: (timestamp) => callRuntime("set", timestamp),
  useRealTimers: () => callRuntime("useRealTimers"),
};

const media = {
  clear: () => browser.execute(() => window.__kodamaE2e.media.clear()),
  commands: () => browser.execute(() => window.__kodamaE2e.media.commands()),
  emit: (event, payload, target) => browser.tauri.emitEvent(event, payload, target),
};

async function resetRuntimeControls() {
  await clock.enableFakeTimers();
  await clock.reset();
  await media.clear();
}

module.exports = { clock, media, resetRuntimeControls };
