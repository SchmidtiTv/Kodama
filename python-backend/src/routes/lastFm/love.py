"""Mark a track as loved on Last.fm."""

from . import blueprint
from ._actions import submit_track_action
from src.type_defs import RouteResponse


@blueprint.route("/love", methods=["POST"])
def lastfm_love() -> RouteResponse:
    return submit_track_action("track.love")
