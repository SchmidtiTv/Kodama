"""Mark account creation as in progress."""

from flask import jsonify

from . import blueprint
from ._services import music_session
from src.type_defs import RouteResponse


@blueprint.route("/begin-add", methods=["POST"])
def begin_add() -> RouteResponse:
    music_session().state.adding_account = True
    return jsonify({"ok": True})
