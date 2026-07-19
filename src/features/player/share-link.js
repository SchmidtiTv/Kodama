// Universal share link → GitHub-Pages redirect page (tries kodama://, falls back to YT Music).
// Works for everyone regardless of whether they have Kodama installed. Title/artist/cover are
// encoded in the link so the landing page can show the song without any API call.
const KODAMA_SHARE_BASE = "https://kiyoshithedevil.github.io/Kodama/s/";

export function buildShareLink(track) {
  const p = new URLSearchParams({ v: track.videoId });
  const title = track.title || "";
  const artists = Array.isArray(track.artists)
    ? track.artists
        .map((a) => (a && a.name) || a)
        .filter(Boolean)
        .join(", ")
    : track.artists || "";
  if (title) p.set("t", title);
  if (artists) p.set("a", artists);
  if (track.thumbnail) p.set("c", track.thumbnail);
  return `${KODAMA_SHARE_BASE}?${p.toString()}`;
}
