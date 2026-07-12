"""Shared access to services registered on the Flask application."""

from typing import cast
from flask import current_app
from src.lib.profiles.profile import Profile
from src.lib.music.youtube_music import YoutubeMusicSession


def profiles() -> Profile:
    return cast(Profile, current_app.extensions["profile_repository"])


def music_session() -> YoutubeMusicSession:
    return cast(YoutubeMusicSession, current_app.extensions["youtube_music_session"])
