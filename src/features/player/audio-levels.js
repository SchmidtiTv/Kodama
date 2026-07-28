// Shared real-time audio levels streamed from the Rust audio thread (`audio-levels`
// event, ~30fps). One listener feeds a mutable singleton; visualizer components read
// `audioLevels.bands` / `.level` inside their own rAF loop (no React re-renders).
const analysisStore =
  globalThis.__kodamaAudioAnalysis ||
  (globalThis.__kodamaAudioAnalysis = {
    levels: {
      bands: new Array(48).fill(0),
      level: 0,
      ts: 0,
    },
    listenerStarted: false,
    activeConsumers: 0,
  });

export const audioLevels = analysisStore.levels;

export function startAudioLevels() {
  if (analysisStore.listenerStarted) return;
  analysisStore.listenerStarted = true;
  import("@tauri-apps/api/event")
    .then(({ listen }) => {
      listen("audio-levels", ({ payload }) => {
        if (payload && Array.isArray(payload.bands)) audioLevels.bands = payload.bands;
        audioLevels.level = (payload && payload.level) || 0;
        audioLevels.ts = performance.now();
      });
    })
    .catch(() => {});
}

function setNativeAnalysisEnabled(enabled) {
  import("@tauri-apps/api/core")
    .then(({ invoke }) => invoke("audio_set_analysis_enabled", { enabled }))
    .catch(() => {});
}

// Visualizer surfaces acquire analysis only while they are actually drawing. This keeps sample
// capture, FFT work, and the Tauri event stream dormant for normal audio-only playback.
export function acquireAudioAnalysis() {
  analysisStore.activeConsumers += 1;
  if (analysisStore.activeConsumers === 1) {
    audioLevels.bands = new Array(48).fill(0);
    audioLevels.level = 0;
    startAudioLevels();
    setNativeAnalysisEnabled(true);
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    analysisStore.activeConsumers = Math.max(0, analysisStore.activeConsumers - 1);
    if (analysisStore.activeConsumers === 0) setNativeAnalysisEnabled(false);
  };
}
