import "@kodama/e2e-network-guard";
import "@kodama/e2e-runtime-controls";
import "@kodama/e2e-bridge";

import ReactDOM from "react-dom/client";
import App from "@/app/App.jsx";
import OverlayEditorApp from "@/features/overlay/OverlayEditorApp.jsx";
// Big Picture mode is reachable via F10 or Settings > Experimental. The old
// gamepad spike remains intentionally unmounted.
import { BigPicture } from "@/features/big-picture/BigPicture.jsx";
import { installErrorCapture } from "@/app/diagnostics/error-capture.js";
import "@/app/styles/index.css";

installErrorCapture(); // capture frontend errors for the bug-report tool

// Suppress WebView2/WebKit's native right-click menu (Back/Refresh/Save as/Print) in
// packaged builds — it's a browser artifact that doesn't belong in a desktop app and has
// no use for end users. Left enabled in dev so right-click → Inspect still works there.
if (!import.meta.env.DEV) {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

console.log(
  "[boot] main.jsx executing at +" + (Date.now() - (window.__bootStart || Date.now())) + "ms"
);

const isOverlayEditor = new URLSearchParams(window.location.search).get("overlayEditor") === "1";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    {isOverlayEditor ? <OverlayEditorApp /> : <App />}
    <BigPicture />
  </>
);

// Fade out the HTML boot splash now that React has taken over.
// Done in a microtask so React has had at least one paint cycle.
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    document.documentElement.classList.add("loaded");
    console.log(
      "[boot] React mounted at +" + (Date.now() - (window.__bootStart || Date.now())) + "ms"
    );
    setTimeout(() => {
      const s = document.getElementById("boot-splash");
      if (s) s.remove();
    }, 400);
  })
);
