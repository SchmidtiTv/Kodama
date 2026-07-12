"""Shared Last.fm track-action request handling."""

from flask import jsonify, request
from typing import Callable, cast

from ._services import lastfm_client, read_active_metadata
from src.type_defs import RouteResponse


def submit_track_action(
    method: str,
    http: str = "POST",
    extra: Callable[[dict[str, object]], dict[str, object]] | None = None,
) -> RouteResponse:
    """Submit now-playing, scrobble, love, or unlove data to Last.fm."""
    session_key = read_active_metadata().get("lastfm_session")
    if not session_key:
        return jsonify({"error": "not_connected"}), 400

    data = cast(dict[str, object], request.json or {})
    artist, track = data.get("artist", ""), data.get("track", "")
    if not artist or not track:
        return jsonify({"error": "missing_meta"}), 400

    params = {"sk": session_key, "artist": artist, "track": track}
    if data.get("album"):
        params["album"] = data["album"]
    duration = data.get("duration")
    if isinstance(duration, str | int | float):
        try:
            params["duration"] = str(int(float(duration)))
        except (TypeError, ValueError):
            pass
    if extra is not None:
        params.update(extra(data))

    ok, response = lastfm_client().lastfm_call(method, params, http=http, signed=True)
    if ok:
        return jsonify({"ok": True}), 200
    return jsonify({"ok": False, "error": response}), 502
