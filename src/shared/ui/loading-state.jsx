import { ArrowsClockwise } from "@/shared/icons/icons.jsx";

/** A compact, consistent waiting state for content views. */
export function LoadingState({ label, minHeight = 180 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        minHeight,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--r-lg)",
          background: "color-mix(in srgb, var(--bg-elevated) 82%, transparent)",
          color: "var(--text-secondary)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <ArrowsClockwise
          size={15}
          style={{ color: "var(--accent)", animation: "loading-state-spin 0.9s linear infinite" }}
        />
        <span style={{ fontSize: "var(--t13)", fontWeight: 500 }}>{label}</span>
        <span aria-hidden="true" style={{ display: "flex", gap: 3, marginLeft: 2 }}>
          {[0, 1, 2].map((index) => (
            <i
              key={index}
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "var(--accent)",
                animation: "loading-state-pulse 1.1s ease-in-out infinite",
                animationDelay: `${index * 0.14}s`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
