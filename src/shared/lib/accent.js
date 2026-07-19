// Accent-colour helpers extracted from App.jsx: a smooth RAF-driven fade of the global
// `--accent` CSS variable, and derivation of a vibrant, legible accent hex from a cover image.
// Pure DOM/canvas/math — no app imports. hexToRgb / rgbToHsl / hslToHex are internal.

// ── Smoothly fade the global --accent from its current value to a target hex ──
let accentFadeRaf = 0;
function hexToRgb(str) {
  if (!str) return null;
  str = str.trim();
  const m = str.match(/^#?([0-9a-fA-F]{6})$/);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  return null;
}
export function setAccentSmooth(toHex, duration = 380) {
  const root = document.documentElement;
  const a = hexToRgb(getComputedStyle(root).getPropertyValue("--accent"));
  const b = hexToRgb(toHex);
  if (!a || !b) {
    root.style.setProperty("--accent", toHex);
    return;
  }
  cancelAnimationFrame(accentFadeRaf);
  const t0 = performance.now();
  const hx = (v) => Math.round(v).toString(16).padStart(2, "0");
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
    root.style.setProperty(
      "--accent",
      `#${hx(a[0] + (b[0] - a[0]) * e)}${hx(a[1] + (b[1] - a[1]) * e)}${hx(a[2] + (b[2] - a[2]) * e)}`
    );
    if (p < 1) accentFadeRaf = requestAnimationFrame(tick);
  };
  accentFadeRaf = requestAnimationFrame(tick);
}

// ── Dynamic accent: derive a vibrant, legible accent hex from a cover image ──
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    d = mx - mn;
  let h = 0;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const to = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
// Pick the most saturated×bright pixel, then normalise S/L into a legible accent band.
// `satMin` raises the saturation floor (vibrancy); `light` sets the target lightness centre.
export function vibrantAccentFromImage(img, satMin = 0.5, light = 0.6) {
  const c = document.createElement("canvas");
  c.width = 48;
  c.height = 48;
  const cx = c.getContext("2d");
  cx.drawImage(img, 0, 0, 48, 48);
  const d = cx.getImageData(0, 0, 48, 48).data;
  let br = 0,
    bg = 0,
    bb = 0,
    best = -1;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    const score = (mx === 0 ? 0 : (mx - mn) / mx) * (mx / 255); // saturation × brightness
    if (score > best) {
      best = score;
      br = r;
      bg = g;
      bb = b;
    }
  }
  const [h, s, l] = rgbToHsl(br, bg, bb);
  const L = Math.min(light + 0.08, Math.max(light - 0.08, l)); // keep near the chosen centre
  return hslToHex(h, Math.min(1, Math.max(satMin, s)), Math.min(0.92, Math.max(0.12, L)));
}
