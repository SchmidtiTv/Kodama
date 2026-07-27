const STORAGE_KEY = "kiyoshi-player-bar-controls";

export const DEFAULT_PLAYER_BAR_CONTROLS = Object.freeze({
  artwork: true,
  trackDetails: true,
  like: true,
  shuffle: true,
  repeat: true,
  volume: true,
  sleepTimer: true,
  queue: true,
  lyrics: true,
  videoToggle: true,
  fullscreen: true,
});

export function loadPlayerBarControls() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return DEFAULT_PLAYER_BAR_CONTROLS;

    return Object.fromEntries(
      Object.keys(DEFAULT_PLAYER_BAR_CONTROLS).map((key) => [
        key,
        typeof saved[key] === "boolean" ? saved[key] : DEFAULT_PLAYER_BAR_CONTROLS[key],
      ])
    );
  } catch {
    return DEFAULT_PLAYER_BAR_CONTROLS;
  }
}

export function togglePlayerBarControl(controls, control) {
  if (!(control in DEFAULT_PLAYER_BAR_CONTROLS)) return controls;

  const updated = { ...controls, [control]: !controls[control] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
