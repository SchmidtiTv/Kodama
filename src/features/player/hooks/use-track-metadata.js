import { useCallback, useEffect, useState } from "react";

import { API } from "../../../shared/api/client.js";

// Keeps player-only metadata requests out of the transport component. Song stats are
// retained for the existing request/cache behavior even though no current control renders them.
export function useTrackMetadata(track) {
  const [songStats, setSongStats] = useState(null);
  const [fetchedBrowseIds, setFetchedBrowseIds] = useState({});

  useEffect(() => {
    if (!track?.videoId) {
      setSongStats(null);
      return;
    }
    setSongStats(null);
    fetch(`${API}/song/stats/${track.videoId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((stats) => {
        if (stats && !stats.error) setSongStats(stats);
      })
      .catch(() => {});
  }, [track?.videoId]);

  const fetchMoreBrowseIds = useCallback(() => {
    if (!track?.videoId || track.albumBrowseId || track.artistBrowseId) return;
    if (fetchedBrowseIds[track.videoId]) return;
    fetch(`${API}/song/info/${track.videoId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((metadata) => {
        if (metadata && !metadata.error) {
          setFetchedBrowseIds((previous) => {
            const next = { ...previous, [track.videoId]: metadata };
            const keys = Object.keys(next);
            if (keys.length > 100)
              keys.slice(0, keys.length - 100).forEach((key) => delete next[key]);
            return next;
          });
        }
      })
      .catch(() => {});
  }, [track?.videoId, track?.albumBrowseId, track?.artistBrowseId, fetchedBrowseIds]);

  return { songStats, fetchedBrowseIds, fetchMoreBrowseIds };
}
