export function buildMixTrackOrder(tracks) {
  const occurrences = new Map();
  return (tracks || []).flatMap((track) => {
    if (!track?.videoId) return [];
    const videoId = String(track.videoId);
    const occurrence = occurrences.get(videoId) || 0;
    occurrences.set(videoId, occurrence + 1);
    return [{ instanceId: String(track.setVideoId || `${videoId}#${occurrence}`), videoId }];
  });
}
