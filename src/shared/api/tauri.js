// The sole frontend boundary for Tauri Rust commands. Keep command names here so
// feature code depends on a descriptive JavaScript API rather than IPC strings.
async function invoke(command, args) {
  const { invoke: invokeCommand } = await import("@tauri-apps/api/core");
  return invokeCommand(command, args);
}

// Needed by the browser-E2E media recorder; command strings remain owned here.
export const nativeCommand = {
  audioPlay: "audio_play",
  audioPause: "audio_pause",
  audioResume: "audio_resume",
  audioSeek: "audio_seek",
  setAudioVolume: "audio_set_volume",
};

export const native = {
  setFullscreen: (fullscreen) => invoke("set_fullscreen", { fullscreen }),
  openLoginWindow: (args) => invoke("open_login_window", args),
  closeLoginWindow: () => invoke("close_login_window"),
  openComposerWindow: (videoId, overrides) =>
    invoke("open_composer_window", { videoId: videoId || null, overrides }),
  removeWindowBorderFor: (label) => invoke("remove_window_border_for", { label }),
  lockSquareFor: (label) => invoke("lock_square_for", { label }),
  clearDiscordRpc: () => invoke("clear_discord_rpc"),
  setAppIcon: (file) => invoke("set_app_icon", { file }),

  audioPlay: (url, seekTo) => invoke("audio_play", { url, seekTo }),
  audioPause: () => invoke("audio_pause"),
  audioResume: () => invoke("audio_resume"),
  audioSeek: (position) => invoke("audio_seek", { position }),
  setAudioAnalysisEnabled: (enabled) => invoke("audio_set_analysis_enabled", { enabled }),
  setAudioVolume: (volume) => invoke("audio_set_volume", { volume }),

  getPlayerSnapshot: () => invoke("player_get_snapshot"),
  setPlayerUiVisible: (visible) => invoke("player_set_ui_visible", { visible }),
  setPlayerLiked: (liked) => invoke("player_set_liked", { liked }),
  updatePlayerIntegrations: (settings) => invoke("player_update_integrations", { settings }),
  replacePlaybackQueue: (queue) => invoke("playback_engine_replace_queue", { queue }),
  setPlaybackCurrentTrack: (track) => invoke("playback_engine_set_current_track", { track }),
  updatePlaybackTransport: (update) => invoke("playback_engine_update_transport", { update }),
  updatePlaybackTransitionPolicy: (update) =>
    invoke("playback_engine_update_transition_policy", { update }),
  playerPlay: () => invoke("player_play"),
  playerRestart: () => invoke("player_restart"),
  playerPause: () => invoke("player_pause"),
  playerNext: () => invoke("player_next"),
  playerPrevious: () => invoke("player_previous"),
  playerSeek: (position) => invoke("player_seek", { position }),
  setPlayerVolume: (volume) => invoke("player_set_volume", { volume }),
  setPlayerShuffle: (shuffle) => invoke("player_set_shuffle", { shuffle }),
  setPlayerRepeat: (repeat) => invoke("player_set_repeat", { repeat }),

  relaunchApp: () => invoke("relaunch_app"),
  quitApp: () => invoke("quit_app"),
  stopServer: () => invoke("stop_server_cmd"),
  updateTrayLabels: (showLabel, quitLabel) =>
    invoke("update_tray_labels", { showLabel, quitLabel }),
  setCloseToTray: (enabled) => invoke("set_close_to_tray", { enabled }),
  captureScreenshot: () => invoke("capture_screenshot"),
  ensureSessionKeeper: (profileName) => invoke("ensure_session_keeper", { profileName }),
  rotateSessionCookies: (profileName) => invoke("rotate_session_cookies", { profileName }),
  stopSessionKeeper: () => invoke("stop_session_keeper"),
};
