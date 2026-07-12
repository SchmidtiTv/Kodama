// Compare dotted version strings (e.g. "1.0.0" vs "0.9.40-beta"). Returns -1 / 0 / 1.
export function compareVersions(a, b) {
  const pa = String(a)
    .split(/[.-]/)
    .map((part) => parseInt(part, 10) || 0);
  const pb = String(b)
    .split(/[.-]/)
    .map((part) => parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(pa.length, pb.length); index++) {
    const difference = (pa[index] || 0) - (pb[index] || 0);
    if (difference) return difference < 0 ? -1 : 1;
  }
  return 0;
}

export function isNewerVersion(latest, current) {
  const parse = (version) =>
    version
      .replace(/^v/, "")
      .split(".")
      .map((part) => parseInt(part) || 0);
  const latestParts = parse(latest);
  const currentParts = parse(current);
  for (let index = 0; index < Math.max(latestParts.length, currentParts.length); index++) {
    if ((latestParts[index] || 0) > (currentParts[index] || 0)) return true;
    if ((latestParts[index] || 0) < (currentParts[index] || 0)) return false;
  }
  return false;
}
