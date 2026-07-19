// Global CSS injected by App at the top of the render tree: the shared @keyframes used across
// the app (exported as a string for a one-shot <style> tag) plus a once-per-load injection of
// the tooltip in/out keyframes into document.head. Extracted from App.jsx to keep the root
// component readable.
export const GLOBAL_KEYFRAMES = `
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
  @keyframes skipLeft {
    0%   { transform: translateX(0); }
    30%  { transform: translateX(-6px); }
    65%  { transform: translateX(3px); }
    100% { transform: translateX(0); }
  }
  @keyframes skipRight {
    0%   { transform: translateX(0); }
    30%  { transform: translateX(6px); }
    65%  { transform: translateX(-3px); }
    100% { transform: translateX(0); }
  }
  @keyframes heartPop {
    0%   { transform: scale(1); }
    25%  { transform: scale(1.5); }
    55%  { transform: scale(0.88); }
    80%  { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  @keyframes flashbangFade { 0%,50%{opacity:1} 100%{opacity:0} }
  @keyframes tetoSlideIn {
    from { transform: translateX(110%); }
    to   { transform: translateX(0); }
  }
  @keyframes tetoSlideOut {
    from { transform: translateX(0); }
    to   { transform: translateX(110%); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-18px); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0) scale(1); }
    to   { opacity: 0; transform: translateX(16px) scale(0.96); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pinShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-10px); }
    40%     { transform: translateX(10px); }
    60%     { transform: translateX(-8px); }
    80%     { transform: translateX(8px); }
  }
  @keyframes coverPop {
    0%   { transform: scale(0.96); }
    60%  { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  @keyframes eqBar1 { 0%,100%{height:4px} 50%{height:14px} }
  @keyframes eqBar2 { 0%,100%{height:10px} 35%{height:3px} 70%{height:14px} }
  @keyframes eqBar3 { 0%,100%{height:7px} 45%{height:14px} 80%{height:3px} }
  @keyframes navPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
  @keyframes splashLogoIn {
    from { opacity: 0; transform: scale(0.65); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes splashTextIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes splashFadeOut {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(1.04); }
  }
  @keyframes splashGlow {
    0%,100% { transform: scale(1);   opacity: 0.6; }
    50%     { transform: scale(1.25); opacity: 1; }
  }
  .icon-btn {
    background: transparent;
    border: none;
    cursor: default;
    padding: 0;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }
  .icon-btn:hover {
    background: var(--bg-hover);
  }
  .dbg-btn:hover {
    background: var(--bg-elevated) !important;
    color: var(--text-primary) !important;
  }
  @keyframes noteFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-14px) scale(1.08); }
  }
  .grid-card:hover .grid-card-footer {
    background: rgb(32,32,36) !important;
  }
  .view-tab-btn:not(.active):hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent) !important;
    color: var(--text-primary) !important;
  }
`;

// Inject tooltip keyframes once
if (typeof document !== "undefined" && !document.getElementById("kiyoshi-tooltip-kf")) {
  const s = document.createElement("style");
  s.id = "kiyoshi-tooltip-kf";
  s.textContent = `
    @keyframes tooltipIn{from{opacity:0;transform:translate(-50%,calc(-100% + 4px))}to{opacity:1;transform:translate(-50%,-100%)}}
    @keyframes tooltipOut{from{opacity:1;transform:translate(-50%,-100%)}to{opacity:0;transform:translate(-50%,calc(-100% + 4px))}}
  `;
  document.head.appendChild(s);
}
