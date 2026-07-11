"""On-disk album cache. Albums are global, so files are keyed by browse id only."""

import json
import os
import time

from src.config import Config, config_dirs


class Album:
    # Old server.py: _album_disk_path
    def album_disk_path(self, browse_id):
        safe = browse_id.replace("/", "_").replace("\\", "_")
        return os.path.join(config_dirs.ALBUM_CACHE_DIR, f"{safe}.json")

    # Old server.py: _load_album_disk
    def load_album_disk(self, browse_id):
        path = self.album_disk_path(browse_id)
        if not os.path.exists(path):
            return None
        if time.time() - os.path.getmtime(path) > Config.ALBUM_CACHE_TTL:
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

    # Old server.py: _save_album_disk
    def save_album_disk(self, browse_id, data):
        path = self.album_disk_path(browse_id)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception:
            pass
