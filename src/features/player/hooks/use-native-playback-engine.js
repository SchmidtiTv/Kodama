import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNativeSnapshot,
  listenForNativeProgress,
  listenForNativeStateChanges,
  listenForNativeTrackChanges,
  playNative,
  replaceNativeQueue,
  setNativeCurrentTrack,
  setNativeUiVisible,
  setNativeVolume,
  updateNativeTransitionPolicy,
  updateNativeTransport,
} from "../native-playback-engine.js";

export function useNativePlaybackEngine({
  queue,
  track,
  restoredTrackId,
  shuffle,
  repeat,
  volume,
  crossfade,
  crossfadeOverrides,
  playbackProgressive,
  showVideoView,
  queueRef,
  trackRef,
  setProgress,
  setDuration,
  setLoading,
  setIsPlaying,
  setTrack,
  setShuffle,
  setRepeat,
  setVolume,
}) {
  const [nativeAvailable, setNativeAvailable] = useState(null);
  const syncedTrackIdRef = useRef(null);
  const initialTrackRef = useRef(track?.videoId || null);
  const preferencesSyncedRef = useRef(false);

  const applySnapshot = useCallback(
    (snapshot) => {
      if (!snapshot?.status) return;
      setIsPlaying(snapshot.status === "playing" || snapshot.status === "loading");
      setLoading(snapshot.status === "loading");
      if (Number.isFinite(snapshot.positionSeconds)) {
        setProgress(snapshot.positionSeconds);
      }
      if (Number.isFinite(snapshot.durationSeconds)) {
        setDuration(snapshot.durationSeconds);
      }
      if (preferencesSyncedRef.current) {
        if (typeof snapshot.shuffle === "boolean") {
          setShuffle(snapshot.shuffle);
        }
        if (["none", "all", "one"].includes(snapshot.repeat)) {
          setRepeat(snapshot.repeat);
        }
        if (Number.isFinite(snapshot.volume)) {
          setVolume(snapshot.volume);
          localStorage.setItem("kiyoshi-volume", snapshot.volume);
        }
      }
    },
    [setDuration, setIsPlaying, setLoading, setProgress, setRepeat, setShuffle, setVolume]
  );

  useEffect(() => {
    let cancelled = false;
    getNativeSnapshot().then((snapshot) => {
      if (cancelled) return;
      const available = snapshot !== null;
      setNativeAvailable(available);
      if (available) applySnapshot(snapshot);
    });
    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  useEffect(() => {
    const syncVisibility = () => {
      const visible = document.visibilityState === "visible";
      setNativeUiVisible(visible).then((snapshot) => {
        if (visible && snapshot) applySnapshot(snapshot);
      });
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      setNativeUiVisible(false);
    };
  }, [applySnapshot]);

  useEffect(() => {
    if (!nativeAvailable) return;
    let cancelled = false;
    const syncSelection = async () => {
      await replaceNativeQueue(queue);
      if (cancelled) return;

      const videoId = track?.videoId || null;
      if (syncedTrackIdRef.current === videoId) return;
      syncedTrackIdRef.current = videoId;

      const snapshot = await setNativeCurrentTrack(track);
      if (cancelled || !snapshot || !videoId) return;
      const isRestoredSelection =
        initialTrackRef.current === videoId && restoredTrackId === videoId;
      initialTrackRef.current = null;
      if (!isRestoredSelection) {
        await playNative();
      }
    };
    syncSelection();
    return () => {
      cancelled = true;
    };
  }, [nativeAvailable, queue, restoredTrackId, track]);

  useEffect(() => {
    if (!nativeAvailable) return;
    Promise.all([updateNativeTransport({ shuffle, repeat }), setNativeVolume(volume)]).then(() => {
      preferencesSyncedRef.current = true;
    });
  }, [nativeAvailable, shuffle, repeat, volume]);

  useEffect(() => {
    if (!nativeAvailable) return;
    updateNativeTransitionPolicy({
      crossfade,
      crossfadeOverrides,
      queue,
      playbackProgressive,
      automaticCrossfade: !showVideoView,
    });
  }, [crossfade, crossfadeOverrides, nativeAvailable, playbackProgressive, queue, showVideoView]);

  useEffect(() => {
    let unlisten = () => {};
    let cancelled = false;
    listenForNativeTrackChanges(({ track: nativeTrack } = {}) => {
      if (!nativeTrack?.videoId) return;
      const nextTrack =
        queueRef.current.find((item) => item.videoId === nativeTrack.videoId) ||
        (trackRef.current?.videoId === nativeTrack.videoId ? trackRef.current : nativeTrack);

      syncedTrackIdRef.current = nativeTrack.videoId;
      trackRef.current = nextTrack;
      setProgress(0);
      setTrack(nextTrack);
    }).then((cleanup) => {
      if (cancelled) cleanup();
      else unlisten = cleanup;
    });
    return () => {
      cancelled = true;
      unlisten();
    };
  }, [queueRef, setProgress, setTrack, trackRef]);

  useEffect(() => {
    let unlisten = () => {};
    let cancelled = false;
    listenForNativeStateChanges(applySnapshot).then((cleanup) => {
      if (cancelled) cleanup();
      else unlisten = cleanup;
    });
    return () => {
      cancelled = true;
      unlisten();
    };
  }, [applySnapshot]);

  useEffect(() => {
    let unlisten = () => {};
    let cancelled = false;
    listenForNativeProgress((progress) => {
      if (Number.isFinite(progress?.position)) setProgress(progress.position);
      if (Number.isFinite(progress?.duration)) setDuration(progress.duration);
      if (typeof progress?.paused === "boolean") setIsPlaying(!progress.paused);
      setLoading(false);
    }).then((cleanup) => {
      if (cancelled) cleanup();
      else unlisten = cleanup;
    });
    return () => {
      cancelled = true;
      unlisten();
    };
  }, [setDuration, setIsPlaying, setLoading, setProgress]);

  return nativeAvailable;
}
