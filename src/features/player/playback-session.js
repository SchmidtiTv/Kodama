const STORAGE_PREFIX = "kodama-playback-session";
const MAX_QUEUE_LENGTH = 500;

function activeProfileName() {
  if (window.__activeProfile) return window.__activeProfile;

  try {
    return JSON.parse(localStorage.getItem("kiyoshi-profiles-cache") || "{}").current || "default";
  } catch {
    return "default";
  }
}

function storageKey() {
  return `${STORAGE_PREFIX}-${activeProfileName()}`;
}

function isTrack(value) {
  return Boolean(
    value && typeof value === "object" && typeof value.videoId === "string" && value.videoId
  );
}

function dedupeTracks(tracks) {
  const seen = new Set();
  return tracks.filter((track) => {
    if (!isTrack(track) || seen.has(track.videoId)) return false;
    seen.add(track.videoId);
    return true;
  });
}

/** Restores only metadata, never the prior playing state, so app startup does not auto-resume. */
export function loadPlaybackSession() {
  try {
    const session = JSON.parse(localStorage.getItem(storageKey()) || "null");
    if (!session || !isTrack(session.track)) return null;
    return {
      track: session.track,
      queue: dedupeTracks(
        Array.isArray(session.queue) ? session.queue.slice(0, MAX_QUEUE_LENGTH) : []
      ),
    };
  } catch {
    return null;
  }
}

export function savePlaybackSession(track, queue) {
  try {
    if (!isTrack(track)) {
      localStorage.removeItem(storageKey());
      return;
    }
    localStorage.setItem(
      storageKey(),
      JSON.stringify({
        track,
        queue: dedupeTracks(Array.isArray(queue) ? queue.slice(0, MAX_QUEUE_LENGTH) : []),
      })
    );
  } catch {
    // Storage can be unavailable (e.g. private browsing); playback must still work in memory.
  }
}
