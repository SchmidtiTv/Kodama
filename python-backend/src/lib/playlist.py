"""In-memory playlist cache helper."""

import collections

from src.config import config_ytmusic


class Playlist:
    def __init__(self):
        self.playlist_cache = collections.OrderedDict()

    def put(self, playlist_id: str, data) -> None:
        """Insert/update a playlist and evict the least-recently-used entry."""
        self.playlist_cache[playlist_id] = data
        self.playlist_cache.move_to_end(playlist_id)
        while len(self.playlist_cache) > config_ytmusic.PLAYLIST_CACHE_MAX:
            self.playlist_cache.popitem(last=False)

    # Keep the initial extracted method name available while callers are migrated.
    _playlist_cache_put = put
