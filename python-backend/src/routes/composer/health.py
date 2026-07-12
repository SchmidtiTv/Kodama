"""Composer Bridge health endpoint."""

from flask import jsonify

from . import blueprint
from ._responses import bridge_headers
from src.type_defs import RouteResponse


@blueprint.route("/composer-bridge/health")
def composer_bridge_health() -> RouteResponse:
    return bridge_headers(jsonify({"bridge": "kodama", "ytdlp": "ok", "status": "ok"}))
