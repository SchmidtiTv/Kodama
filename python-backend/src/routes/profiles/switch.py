"""Switch the active profile."""

import threading

from flask import jsonify, request

from . import blueprint
from ._services import music_session
from src.type_defs import RouteResponse


@blueprint.route("/switch", methods=["POST"])
def switch_profile() -> RouteResponse:
    name = (request.json or {}).get("name")
    if not name:
        return jsonify({"error": "Name fehlt"}), 400

    session = music_session()
    if not session.activate_profile(name):
        return jsonify({"error": f"Profil '{name}' nicht gefunden"}), 404

    threading.Thread(target=session.refresh_account_info, args=(name,), daemon=True).start()
    return jsonify({"ok": True, "current": name})
