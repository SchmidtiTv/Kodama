"""Delete a profile and its local files."""

from flask import jsonify, request

from . import blueprint
from ._services import music_session, profiles


@blueprint.route("/delete", methods=["POST"])
def delete_profile():
    name = (request.json or {}).get("name")
    if not name:
        return jsonify({"error": "Name fehlt"}), 400

    profile_repository = profiles()
    session = music_session()
    profile_repository.delete_files(name)
    if session.state.current_profile == name:
        session.state.current_profile = None
        session.state.ytm = None
        session.autoload_first_profile()
    return jsonify({"ok": True})
