import unittest

from src.routes.library._formatters import has_video_thumbnail, video_evidence


class TrackFormatterTests(unittest.TestCase):
    def test_square_thumbnail_is_not_a_video(self) -> None:
        self.assertFalse(has_video_thumbnail({"thumbnails": [{"width": 720, "height": 720}]}))

    def test_wide_thumbnail_is_a_video_when_type_is_absent(self) -> None:
        self.assertTrue(has_video_thumbnail({"thumbnails": [{"width": 1280, "height": 720}]}))

    def test_video_title_is_reported_as_evidence(self) -> None:
        self.assertEqual(
            video_evidence({"title": "Eye Of The Tiger (Official HD Video)", "album": {"name": "Survivor"}}),
            ["title-marker"],
        )

    def test_missing_album_is_reported_as_video_evidence(self) -> None:
        self.assertEqual(video_evidence({"title": "Take On Me"}), ["missing-album"])
