"""Music-library, playlist, album, artist, radio, and song-detail endpoints."""

from flask import Blueprint


blueprint = Blueprint("library", __name__)

from . import library, playlist, radio, album, artist, history, song  # noqa: E402,F401
