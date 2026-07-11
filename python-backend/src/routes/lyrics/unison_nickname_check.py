"""Check an Unison nickname through the signed proxy."""

from . import blueprint
from ._unison import forward_signed_request


@blueprint.route("/unison/auth/nickname/check", methods=["POST"])
def unison_nickname_check():
    return forward_signed_request("POST", "/auth/nickname/check")
