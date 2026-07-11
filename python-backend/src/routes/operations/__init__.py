"""Operations and integrations: debug info, OBS overlay, LAN remote, and fonts."""

from flask import Blueprint


blueprint = Blueprint("operations", __name__)

from . import debug, overlay, remote, fonts  # noqa: E402,F401
