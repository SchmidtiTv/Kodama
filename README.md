# THIS IS JUST A FORK AND NOT THE ORIGINAL REPO
***
<div align="center">
  <img width="210" height="48" alt="Kodama Logo Full" src="https://github.com/user-attachments/assets/e003560b-1760-4657-a8fc-454195293937" />
</div>

## Changes from the original repository

### New features and improvements

- Added a native Rust playback engine that owns playback state, queue transitions, seeking,
  crossfades, media controls, Discord Rich Presence, Last.fm updates, and remote/overlay updates.
- Added per-profile playback-session persistence so the current track and queue can be restored
  after restarting the app without automatically resuming playback.
- Added a player-bar customizer for choosing, arranging, and saving the visible playback controls.
- Made the complete keyboard-shortcut set customizable on Windows, Linux, and macOS, including
  search, settings, sidebar, queue, feedback, navigation, playback, and zoom actions. Shortcuts can
  be disabled individually or globally, and conflicting assignments are swapped automatically.
- Added a Spotlight-style global search with unified song, album, artist, and playlist results.
- Improved macOS sidebar search suggestions and added platform-appropriate Command-key defaults.
- Added song and playlist radio playback with automatic queue deduplication.
- Added search, radio, and custom-lyrics fallback paths when the primary result is unavailable.
- Added current band-member information to artist pages, including portraits and Wikipedia links.
  Lookups now run concurrently and are cached on disk between launches.
- Made lyrics-provider results appear as each provider finishes instead of waiting for the slowest
  source.
- Added a user-configurable IPv4-first networking option for environments where IPv6 causes
  connection or streaming problems.
- Restored the last active profile automatically and added per-profile recommendation caching.
- Added explicit loading, retry, empty, and error states to Home and other data-driven views.
- Added Italian localization, enabled the available Spanish and Russian localizations, and listed
  Vietnamese as an upcoming language.
- Reduced playback overhead by running FFT/audio-level analysis only while a visible visualizer
  needs it and limiting redundant canvas redraws.
- Added a development playback-debug menu with native engine state and transport controls.

### Bug fixes

- Fixed playback resume after a restored or stopped session: when no live audio sink exists, the
  native engine now rebuilds and starts the current track instead of reporting false playback.
- Fixed selecting the currently playing track so it restarts, and fixed track selection incorrectly
  entering a loading state before playback begins.
- Fixed seeking during a crossfade selecting the outgoing track instead of the incoming track.
- Fixed native-player volume changes not being persisted, and prevented rounded native snapshots
  from repeatedly feeding tiny volume changes back into React.
- Fixed Last.fm now-playing, scrobble, and love requests running when no Last.fm account is
  connected; connection setup now also verifies that the returned session was actually saved.
- Fixed streaming failures caused by expired or immediately rejected signed media URLs by probing
  candidates, invalidating blocked URLs, retrying once, and using multiple extraction fallbacks.
- Fixed simultaneous playback and queue-warmup requests launching duplicate, slow stream
  resolutions for the same track.
- Fixed brand-account sign-in by opening a clean login session and retrying the initial verification
  while newly issued YouTube cookies settle.
- Fixed embedded-login failures being silent; the login window now reports actionable errors back
  to the app.
- Fixed profile data leaking through the in-memory playlist cache by scoping cached playlists to
  the active profile, and fixed playback continuing while switching profiles.
- Fixed Kugou lyrics by replacing an endpoint with an invalid TLS certificate and adapting to the
  working endpoint's response format.
- Fixed QQ, Kugou, and NetEase credit/header lines appearing as lyrics, including single-character
  Simplified Chinese, Traditional Chinese, and Japanese credit markers.
- Fixed NetEase selecting similarly timed covers or unrelated recordings by requiring both title
  and artist matches before using duration as a tie-breaker.
- Fixed incorrect lyrics synchronization badges by deriving word-, syllable-, line-, and plain-sync
  labels from provider metadata.
- Fixed renamed lyrics providers retaining stale labels from local storage while preserving each
  user's provider order and enabled state.
- Fixed the Lyrics Browser's “Open in Composer” action not being connected.
- Fixed broken queue artwork leaving an empty box; queue rows and the now-playing card now retain a
  shared gradient fallback when an image fails.
- Fixed Home's top row remaining side by side in a narrow content area by making it respond to the
  view width rather than the full viewport.
- Fixed media-tile artwork and play-button flicker during hover transitions.
- Fixed Bug Report and Lyrics Browser modals disappearing without their exit animations.
- Fixed visualizer audio-level listeners and console capture being registered more than once during
  hot reload.
- Fixed obsolete OBS bridge traffic and reduced unchanged overlay updates.
- Fixed native macOS traffic-light placement.
- Fixed shared-song links attempting to open the desktop app without consent; the landing page now
  asks before handing the song to Kodama.


## License

Kodama is licensed under the **[GNU Affero General Public License v3.0](LICENSE)** (AGPL-3.0).
You are free to use, study, modify and redistribute it, provided derivative works remain under
the same license and their source is made available.

The bundled lyrics Composer is a vendored component licensed under the AGPL-3.0 as well.

## Disclaimer

- Kodama is an **unofficial** client and is **not affiliated with or endorsed by YouTube or
Google**. It relies on the unofficial YouTube Music API and is provided for personal use, as-is
and without warranty. Use at your own risk.
- This Fork was primarily tested under macos!