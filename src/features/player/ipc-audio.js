// IpcAudio — extracted from App.jsx (Step 11). Rust-audio-backed HTMLAudioElement-like
// adapter owned by the player controller. Self-contained: only Tauri dynamic imports + browser APIs.
// ── IpcAudio ─────────────────────────────────────────────────────────────────
// Drop-in replacement for `new Audio()` that routes playback through the Rust
// host process (kiyoshi-music.exe) instead of WebView2 / msedgewebview2.exe.
// This makes the audio session visible to OBS Application Audio Capture as
// "Kodama".  The API surface mirrors the parts of HTMLAudioElement that
// the Player component uses, so no other code changes are required.
export class IpcAudio {
  constructor() {
    this._src = "";
    this._srcDirty = false; // true when src was set but play() not called yet
    this._pendingSeekTo = 0; // seek target to use on the next play() call
    this._currentTime = 0;
    this._duration = 0;
    this._paused = true;
    this._volume = 0.16; // same default as Rust thread (0.4² quadratic)
    this._listeners = {};
    this._invoke = null; // resolved lazily on first use

    // Fallback: if Rust commands don't exist (binary not recompiled),
    // _fallback is set to a plain HTMLAudioElement and all calls route there.
    this._fallback = null; // null = not decided, false = Rust works, Audio = fallback
    this._probePromise = null; // dedup the one-time probe
    this._e2eMedia = globalThis.__kodamaE2e?.media;

    // Resolve Tauri invoke/listen modules asynchronously on construction.
    import("@tauri-apps/api/core").then(({ invoke }) => {
      this._invoke = invoke;
      if (this._e2eMedia) {
        this._fallback = false;
        this._probePromise = Promise.resolve();
        return;
      }
      // Probe immediately: try a harmless command to see if Rust audio exists.
      this._probe(invoke);
    });
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("audio-progress", ({ payload }) => {
        if (this._fallback) return; // ignore Rust events when in fallback mode
        this._currentTime = payload.position;
        if (payload.duration > 0) this._duration = payload.duration;
        if (payload.paused !== this._paused) this._paused = payload.paused;
        this._fire("timeupdate");
      });
      listen("audio-ended", () => {
        if (this._fallback) return;
        this._paused = true;
        this._fire("ended");
      });
      listen("audio-loaded", ({ payload }) => {
        if (this._fallback) return;
        if (payload.duration > 0) this._duration = payload.duration;
        this._fire("loadedmetadata");
        this._fire("canplay");
      });
      listen("audio-error", ({ payload }) => {
        if (this._fallback) return;
        console.error("[IpcAudio] Rust decode error:", payload);
        this._fire("error");
      });
    });
  }

  // ── Fallback probe ──────────────────────────────────────────────────────────
  // Calls audio_set_volume (side-effect-free) to check if the Rust command
  // exists.  If it fails with "unknown command", switch to HTML5 Audio.
  _probe(invoke) {
    if (this._probePromise) return this._probePromise;
    // Use audio_pause as a harmless no-op probe — it does nothing when no song
    // is playing, and importantly does NOT touch volume state.
    this._probePromise = invoke("audio_pause")
      .then(() => {
        this._fallback = false;
        console.log("[IpcAudio] Rust audio commands available ✓");
        // Now sync the stored volume to Rust so it's ready for first play
        invoke("audio_set_volume", { volume: this._volume });
      })
      .catch(() => {
        console.warn("[IpcAudio] Rust audio commands not found — falling back to HTML5 Audio");
        this._fallback = this._createFallbackAudio();
        if (this._src) this._fallback.src = this._src;
        this._fallback.volume = this._volume;
      });
    return this._probePromise;
  }

  _createFallbackAudio() {
    const a = new Audio();
    // Wire native events → our listener system
    for (const evt of [
      "timeupdate",
      "ended",
      "loadedmetadata",
      "canplay",
      "error",
      "volumechange",
    ]) {
      a.addEventListener(evt, () => this._fire(evt));
    }
    return a;
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  _cmd(name, args) {
    if (this._e2eMedia) {
      this._e2eMedia.record(name, args || {});
      return Promise.resolve();
    }
    if (this._fallback) return Promise.resolve(); // Rust path disabled
    console.log("[IpcAudio] →", name, args?.url ? args.url.substring(0, 80) + "…" : "");
    const go = (invoke) =>
      invoke(name, args || {}).catch((e) => console.error("[IpcAudio] ERROR", name, e));
    if (this._invoke) {
      go(this._invoke);
    } else {
      import("@tauri-apps/api/core").then(({ invoke }) => {
        this._invoke = invoke;
        go(invoke);
      });
    }
    return Promise.resolve();
  }

  _fire(type) {
    (this._listeners[type] || []).forEach((h) => {
      try {
        h({ type });
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ── HTMLAudioElement-compatible API ────────────────────────────────────────
  // _fb() returns the fallback Audio if active, or false/null.
  // null = probe still running (undecided), false = Rust is active, Audio = fallback
  get _fb() {
    return this._fallback;
  }

  get src() {
    return this._fb ? this._fb.src : this._src;
  }
  set src(url) {
    // Always store locally so we can replay onto fallback if probe hasn't finished
    this._src = url;
    this._srcDirty = true;
    this._pendingSeekTo = 0;
    if (this._fb) {
      this._fb.src = url;
    } else if (this._fb === null && this._probePromise) {
      // Probe still running — queue replay
      this._probePromise.then(() => {
        if (this._fb) this._fb.src = url;
      });
    }
  }

  get currentTime() {
    return this._fb ? this._fb.currentTime : this._currentTime;
  }
  set currentTime(t) {
    if (this._fb) {
      this._fb.currentTime = t;
      return;
    }
    this._currentTime = t;
    if (this._srcDirty) {
      this._pendingSeekTo = t;
    } else {
      this._cmd("audio_seek", { position: t });
    }
  }

  get duration() {
    return this._fb ? this._fb.duration : this._duration;
  }
  get paused() {
    return this._fb ? this._fb.paused : this._paused;
  }

  get volume() {
    return this._fb ? this._fb.volume : this._volume;
  }
  set volume(v) {
    this._volume = v; // always store for probe replay
    if (this._fb) {
      this._fb.volume = v;
      this._fire("volumechange");
      return;
    }
    this._cmd("audio_set_volume", { volume: v });
    this._fire("volumechange");
  }

  play() {
    // If probe hasn't resolved yet, wait for it then play
    if (this._fallback === null && this._probePromise) {
      return this._probePromise.then(() => this.play());
    }
    if (this._fb) return this._fb.play();
    if (this._srcDirty && this._src) {
      this._srcDirty = false;
      const seekTo = this._pendingSeekTo;
      this._pendingSeekTo = 0;
      this._paused = false;
      console.log("[IpcAudio] play() → audio_play (new src)");
      this._cmd("audio_play", { url: this._src, seekTo });
    } else {
      this._paused = false;
      console.log("[IpcAudio] play() → audio_resume");
      this._cmd("audio_resume");
    }
    return Promise.resolve();
  }

  pause() {
    if (this._fb) {
      this._fb.pause();
      return;
    }
    this._paused = true;
    this._cmd("audio_pause");
  }

  addEventListener(type, handler) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(handler);
  }

  removeEventListener(type, handler) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter((h) => h !== handler);
  }
}
