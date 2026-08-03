function normalized(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function trackKey(track) {
  const title = normalized(track.title);
  const artists = normalized(track.artists);
  return title && artists ? `${title}\u0000${artists}` : null;
}

const VIDEO_TITLE_MARKER = /\b(?:official(?: hd)?|music|lyric) video\b/i;

export function videoEvidenceForTrack(track) {
  const evidence = new Set(track.videoEvidence || []);
  if (track.hasVideoThumbnail) evidence.add("wide-thumbnail");
  if (VIDEO_TITLE_MARKER.test(String(track.title || ""))) evidence.add("title-marker");
  if (!track.album) evidence.add("missing-album");
  return [...evidence];
}

export function isLikelyVideo(track) {
  return videoEvidenceForTrack(track).length > 0;
}

function quality(track) {
  // A reliably wide thumbnail is the only video signal we trust. `videoType`
  // is inconsistent across YouTube Music responses, so it is intentionally ignored.
  return (isLikelyVideo(track) ? 0 : 2) + (track.album ? 1 : 0);
}

/**
 * Keep one representative for exact title-and-artist duplicates in a mixed playlist.
 * Different titles (for example remixes and live recordings) are intentionally retained.
 */
export function collectTrackVersions(tracks) {
  const representativeByKey = new Map();

  tracks.forEach((track, index) => {
    const key = trackKey(track);
    if (!key) {
      representativeByKey.set(`unique:${index}`, track);
      return;
    }

    const existing = representativeByKey.get(key);
    if (!existing || quality(track) > quality(existing)) representativeByKey.set(key, track);
  });

  return [...representativeByKey.values()];
}
