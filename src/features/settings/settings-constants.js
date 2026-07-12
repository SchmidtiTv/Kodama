export const APP_ICON_DEFAULT = "Kodama App Icon - Standard Pink.png";
export const APP_ICON_GROUPS = [
  {
    id: "default",
    labelKey: "appIconDefault",
    icons: [
      { label: "Standard Pink", file: "Kodama App Icon - Standard Pink.png" },
      { label: "Standard White", file: "Kodama App Icon - Standard White.png" },
      { label: "3D Pink", file: "Kodama App Icon - 3D Pink.png" },
    ],
  },
  {
    id: "pride",
    labelKey: "appIconPride",
    icons: [
      { label: "Pride", file: "Kodama App Icon - Pride.png" },
      { label: "Progress", file: "Kodama App Icon - Progress.png" },
      { label: "Trans", file: "Kodama App Icon - Trans.png" },
      { label: "Nonbinary", file: "Kodama App Icon - Nonbinary.png" },
      { label: "Asexual", file: "Kodama App Icon - Asexual.png" },
      { label: "Bisexual", file: "Kodama App Icon - Bisexual.png" },
      { label: "Lesbian", file: "Kodama App Icon - Lesbian.png" },
      { label: "Pansexual", file: "Kodama App Icon - Pansexual.png" },
      { label: "Polyamory", file: "Kodama App Icon - Polyamory.png" },
    ],
  },
];
export const ACCENT_PRESETS = [
  // Row 1 — saturated
  { label: "Red", value: "#e53935" },
  { label: "Orange", value: "#f4511e" },
  { label: "Amber", value: "#fb8c00" },
  { label: "Lime", value: "#7cb342" },
  { label: "Teal", value: "#00897b" },
  { label: "Cyan", value: "#0097a7" },
  { label: "Blue", value: "#1e88e5" },
  { label: "Purple", value: "#8e24aa" },
  { label: "Pink", value: "#e91e8c" },
  // Row 2 — medium
  { label: "Salmon", value: "#ef7070" },
  { label: "Coral", value: "#f48060" },
  { label: "Gold", value: "#fba840" },
  { label: "Yellow-Green", value: "#a0c464" },
  { label: "Medium Teal", value: "#3aab9f" },
  { label: "Medium Cyan", value: "#3ab4c4" },
  { label: "Cornflower", value: "#5ca8ec" },
  { label: "Orchid", value: "#aa5cc4" },
  { label: "Hot Pink", value: "#ee60a8" },
  // Row 3 — light
  { label: "Light Red", value: "#f4a0a0" },
  { label: "Peach", value: "#f4a890" },
  { label: "Light Amber", value: "#fcc880" },
  { label: "Light Lime", value: "#bcd888" },
  { label: "Mint", value: "#7cccc4" },
  { label: "Light Cyan", value: "#7cd0dc" },
  { label: "Light Blue", value: "#94c4f4" },
  { label: "Lavender", value: "#c494dc" },
  { label: "Light Pink", value: "#f4a0c8" },
  // Row 4 — pastel
  { label: "Pastel Red", value: "#f9cece" },
  { label: "Pastel Peach", value: "#f8ccb8" },
  { label: "Pastel Yellow", value: "#fde4b8" },
  { label: "Pastel Green", value: "#d8ecb8" },
  { label: "Pastel Mint", value: "#b0e0dc" },
  { label: "Pastel Cyan", value: "#b0e4ec" },
  { label: "Pastel Blue", value: "#c4dcf8" },
  { label: "Pastel Purple", value: "#dcbcec" },
  { label: "Pastel Pink", value: "#f8cce0" },
];

export const ZOOM_STEPS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
export const ZOOM_LABELS = ["80%", "90%", "100%", "110%", "120%", "130%", "140%", "150%"];
export const FONT_STEPS = [0.85, 0.93, 1.0, 1.1, 1.2, 1.35, 1.5];
export const FONT_LABELS = FONT_STEPS.map((s) => `${Math.round(13 * s)}px`);
export const DEFAULT_SHORTCUTS = {
  playPause: "Space",
  nextTrack: "ArrowRight",
  prevTrack: "ArrowLeft",
  volUp: "ArrowUp",
  volDown: "ArrowDown",
  fullscreen: "KeyF",
  mute: "KeyM",
  lyrics: "KeyL",
  seekBack: "Comma",
  seekForward: "Period",
  zoomIn: "Ctrl+Equal",
  zoomOut: "Ctrl+Minus",
};
