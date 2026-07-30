import { parseDurationToSeconds } from "@/features/lyrics/parse.js";

function artistNames(artists) {
  if (Array.isArray(artists)) {
    return artists.map((artist) => artist?.name || artist).filter(Boolean);
  }
  return artists ? [artists] : [];
}

export function toNativePlaybackTrack(track) {
  if (!track?.videoId) return null;
  const numericDuration =
    typeof track.durationSeconds === "number"
      ? track.durationSeconds
      : typeof track.duration === "number"
        ? track.duration
        : parseDurationToSeconds(track.duration);
  return {
    videoId: String(track.videoId),
    title: String(track.title || ""),
    artists: artistNames(track.artists),
    album: typeof track.album === "string" ? track.album : track.album?.name || "",
    thumbnail: typeof track.thumbnail === "string" ? track.thumbnail : "",
    durationSeconds: Number.isFinite(numericDuration) ? numericDuration : null,
  };
}

function transitionOverrides(overrides, queue) {
  const videoIds = new Set((queue || []).map((track) => track?.videoId).filter(Boolean));
  return Object.entries(overrides || {}).flatMap(([key, value]) => {
    const fromVideoId = [...videoIds].find((id) => key.startsWith(`${id}__`));
    if (!fromVideoId) return [];
    const toVideoId = key.slice(fromVideoId.length + 2);
    if (!videoIds.has(toVideoId)) return [];
    const seconds = Number(value?.secs);
    if (!Number.isFinite(seconds)) return [];
    return [
      {
        fromVideoId,
        toVideoId,
        seconds,
      },
    ];
  });
}

async function invokeEngine(command, args) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke(command, args);
  } catch {
    // Browser E2E and the HTML-audio fallback do not expose the native engine.
    return null;
  }
}

export function getNativeSnapshot() {
  return invokeEngine("player_get_snapshot");
}

export function replaceNativeQueue(queue) {
  const tracks = (queue || []).map(toNativePlaybackTrack).filter(Boolean);
  return invokeEngine("playback_engine_replace_queue", { queue: tracks });
}

export function setNativeCurrentTrack(track) {
  return invokeEngine("playback_engine_set_current_track", {
    track: toNativePlaybackTrack(track),
  });
}

export function updateNativeTransport({ shuffle, repeat, volume }) {
  return invokeEngine("playback_engine_update_transport", {
    update: {
      shuffle: !!shuffle,
      repeat: repeat || "none",
      volume: Number.isFinite(volume) ? volume : undefined,
    },
  });
}

export function updateNativeTransitionPolicy({
  crossfade,
  crossfadeOverrides,
  queue,
  playbackProgressive,
  automaticCrossfade,
}) {
  return invokeEngine("playback_engine_update_transition_policy", {
    update: {
      crossfadeSeconds: Number(crossfade) || 0,
      crossfadeOverrides: transitionOverrides(crossfadeOverrides, queue),
      progressive: !!playbackProgressive,
      automaticCrossfade: !!automaticCrossfade,
    },
  });
}

export function setNativeUiVisible(visible) {
  return invokeEngine("player_set_ui_visible", { visible: !!visible });
}

export function setNativeLiked(liked) {
  return invokeEngine("player_set_liked", { liked: !!liked });
}

export function playNative() {
  return invokeEngine("player_play");
}

export function pauseNative() {
  return invokeEngine("player_pause");
}

export function nextNative() {
  return invokeEngine("player_next");
}

export function previousNative() {
  return invokeEngine("player_previous");
}

export function seekNative(position) {
  return invokeEngine("player_seek", { position: Math.max(0, Number(position) || 0) });
}

export function setNativeVolume(volume) {
  return invokeEngine("player_set_volume", {
    volume: Math.max(0, Math.min(1, Number(volume) || 0)),
  });
}

export function setNativeShuffle(shuffle) {
  return invokeEngine("player_set_shuffle", { shuffle: !!shuffle });
}

export function setNativeRepeat(repeat) {
  return invokeEngine("player_set_repeat", { repeat: repeat || "none" });
}

export async function listenForNativeTrackChanges(handler) {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("playback-track-changed", ({ payload }) => handler(payload));
  } catch {
    return () => {};
  }
}

export async function listenForNativeStateChanges(handler) {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("playback-state-changed", ({ payload }) => handler(payload));
  } catch {
    return () => {};
  }
}

export async function listenForNativeProgress(handler) {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("audio-progress", ({ payload }) => handler(payload));
  } catch {
    return () => {};
  }
}
