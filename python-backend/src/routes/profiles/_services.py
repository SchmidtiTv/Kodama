"""Shared access to services registered on the Flask application."""

from flask import current_app


def profiles():
    return current_app.extensions["profile_repository"]


def music_session():
    return current_app.extensions["youtube_music_session"]
