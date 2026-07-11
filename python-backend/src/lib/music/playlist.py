"""In-memory and on-disk playlist cache.

The in-memory layer is an LRU keyed by playlist id; the on-disk layer is a JSON
file per (profile, playlist) pair so different profiles never collide.
"""

import collections
import json
import os
import time

from src.config import Config, config_dirs, config_ytmusic


class Playlist:
    # Old server.py: _playlist_cache
    def __init__(self):
        self.playlist_cache = collections.OrderedDict()

    # Old server.py: _playlist_disk_path
    def playlist_disk_path(self, playlist_id, profile):
        prefix = profile or "default"
        safe = playlist_id.replace("/", "_").replace("\\", "_")
        return os.path.join(config_dirs.PLAYLIST_CACHE_DIR, f"{prefix}_{safe}.json")

    # Old server.py: _load_playlist_disk
    def load_playlist_disk(self, playlist_id, profile, ttl=Config.PLAYLIST_CACHE_TTL):
        path = self.playlist_disk_path(playlist_id, profile)
        if not os.path.exists(path):
            return None
        if time.time() - os.path.getmtime(path) > ttl:
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Invalidate old caches that don't have isExplicit yet
            tracks = data.get("tracks", [])
            if tracks and "isExplicit" not in tracks[0]:
                return None
            return data
        except Exception:
            return None

    # Old server.py: _save_playlist_disk
    def save_playlist_disk(self, playlist_id, profile, data):
        path = self.playlist_disk_path(playlist_id, profile)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception:
            pass

    # Old server.py: _purge_playlist_cache
    def purge_playlist_cache(self, playlist_id, profile):
        self.playlist_cache.pop(playlist_id, None)
        path = self.playlist_disk_path(playlist_id, profile)
        if os.path.exists(path):
            os.remove(path)

    # Old server.py: _playlist_cache_put
    def put(self, playlist_id, data):
        """Insert/update a playlist and evict the least-recently-used entry."""
        self.playlist_cache[playlist_id] = data
        self.playlist_cache.move_to_end(playlist_id)
        while len(self.playlist_cache) > config_ytmusic.PLAYLIST_CACHE_MAX:
            self.playlist_cache.popitem(last=False)
