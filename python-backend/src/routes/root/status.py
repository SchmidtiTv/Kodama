"""Return local backend health status."""

from flask import jsonify

from . import blueprint
from src.type_defs import RouteResponse


@blueprint.route("/status")
def status() -> RouteResponse:
    return jsonify({"ok": True, "message": "Kodama Backend laeuft"})
