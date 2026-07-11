"""Return local backend health status."""

from flask import jsonify

from . import blueprint


@blueprint.route("/status")
def status():
    return jsonify({"ok": True, "message": "Kodama Backend laeuft"})
