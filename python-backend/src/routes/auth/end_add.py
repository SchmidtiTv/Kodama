"""Clear the account-creation marker."""

from flask import jsonify

from . import blueprint
from ._services import music_session
from src.type_defs import RouteResponse


@blueprint.route("/end-add", methods=["POST"])
def end_add() -> RouteResponse:
    music_session().state.adding_account = False
    return jsonify({"ok": True})
