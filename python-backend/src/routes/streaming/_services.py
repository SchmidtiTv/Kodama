"""Shared access to the audio stream service."""

from typing import cast
from flask import current_app
from src.lib.music.stream import StreamService


def stream_service() -> StreamService:
    return cast(StreamService, current_app.extensions["stream_service"])
