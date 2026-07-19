import { useCallback, useEffect, useState } from "react";
import { API } from "@/shared/api/client.js";

// Liked-songs domain — the set of liked video ids (loaded once on mount) plus the optimistic
// like toggle: it updates local state immediately, POSTs the new rating to the backend,
// mirrors LIKE/INDIFFERENT to Last.fm Loved when connected, and reverts on error. Extracted
// verbatim from App.jsx (Step 15). `lastfm` is the useLastfmClient() handle (its `connectedRef`
// gates the Last.fm mirror). Likes load once on mount and only change through the toggle —
// there is no profile-switch reload, matching the prior in-App behavior.
export function useLikes({ lastfm }) {
  const [likedIds, setLikedIds] = useState(new Set());

  // Load liked song IDs on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/liked/ids`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLikedIds(new Set(d.ids || []));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Toggle like for a track from playlist rows
  const handleToggleLike = useCallback(
    async (track) => {
      if (!track?.videoId) return;
      const wasLiked = likedIds.has(track.videoId);
      const newRating = wasLiked ? "INDIFFERENT" : "LIKE";
      setLikedIds((prev) => {
        const s = new Set(prev);
        if (wasLiked) s.delete(track.videoId);
        else s.add(track.videoId);
        return s;
      });
      try {
        await fetch(`${API}/like/${track.videoId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: newRating,
            title: track.title || "",
            artists: track.artists || "",
            album: track.album || "",
            thumbnail: track.thumbnail || "",
            duration: track.duration || "",
          }),
        });
        // Last.fm Loved sync
        if (lastfm.connectedRef.current) {
          const lfArtist = (track.artists || "").replace(/\s*-\s*Topic$/i, "").trim();
          const lfTitle = (track.title || "").trim();
          if (lfArtist && lfTitle) {
            fetch(`${API}/lastfm/${newRating === "LIKE" ? "love" : "unlove"}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ artist: lfArtist, track: lfTitle }),
            }).catch(() => {});
          }
        }
      } catch {
        // revert on error
        setLikedIds((prev) => {
          const s = new Set(prev);
          if (wasLiked) s.add(track.videoId);
          else s.delete(track.videoId);
          return s;
        });
      }
    },
    [likedIds, lastfm]
  );

  return { likedIds, handleToggleLike };
}
