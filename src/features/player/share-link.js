const KODAMA_SHARE_BASE = "https://kodama.kiyoshi.dev/s/";

export function buildShareLink(track) {
  return `${KODAMA_SHARE_BASE}?${track.videoId}`;
}
