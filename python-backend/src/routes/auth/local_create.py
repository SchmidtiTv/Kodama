"""Create and activate a local profile without a Google account."""

import re
import os

from flask import jsonify, request

from . import blueprint
from ._services import music_session, profiles
from src.type_defs import RouteResponse


@blueprint.route("/local-create", methods=["POST"])
def local_create() -> RouteResponse:
    display_name = ((request.json or {}).get("displayName") or "").strip()
    if not display_name:
        return jsonify({"error": "Name fehlt"}), 400

    profile_repository = profiles()
    base_name = re.sub(r"[^\w\-]", "_", display_name.lower())[:40] or "local"
    name = base_name
    counter = 1
    while os.path.exists(profile_repository.metadata_file_path(name)):
        name = f"{base_name}_{counter}"
        counter += 1

    profile_repository.write_metadata(name, {"displayName": display_name, "type": "local"})
    with profile_repository.local_database(name):
        pass
    music_session().activate_profile(name)
    return jsonify({"ok": True, "profile": name, "displayName": display_name})
