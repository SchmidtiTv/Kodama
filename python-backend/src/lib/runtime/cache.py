"""Runtime cache settings that begin with configuration defaults."""

from collections.abc import Mapping
from pathlib import Path

from src.config import Config, ConfigDirs
from src.lib.runtime.metadata_cache import MetadataCache


class CacheSettings:
    """Owns the user-toggleable cache flags for one backend process."""

    CATEGORIES = ("playlists", "albums", "images", "songs", "lyrics")

    def __init__(
        self,
        defaults: Mapping[str, bool] | None = None,
        metadata_cache: MetadataCache | None = None,
    ) -> None:
        # Old server.py: _cache_enabled
        self.enabled: dict[str, bool] = dict(defaults or Config.CACHE_DEFAULTS)
        self.max_cache_mb = 0
        self._metadata_cache = metadata_cache
        if metadata_cache is not None:
            saved = metadata_cache.get("settings", "cache") or {}
            for category in self.CATEGORIES:
                if isinstance(saved.get(category), bool):
                    self.enabled[category] = bool(saved[category])
            saved_limit = saved.get("maxCacheMb")
            if isinstance(saved_limit, int) and saved_limit >= 0:
                self.max_cache_mb = saved_limit

    def update(self, values: Mapping[str, object]) -> None:
        """Apply only recognized cache flags and keep their values boolean."""
        for category in self.CATEGORIES:
            if isinstance(values.get(category), bool):
                self.enabled[category] = bool(values[category])
        limit = values.get("maxCacheMb")
        if isinstance(limit, int) and limit >= 0:
            self.max_cache_mb = limit
        if self._metadata_cache is not None:
            self._metadata_cache.put("settings", "cache", self.snapshot())

    def snapshot(self) -> dict[str, object]:
        return {**self.enabled, "maxCacheMb": self.max_cache_mb}

    @staticmethod
    def category_directories(config_dirs: ConfigDirs) -> dict[str, Path]:
        """Map cache categories to their configured filesystem directories."""
        return {
            "playlists": config_dirs.PLAYLIST_CACHE_DIR,
            "albums": config_dirs.ALBUM_CACHE_DIR,
            "images": config_dirs.IMG_CACHE_DIR,
            "songs": config_dirs.SONG_CACHE_DIR,
            "lyrics": config_dirs.LYRICS_CACHE_DIR,
        }
