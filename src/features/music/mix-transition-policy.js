const PRESETS = new Set(["auto", "fade", "rise", "blend", "wave", "melt", "slam"]);
const VOLUME_CURVES = new Set(["smooth", "overlap", "cut"]);
const EQ_CURVES = new Set(["centerBass", "endBassSwap", "threeBandFade", "none"]);
const EFFECTS = new Set(["none", "lowPass", "highPass"]);

/**
 * Resolves playlist-owned track instances to the video-id queue pairs understood by Tauri.
 * Invalid or stale records are deliberately omitted so they cannot interrupt ordinary playback.
 */
export function resolveMixTransitionPolicy(config, queue) {
  if (!config?.enabled) return [];
  const videoIds = new Set((queue || []).map((track) => String(track?.videoId || "")).filter(Boolean));
  const trackOrder = new Map(
    (config.trackOrder || []).flatMap(({ instanceId, videoId }) =>
      instanceId && videoId ? [[String(instanceId), String(videoId)]] : []
    )
  );

  return (config.transitions || []).flatMap((transition) => {
    const fromVideoId = trackOrder.get(String(transition?.fromTrackInstanceId || ""));
    const toVideoId = trackOrder.get(String(transition?.toTrackInstanceId || ""));
    const bars = Number(transition?.bars);
    const beatOffsetMs = Number(transition?.beatOffsetMs);
    const fromBpm = Number(config.trackAnalysis?.[transition?.fromTrackInstanceId]?.bpm);
    const toBpm = Number(config.trackAnalysis?.[transition?.toTrackInstanceId]?.bpm);
    if (
      !fromVideoId ||
      !toVideoId ||
      !videoIds.has(fromVideoId) ||
      !videoIds.has(toVideoId) ||
      !PRESETS.has(transition?.preset) ||
      ![2, 4, 8].includes(bars) ||
      !VOLUME_CURVES.has(transition?.volumeCurve) ||
      !EQ_CURVES.has(transition?.eqCurve) ||
      !EFFECTS.has(transition?.effect) ||
      !Number.isFinite(beatOffsetMs) ||
      beatOffsetMs < -100 ||
      beatOffsetMs > 100
    ) {
      return [];
    }
    return [{
      fromVideoId,
      toVideoId,
      preset: transition.preset,
      bars,
      volumeCurve: transition.volumeCurve,
      eqCurve: transition.eqCurve,
      effect: transition.effect,
      beatOffsetMs,
      ...(Number.isFinite(fromBpm) && fromBpm >= 40 && fromBpm <= 300 ? { fromBpm } : {}),
      ...(Number.isFinite(toBpm) && toBpm >= 40 && toBpm <= 300 ? { toBpm } : {}),
    }];
  });
}
