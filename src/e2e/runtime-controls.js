const RealDate = window.Date;
const DEFAULT_TIME = Date.parse("2026-01-01T12:00:00.000Z");

let now = DEFAULT_TIME;
let nextTimerId = 1;
const timers = new Map();
const mediaCommands = [];
let fakeTimersEnabled = false;
const nativeTimers = {
  clearInterval: window.clearInterval.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  setInterval: window.setInterval.bind(window),
  setTimeout: window.setTimeout.bind(window),
};

function E2EDate(...args) {
  if (!new.target) return new RealDate(args.length === 0 ? now : args[0]).toString();
  return new RealDate(...(args.length === 0 ? [now] : args));
}

Object.setPrototypeOf(E2EDate, RealDate);
E2EDate.prototype = RealDate.prototype;
E2EDate.now = () => now;

function schedule(callback, delay, args, interval) {
  const id = nextTimerId++;
  timers.set(id, {
    callback,
    dueAt: now + Math.max(0, Number(delay) || 0),
    args,
    interval: interval ? Math.max(1, Number(delay) || 0) : null,
  });
  return id;
}

function nextDueTimer(target) {
  return [...timers.entries()]
    .filter(([, timer]) => timer.dueAt <= target)
    .sort(([, a], [, b]) => a.dueAt - b.dueAt)[0];
}

function advance(milliseconds) {
  const target = now + Math.max(0, Number(milliseconds) || 0);
  let ran = 0;
  let entry;
  while ((entry = nextDueTimer(target))) {
    const [id, timer] = entry;
    now = timer.dueAt;
    if (timer.interval) timer.dueAt += timer.interval;
    else timers.delete(id);
    if (typeof timer.callback === "function") timer.callback(...timer.args);
    ran += 1;
    if (ran > 10_000) throw new Error("E2E clock exceeded 10,000 scheduled callbacks");
  }
  now = target;
  return ran;
}

function enableFakeTimers() {
  if (fakeTimersEnabled) return;
  fakeTimersEnabled = true;
  window.setTimeout = (callback, delay, ...args) => schedule(callback, delay, args, false);
  window.setInterval = (callback, delay, ...args) => schedule(callback, delay, args, true);
  window.clearTimeout = (id) => timers.delete(id);
  window.clearInterval = (id) => timers.delete(id);
}

function useRealTimers() {
  if (!fakeTimersEnabled) return;
  fakeTimersEnabled = false;
  window.setTimeout = nativeTimers.setTimeout;
  window.setInterval = nativeTimers.setInterval;
  window.clearTimeout = nativeTimers.clearTimeout;
  window.clearInterval = nativeTimers.clearInterval;
  timers.clear();
}

window.Date = E2EDate;

window.__kodamaE2e = {
  clock: {
    advance,
    enableFakeTimers,
    now: () => now,
    pending: () => timers.size,
    reset(timestamp = DEFAULT_TIME) {
      now = Number(timestamp);
      timers.clear();
    },
    set(timestamp) {
      now = Number(timestamp);
    },
    useRealTimers,
  },
  media: {
    clear: () => mediaCommands.splice(0),
    commands: () => mediaCommands.map((command) => ({ ...command })),
    record(command, args = {}) {
      mediaCommands.push({ command, args: structuredClone(args), timestamp: now });
    },
  },
};
