import { useEffect } from "react";

/**
 * Synchronizes playback-integration preferences with the native engine.
 * Settings arrive through a ref because App declares the integration settings
 * after it creates the controller. App increments integrationRevision whenever
 * one changes so the Rust worker applies it immediately.
 */
export function usePlayerNativeBridges({
  integrationsRef,
  integrationRevision,
}) {
  useEffect(() => {
    const settings = integrationsRef.current;
    import("@tauri-apps/api/core")
      .then(({ invoke }) =>
        invoke("player_update_integrations", {
          settings: {
            discordEnabled: !!settings.discordRpc,
            discordStatusDisplay: settings.discordStatusDisplay || "song",
            lastfmConnected: !!settings.lastfmConnected,
            youtubeHistoryEnabled: !!settings.youtubeHistoryEnabled,
            overlayUpdatesEnabled: true,
            remoteEnabled: !!settings.remoteEnabled,
          },
        })
      )
      .catch(() => {
        // Browser E2E and the HTML-audio fallback do not expose native integrations.
      });
  }, [integrationsRef, integrationRevision]);
}
