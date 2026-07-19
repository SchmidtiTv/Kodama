const COMMAND = Object.freeze({
  dialog: {
    ask: "plugin:dialog|ask",
    confirm: "plugin:dialog|confirm",
    message: "plugin:dialog|message",
    open: "plugin:dialog|open",
    save: "plugin:dialog|save",
  },
  opener: {
    openPath: "plugin:opener|open_path",
    openUrl: "plugin:opener|open_url",
    reveal: "plugin:opener|reveal_item_in_dir",
  },
  updater: {
    check: "plugin:updater|check",
    download: "plugin:updater|download",
    downloadAndInstall: "plugin:updater|download_and_install",
    install: "plugin:updater|install",
  },
  window: {
    closeLogin: "close_login_window",
    openComposer: "open_composer_window",
    openLogin: "open_login_window",
    quit: "quit_app",
    relaunch: "relaunch_app",
    setCloseToTray: "set_close_to_tray",
    setFullscreen: "set_fullscreen",
  },
});

const DEFAULT_UPDATE = Object.freeze({
  rid: 1,
  currentVersion: "1.0.0-e2e",
  version: "1.0.1-e2e",
  date: "2026-01-01T00:00:00Z",
  body: "Fixture release notes",
  rawJson: null,
});

/**
 * Project-level façade over `browser.tauri`. Create one in `beforeEach` and
 * use it to configure the native edge of a test without opening real OS
 * dialogs, browsers, installers, or windows. `windows.list/states/switch`
 * intentionally remain real desktop-only assertions.
 */
function createTauriAdapters() {
  const mocks = new Map();

  async function mock(command, value) {
    const commandMock = await browser.tauri.mock(command);
    await commandMock.mockResolvedValue(value);
    mocks.set(command, commandMock);
    return commandMock;
  }

  async function reject(command, message = `E2E fixture rejected ${command}`) {
    const commandMock = await browser.tauri.mock(command);
    await commandMock.mockRejectedValue(new Error(message));
    mocks.set(command, commandMock);
    return commandMock;
  }

  async function calls(command) {
    const commandMock = mocks.get(command);
    if (!commandMock) throw new Error(`No E2E adapter mock is installed for ${command}`);
    await commandMock.update();
    return commandMock.mock.calls;
  }

  async function clear() {
    await Promise.all([...mocks.values()].map((commandMock) => commandMock.mockRestore()));
    mocks.clear();
  }

  return {
    command: COMMAND,
    mock,
    reject,
    calls,
    clear,
    dialog: {
      open: (path = null) => mock(COMMAND.dialog.open, path),
      save: (path = null) => mock(COMMAND.dialog.save, path),
      confirm: (accepted = true) => mock(COMMAND.dialog.confirm, accepted),
      ask: (accepted = true) => mock(COMMAND.dialog.ask, accepted),
      message: () => mock(COMMAND.dialog.message, undefined),
    },
    opener: {
      url: () => mock(COMMAND.opener.openUrl, undefined),
      path: () => mock(COMMAND.opener.openPath, undefined),
      reveal: () => mock(COMMAND.opener.reveal, undefined),
    },
    updater: {
      none: () => mock(COMMAND.updater.check, null),
      available: (update = {}) => mock(COMMAND.updater.check, { ...DEFAULT_UPDATE, ...update }),
      download: (resourceId = 2) => mock(COMMAND.updater.download, resourceId),
      install: () => mock(COMMAND.updater.install, undefined),
      downloadAndInstall: () => mock(COMMAND.updater.downloadAndInstall, undefined),
    },
    windows: {
      openLogin: () => mock(COMMAND.window.openLogin, undefined),
      closeLogin: () => mock(COMMAND.window.closeLogin, undefined),
      openComposer: () => mock(COMMAND.window.openComposer, undefined),
      setFullscreen: () => mock(COMMAND.window.setFullscreen, undefined),
      setCloseToTray: () => mock(COMMAND.window.setCloseToTray, undefined),
      relaunch: () => mock(COMMAND.window.relaunch, undefined),
      quit: () => mock(COMMAND.window.quit, undefined),
      list: () => browser.tauri.listWindows(),
      switch: (label) => browser.tauri.switchWindow(label),
      states: () =>
        browser.tauri.execute(({ core }) => core.invoke("plugin:wdio|get_window_states")),
    },
    events: {
      emit: (event, payload, target) => browser.tauri.emitEvent(event, payload, target),
    },
  };
}

module.exports = { COMMAND, DEFAULT_UPDATE, createTauriAdapters };
