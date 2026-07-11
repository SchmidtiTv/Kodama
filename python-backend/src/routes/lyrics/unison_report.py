"""Forward a signed Unison lyric report."""

from . import blueprint
from ._unison import forward_signed_request


@blueprint.route("/unison/lyrics/<lyrics_id>/report", methods=["POST"])
def unison_report(lyrics_id):
    return forward_signed_request("POST", f"/lyrics/{lyrics_id}/report")
