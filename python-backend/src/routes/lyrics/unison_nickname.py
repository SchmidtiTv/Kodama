"""Forward signed Unison nickname changes."""

from flask import request

from . import blueprint
from ._unison import forward_signed_request
from src.type_defs import RouteResponse


@blueprint.route("/unison/auth/nickname", methods=["PUT", "DELETE"])
def unison_nickname() -> RouteResponse:
    return forward_signed_request(request.method, "/auth/nickname")
