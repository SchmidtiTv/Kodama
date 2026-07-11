"""List available profiles."""

from flask import jsonify

from . import blueprint
from ._services import music_session, profiles


@blueprint.route("", methods=["GET"])
@blueprint.route("/", methods=["GET"])
def list_profiles():
    session = music_session()
    return jsonify(
        {
            "profiles": profiles().list_profiles(session.state.current_profile),
            "current": session.state.current_profile,
        }
    )
