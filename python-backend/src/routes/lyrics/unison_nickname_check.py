"""Check an Unison nickname through the signed proxy."""

from . import blueprint
from ._unison import forward_signed_request
from src.type_defs import RouteResponse


@blueprint.route("/unison/auth/nickname/check", methods=["POST"])
def unison_nickname_check() -> RouteResponse:
    return forward_signed_request("POST", "/auth/nickname/check")
