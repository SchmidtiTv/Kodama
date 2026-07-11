"""Shared access to profile authentication services."""

from flask import current_app


def profiles():
    return current_app.extensions["profile_repository"]


def music_session():
    return current_app.extensions["youtube_music_session"]
