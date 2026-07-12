"""Remove the loved mark from a Last.fm track."""

from . import blueprint
from ._actions import submit_track_action
from src.type_defs import RouteResponse


@blueprint.route("/unlove", methods=["POST"])
def lastfm_unlove() -> RouteResponse:
    return submit_track_action("track.unlove")
