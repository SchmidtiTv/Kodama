import unittest

from src.lib.music.audio_versions import iter_preferred_audio_versions, prefer_audio_versions


class FakeWatchPlaylistClient:
    def get_watch_playlist(self, videoId=None, playlistId=None, limit=25):
        return {
            "tracks": [
                {
                    "videoId": "audio-id",
                    "title": "Take On Me",
                    "artists": [{"name": "a-ha"}],
                    "album": {"name": "Hunting High and Low", "id": "album-id"},
                    "videoType": "MUSIC_VIDEO_TYPE_ATV",
                }
            ]
        }

    def search(self, query, filter="songs", limit=20):
        return []


class SearchFallbackClient(FakeWatchPlaylistClient):
    def get_watch_playlist(self, videoId=None, playlistId=None, limit=25):
        return {"tracks": []}

    def search(self, query, filter="songs", limit=20):
        return [
            {
                "videoId": "search-audio-id",
                "title": "Take On Me",
                "artists": [{"name": "a-ha"}],
                "album": {"name": "Hunting High and Low", "id": "album-id"},
                "duration_seconds": 225,
                "resultType": "song",
                "videoType": "MUSIC_VIDEO_TYPE_ATV",
            }
        ]


class AudioVersionTests(unittest.TestCase):
    def test_video_is_replaced_by_position_matched_audio_counterpart(self) -> None:
        video = {
            "videoId": "video-id",
            "title": "Take On Me (Official Video)",
            "artists": [{"name": "a-ha"}],
            "videoType": "MUSIC_VIDEO_TYPE_OMV",
        }

        resolved = prefer_audio_versions(FakeWatchPlaylistClient(), "playlist-id", [video])

        self.assertEqual(resolved[0]["videoId"], "audio-id")

    def test_mismatched_counterpart_is_not_used(self) -> None:
        video = {
            "videoId": "video-id",
            "title": "Different Song",
            "artists": [{"name": "a-ha"}],
            "videoType": "MUSIC_VIDEO_TYPE_OMV",
        }

        resolved = prefer_audio_versions(FakeWatchPlaylistClient(), "playlist-id", [video])

        self.assertEqual(resolved[0]["videoId"], "video-id")

    def test_search_fallback_replaces_an_unresolved_video(self) -> None:
        video = {
            "videoId": "video-id",
            "title": "Take On Me (Official Video)",
            "artists": [{"name": "a-ha"}],
            "duration_seconds": 223,
            "videoType": "MUSIC_VIDEO_TYPE_OMV",
        }

        resolved = prefer_audio_versions(SearchFallbackClient(), "playlist-id", [video])

        self.assertEqual(resolved[0]["videoId"], "search-audio-id")

    def test_search_fallback_rejects_a_different_duration(self) -> None:
        video = {
            "videoId": "video-id",
            "title": "Take On Me (Official Video)",
            "artists": [{"name": "a-ha"}],
            "duration_seconds": 180,
            "videoType": "MUSIC_VIDEO_TYPE_OMV",
        }

        resolved = prefer_audio_versions(SearchFallbackClient(), "playlist-id", [video])

        self.assertEqual(resolved[0]["videoId"], "video-id")

    def test_incremental_resolver_yields_batches_in_playlist_order(self) -> None:
        tracks = [
            {
                "videoId": f"video-{index}",
                "title": "Take On Me (Official Video)",
                "artists": [{"name": "a-ha"}],
                "duration_seconds": 223,
                "videoType": "MUSIC_VIDEO_TYPE_OMV",
            }
            for index in range(3)
        ]

        batches = list(iter_preferred_audio_versions(SearchFallbackClient(), "playlist-id", tracks, 2))

        self.assertEqual([len(batch) for batch in batches], [2, 1])
        self.assertEqual(
            [track["videoId"] for batch in batches for track in batch],
            ["search-audio-id", "search-audio-id", "search-audio-id"],
        )
