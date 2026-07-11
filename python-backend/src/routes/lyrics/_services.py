"""Shared access to the lyrics service."""

from flask import current_app


def lyrics_service():
    return current_app.extensions["lyrics_service"]
