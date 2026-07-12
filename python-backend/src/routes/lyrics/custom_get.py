"""Read locally imported lyrics for a video."""

from flask import jsonify

from . import blueprint
from ._services import lyrics_service
from src.type_defs import RouteResponse


@blueprint.route("/lyrics/custom/<video_id>", methods=["GET"])
def get_custom_lyrics(video_id: str) -> RouteResponse:
    lyrics = lyrics_service().get_custom(video_id)
    if lyrics is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(lyrics)
