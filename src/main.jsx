import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import OverlayEditorApp from "./OverlayEditorApp.jsx";
import "./index.css";

console.log("[boot] main.jsx executing at +" + (Date.now() - (window.__bootStart || Date.now())) + "ms");

const isOverlayEditor = new URLSearchParams(window.location.search).get("overlayEditor") === "1";

ReactDOM.createRoot(document.getElementById("root")).render(
  isOverlayEditor ? <OverlayEditorApp /> : <App />
);

// ───────────────────────────────────────────────────────────────────────────
// TEMP macOS click diagnostic. Raw document-level listeners (no React) showing
// which mouse events actually arrive in the WebView. Toggle off by removing this.
// ───────────────────────────────────────────────────────────────────────────
(() => {
  const counts = { pointerdown: 0, mousedown: 0, mouseup: 0, pointerup: 0, click: 0, dblclick: 0 };
  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;left:8px;top:8px;z-index:2147483647;pointer-events:none;" +
    "font:12px/1.5 monospace;color:#0f0;background:rgba(0,0,0,0.8);padding:8px 10px;" +
    "border-radius:8px;white-space:pre;max-width:60vw;";
  const render = (last) =>
    (panel.textContent =
      "MOUSE PROBE (tap the green button)\n" +
      Object.entries(counts).map(([k, v]) => `${k.padEnd(11)} ${v}`).join("\n") +
      (last ? `\nlast: ${last}` : ""));
  render();
  const log = (type) => (e) => {
    counts[type]++;
    render(`${type} → <${(e.target && e.target.tagName) || "?"}>`);
  };
  Object.keys(counts).forEach((t) =>
    document.addEventListener(t, log(t), true) // capture phase, document level
  );
  // Dedicated test button with a RAW native click listener (bypasses React entirely).
  const btn = document.createElement("button");
  btn.textContent = "PROBE BUTTON — click me";
  btn.style.cssText =
    "position:fixed;left:8px;bottom:8px;z-index:2147483647;pointer-events:auto;" +
    "padding:12px 16px;font:14px monospace;background:#0a0;color:#fff;border:none;" +
    "border-radius:8px;cursor:pointer;";
  let nativeHits = 0;
  btn.addEventListener("click", () => {
    nativeHits++;
    btn.textContent = `NATIVE CLICK OK ×${nativeHits}`;
  });
  document.body.appendChild(panel);
  document.body.appendChild(btn);
})();

// Fade out the HTML boot splash now that React has taken over.
// Done in a microtask so React has had at least one paint cycle.
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.documentElement.classList.add("loaded");
  console.log("[boot] React mounted at +" + (Date.now() - (window.__bootStart || Date.now())) + "ms");
  setTimeout(() => {
    const s = document.getElementById("boot-splash");
    if (s) s.remove();
  }, 400);
}));
