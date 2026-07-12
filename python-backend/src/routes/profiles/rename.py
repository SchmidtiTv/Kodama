"""Update a profile display name."""

from flask import jsonify, request

from . import blueprint
from ._services import profiles
from src.type_defs import RouteResponse


@blueprint.route("/rename", methods=["POST"])
def rename_profile() -> RouteResponse:
    data = request.json or {}
    name = data.get("name")
    display_name = data.get("displayName")
    if not name or not display_name:
        return jsonify({"error": "Fehlende Parameter"}), 400

    profiles().update_metadata(name, displayName=display_name)
    return jsonify({"ok": True})
