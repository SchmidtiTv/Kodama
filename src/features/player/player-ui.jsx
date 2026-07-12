// Transitional public entry point. Keep App's import stable while the player feature is split
// into independently owned queue, playback, and visualizer modules.
export { Player } from "./player.jsx";
export { QueuePanel } from "./queue-panel.jsx";
export { CoverView, VIZ_DEFAULTS } from "./cover-view.jsx";
