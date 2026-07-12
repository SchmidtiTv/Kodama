"""Shared services for music-library and detail-page routes."""

from typing import cast

from flask import current_app

from src.lib.music.album import Album
from src.lib.music.credits import SongCreditsCache
from src.lib.music.playlist import Playlist
from src.lib.music.youtube_music import YoutubeMusicSession
from src.lib.profiles.profile import Profile
from src.lib.runtime.cache import CacheSettings


def music_session() -> YoutubeMusicSession:
    return cast(YoutubeMusicSession, current_app.extensions["youtube_music_session"])


def profiles() -> Profile:
    return cast(Profile, current_app.extensions["profile_repository"])


def cache_settings() -> CacheSettings:
    return cast(CacheSettings, current_app.extensions["cache_settings"])


def playlist_cache() -> Playlist:
    return cast(Playlist, current_app.extensions["playlist_cache"])


def album_cache() -> Album:
    return cast(Album, current_app.extensions["album_cache"])


def song_credits_cache() -> SongCreditsCache:
    return cast(SongCreditsCache, current_app.extensions["song_credits_cache"])
