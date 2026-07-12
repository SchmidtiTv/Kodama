"""Complete Last.fm desktop authorization."""

from flask import jsonify, request
from typing import cast

from . import blueprint
from ._services import lastfm_client, read_active_metadata, write_active_metadata
from src.type_defs import RouteResponse


@blueprint.route("/session", methods=["POST"])
def lastfm_session() -> RouteResponse:
    token = (request.json or {}).get("token", "")
    if not token:
        return jsonify({"error": "missing_token"}), 400

    ok, response = lastfm_client().lastfm_call("auth.getSession", {"token": token}, signed=True)
    if not ok:
        return jsonify({"error": response.get("message", "session_failed")}), 400

    lastfm_session = response.get("session", {})
    if not isinstance(lastfm_session, dict):
        return jsonify({"error": "session_failed"}), 400
    metadata = read_active_metadata()
    key = lastfm_session.get("key", "")
    username = lastfm_session.get("name", "")
    metadata["lastfm_session"] = key if isinstance(key, str) else ""
    metadata["lastfm_user"] = username if isinstance(username, str) else ""
    write_active_metadata(metadata)
    return jsonify({"connected": True, "username": username if isinstance(username, str) else ""})
