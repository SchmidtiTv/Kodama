// Request the large artwork variant used by the player and visualizer without changing
// the smaller list/card thumbnail behavior elsewhere in the app.
export function hiResThumb(url) {
  if (!url) return url;
  if (url.includes("googleusercontent.com") || url.includes("ggpht.com")) {
    if (/=[ws]\d+/.test(url)) return url.replace(/=[ws]\d+[^/]*$/, "=w800-h800-l90-rj");
    return url + "=w800-h800-l90-rj";
  }
  return url;
}
