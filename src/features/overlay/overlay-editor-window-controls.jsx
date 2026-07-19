import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { Minus, X } from "@/shared/icons/icons.jsx";

const editorWindow = getCurrentWebviewWindow();

export function OverlayEditorWindowControls() {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const check = () =>
      editorWindow.isMaximized().then((value) => {
        if (!cancelled) setMaximized(value);
      });
    check();
    const unlisten = editorWindow.onResized(() => check());
    return () => {
      cancelled = true;
      unlisten.then((dispose) => dispose());
    };
  }, []);
  const base =
    "w-9 h-7 flex items-center justify-center rounded text-secondary transition-colors shrink-0";
  return (
    <div className="flex items-center gap-0.5 ml-1" style={{ pointerEvents: "all" }}>
      <button
        type="button"
        className={`${base} hover:bg-[var(--bg-hover)]`}
        onClick={() => editorWindow.minimize()}
        aria-label="Minimize"
      >
        <Minus size={11} />
      </button>
      <button
        type="button"
        className={`${base} hover:bg-[var(--bg-hover)]`}
        onClick={() => editorWindow.toggleMaximize()}
        aria-label="Maximize"
      >
        {maximized ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="2" y="0" width="8" height="8" rx="0.5" />
            <path d="M0 2v7a1 1 0 0 0 1 1h7" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0.5" y="0.5" width="9" height="9" rx="0.5" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className={`${base} hover:bg-[#c42b1c] hover:text-white!`}
        onClick={() => editorWindow.close()}
        aria-label="Close"
      >
        <X size={11} />
      </button>
    </div>
  );
}
