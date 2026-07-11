"""Shared services for the operations and integrations routes."""

from flask import current_app


def overlay_server():
    return current_app.extensions["overlay_server"]


def remote_control():
    return current_app.extensions["remote_control"]


def music_session():
    return current_app.extensions["youtube_music_session"]


def server_start_time():
    return current_app.extensions["server_start_time"]
