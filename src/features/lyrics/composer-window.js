// Open Boidu's Composer in a dedicated Kodama window, pre-filled with the active track and the
// current theme. Rust owns window creation and the audio bridge setup.
export async function openComposer(videoId) {
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    window.dispatchEvent(new Event("kodama-pause-playback"));
  } catch {
    /* intentionally ignored */
  }

  const overrides = {};
  try {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim();
    const valid = (value) => value && /^[#0-9a-zA-Z(),.%\s-]{1,60}$/.test(value);
    const put = (name, value) => {
      if (valid(value)) overrides[name] = value;
    };
    const accent = read("--accent");
    put("--color-composer-accent", accent);
    put("--color-composer-accent-dark", accent);
    put("--color-composer-accent-darker", accent);
    put("--color-composer-accent-text", accent);
    put("--color-composer-link", accent);
    if (document.documentElement.getAttribute("data-theme") !== "light") {
      put("--color-composer-bg", read("--bg-base"));
      put("--color-composer-bg-dark", read("--bg-base"));
      put("--color-composer-bg-elevated", read("--bg-elevated"));
      put("--color-composer-border", read("--border"));
      put("--color-composer-border-hover", read("--bg-hover"));
      put("--color-composer-button", read("--bg-elevated"));
      put("--color-composer-button-hover", read("--bg-hover"));
      put("--color-composer-input", read("--bg-elevated"));
      put("--color-composer-text", read("--text-primary"));
      put("--color-composer-text-secondary", read("--text-secondary"));
      put("--color-composer-text-muted", read("--text-muted"));
      put("--color-composer-text-tertiary", read("--text-muted"));
    }
  } catch {
    /* intentionally ignored */
  }
  return invoke("open_composer_window", { videoId: videoId || null, overrides });
}
