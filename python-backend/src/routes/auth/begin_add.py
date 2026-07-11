"""Mark account creation as in progress."""

from flask import jsonify

from . import blueprint
from ._services import music_session


@blueprint.route("/begin-add", methods=["POST"])
def begin_add():
    music_session().state.adding_account = True
    return jsonify({"ok": True})
