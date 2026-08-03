import tempfile
import unittest
from pathlib import Path

from src.lib.runtime.cache import CacheSettings
from src.lib.runtime.metadata_cache import MetadataCache


class MetadataCacheTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.cache = MetadataCache(Path(self.temporary_directory.name) / "cache.sqlite3")

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_stores_and_reports_structured_entries_by_category(self) -> None:
        self.cache.put("albums", "album-1", {"title": "Album", "tracks": []})

        self.assertEqual(self.cache.get("albums", "album-1"), {"title": "Album", "tracks": []})
        size, count = self.cache.stats("albums")
        self.assertGreater(size, 0)
        self.assertEqual(count, 1)
        self.assertEqual(self.cache.stats("lyrics"), (0, 0))

        self.cache.clear("albums")
        self.assertIsNone(self.cache.get("albums", "album-1"))

    def test_expired_entries_are_removed_on_read(self) -> None:
        self.cache.put("playlists", "profile:list", {"tracks": []})

        self.assertIsNone(self.cache.get("playlists", "profile:list", ttl=-1))
        self.assertEqual(self.cache.stats("playlists"), (0, 0))

    def test_cache_settings_survive_backend_restart(self) -> None:
        settings = CacheSettings(metadata_cache=self.cache)
        settings.update({"images": False, "maxCacheMb": 500})

        restored = CacheSettings(metadata_cache=MetadataCache(self.cache.path))

        self.assertFalse(restored.enabled["images"])
        self.assertEqual(restored.max_cache_mb, 500)

    def test_audio_counterparts_use_their_own_table(self) -> None:
        audio = {
            "videoId": "audio-id",
            "title": "Take On Me",
            "videoType": "MUSIC_VIDEO_TYPE_ATV",
        }

        self.cache.put_audio_counterpart("video-id", audio)

        self.assertEqual(self.cache.get_audio_counterpart("video-id"), audio)
        self.assertEqual(self.cache.stats("audio_counterparts"), (0, 0))
        size, count = self.cache.audio_counterpart_stats()
        self.assertGreater(size, 0)
        self.assertEqual(count, 1)

        self.cache.clear_audio_counterparts()
        self.assertIsNone(self.cache.get_audio_counterpart("video-id"))


if __name__ == "__main__":
    unittest.main()
