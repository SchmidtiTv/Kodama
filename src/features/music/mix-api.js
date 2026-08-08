import { API } from "@/shared/api/client.js";

/** Returns the saved Mix configuration, or null when the local service is unavailable. */
export async function getPlaylistMix(playlistId) {
  const response = await fetch(`${API}/playlist/${encodeURIComponent(playlistId)}/mix`);
  return response.ok ? response.json() : null;
}
