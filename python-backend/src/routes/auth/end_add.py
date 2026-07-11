"""Clear the account-creation marker."""

from flask import jsonify

from . import blueprint
from ._services import music_session


@blueprint.route("/end-add", methods=["POST"])
def end_add():
    music_session().state.adding_account = False
    return jsonify({"ok": True})
