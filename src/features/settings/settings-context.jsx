/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";

const AppearanceSettingsContext = createContext(null);
const PlaybackSettingsContext = createContext(null);
const LyricsSettingsContext = createContext(null);
const IntegrationSettingsContext = createContext(null);
const ShortcutSettingsContext = createContext(null);

function useRequiredContext(context, name) {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used within SettingsProviders`);
  return value;
}

// Keep each domain value independent: changing a lyric toggle, for example, does not invalidate
// consumers of appearance settings. App remains the temporary owner of persistence/actions until
// each slice is migrated in place.
export function SettingsProviders({
  appearance,
  playback,
  lyrics,
  integrations,
  shortcuts,
  children,
}) {
  const appearanceValue = useMemo(() => appearance, [appearance]);
  const playbackValue = useMemo(() => playback, [playback]);
  const lyricsValue = useMemo(() => lyrics, [lyrics]);
  const integrationValue = useMemo(() => integrations, [integrations]);
  const shortcutValue = useMemo(() => shortcuts, [shortcuts]);

  return (
    <AppearanceSettingsContext.Provider value={appearanceValue}>
      <PlaybackSettingsContext.Provider value={playbackValue}>
        <LyricsSettingsContext.Provider value={lyricsValue}>
          <IntegrationSettingsContext.Provider value={integrationValue}>
            <ShortcutSettingsContext.Provider value={shortcutValue}>
              {children}
            </ShortcutSettingsContext.Provider>
          </IntegrationSettingsContext.Provider>
        </LyricsSettingsContext.Provider>
      </PlaybackSettingsContext.Provider>
    </AppearanceSettingsContext.Provider>
  );
}

export function AppearanceSettingsProvider({ value, children }) {
  return <AppearanceSettingsContext.Provider value={value}>{children}</AppearanceSettingsContext.Provider>;
}

export const useAppearanceSettings = () =>
  useRequiredContext(AppearanceSettingsContext, "useAppearanceSettings");
export const usePlaybackSettings = () =>
  useRequiredContext(PlaybackSettingsContext, "usePlaybackSettings");
export const useLyricsSettings = () =>
  useRequiredContext(LyricsSettingsContext, "useLyricsSettings");
export const useIntegrationSettings = () =>
  useRequiredContext(IntegrationSettingsContext, "useIntegrationSettings");
export const useShortcutSettings = () =>
  useRequiredContext(ShortcutSettingsContext, "useShortcutSettings");
