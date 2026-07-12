"""Delete locally imported lyrics for a video."""

from flask import jsonify

from . import blueprint
from ._services import lyrics_service
from src.type_defs import RouteResponse


@blueprint.route("/lyrics/custom/<video_id>", methods=["DELETE"])
def delete_custom_lyrics(video_id: str) -> RouteResponse:
    if lyrics_service().delete_custom(video_id):
        return jsonify({"ok": True})
    return jsonify({"error": "not found"}), 404
