"""Resolve a public Unison display name."""

from flask import jsonify

from . import blueprint
from ._services import lyrics_service


@blueprint.route("/unison/displayname/<key_id>")
def unison_displayname(key_id):
    return jsonify({"displayName": lyrics_service().display_name(key_id)})
