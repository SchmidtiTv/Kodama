from unittest.mock import patch

from route_test_support import RouteTestCase


class DownloadRouteTests(RouteTestCase):
    def test_download_routes_start_report_and_queue_downloads(self) -> None:
        started = self.client.post(
            "/song/download/vid",
            json={"title": "Song", "artists": "Artist", "album": "Album", "duration": "3:00", "thumbnail": "thumb"},
        )
        self.assertEqual(started.json, {"ok": True, "status": "downloading"})
        self.assertEqual(self.download_service.started[0][0], "vid")
        self.assertEqual(self.download_service.started[0][1]["title"], "Song")

        again = self.client.post("/song/download/vid", json={"title": "Song"})
        self.assertEqual(again.json, {"ok": True, "status": "downloading"})
        self.assertEqual(len(self.download_service.started), 1)

        self.assertEqual(self.client.get("/song/download/status/vid").json, {"status": "downloading"})
        queue = self.client.get("/downloads/queue")
        self.assertEqual(queue.json["queue"][0]["videoId"], "vid")

    def test_download_route_returns_done_for_already_cached_song(self) -> None:
        self.download_service.add_cached("cached")
        response = self.client.post("/song/download/cached", json={"title": "Cached"})
        self.assertEqual(response.json, {"ok": True, "status": "done"})
        self.assertEqual(self.download_service.status["cached"], "done")
        self.assertEqual(self.client.get("/song/download/status/cached").json, {"status": "done"})


class CachedSongRouteTests(RouteTestCase):
    def test_cached_song_routes_serve_list_and_delete(self) -> None:
        cached_path = self.download_service.add_cached("cached", suffix=".mp3", content=b"mp3 data")

        served = self.client.get("/song/cached/cached")
        self.assertEqual(served.status_code, 200)
        self.assertEqual(served.content_type, "audio/mpeg")
        self.assertEqual(served.data, b"mp3 data")
        served.close()
        self.assertTrue(cached_path.exists())

        self.assertEqual(self.client.get("/song/cached/missing").status_code, 404)
        self.assertEqual(self.client.get("/song/cached/list").json, {"songs": [{"videoId": "cached", "title": "Cached Song"}]})

        self.assertEqual(self.client.delete("/song/cached/cached").json, {"ok": True})
        self.assertEqual(self.download_service.deleted, ["cached"])

        batch = self.client.post("/songs/cached/delete-batch", json={"videoIds": ["a", "b"]})
        self.assertEqual(batch.json, {"ok": True, "removed": 2})
        self.assertEqual(self.download_service.deleted[-2:], ["a", "b"])


class ExportRouteTests(RouteTestCase):
    def test_export_routes_validate_start_and_report_status(self) -> None:
        self.assertEqual(self.client.post("/song/export/vid", json={}).status_code, 400)

        with patch("builtins.print"):
            response = self.client.post(
                "/song/export/vid",
                json={
                    "output_path": "/tmp/song.opus",
                    "format": "opus",
                    "title": "Song",
                    "artists": "Artist",
                    "album": "Album",
                    "albumBrowseId": "alb",
                    "thumbnail": "thumb",
                },
            )
        self.assertEqual(response.json, {"ok": True, "status": "exporting"})
        self.assertEqual(self.export_service.started[0][0:3], ("vid", "/tmp/song.opus", "opus"))
        self.assertEqual(self.export_service.started[0][3]["year"], "2026")

        repeat = self.client.post("/song/export/vid", json={"output_path": "/tmp/song.opus"})
        self.assertEqual(repeat.json, {"ok": True, "status": "exporting"})
        self.assertEqual(len(self.export_service.started), 1)

        self.assertEqual(self.client.get("/song/export/status/vid").json, {"status": "exporting"})
        self.assertEqual(self.client.get("/song/export/status/missing").json, {"status": "not_found"})
        self.assertEqual(self.client.get("/song/export/ffmpeg-available").json, {"available": True})

    def test_export_uses_song_upload_year_when_album_year_is_missing(self) -> None:
        with patch.object(self.music_session.client, "get_album", return_value={}), patch("builtins.print"):
            response = self.client.post(
                "/song/export/song-year",
                json={"output_path": "/tmp/song.mp3", "format": "mp3", "albumBrowseId": "missing-year"},
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.export_service.started[0][3]["year"], "2024")


class ToolUpdateRouteTests(RouteTestCase):
    def test_ffmpeg_routes(self) -> None:
        self.assertEqual(self.client.get("/ffmpeg/status").json, {"available": True})
        self.assertEqual(self.client.get("/ffmpeg/check-update").json, self.ffmpeg.update_payload)

        stream = self.client.get("/ffmpeg/download?force=1")
        self.assertEqual(stream.status_code, 200)
        self.assertIn(b'"status": "done"', stream.data)
        self.assertEqual(self.ffmpeg.download_forces, [True])

    def test_ytdlp_routes(self) -> None:
        self.assertEqual(self.client.get("/ytdlp/check-update").json, self.ytdlp.check_payload)
        self.assertEqual(self.client.post("/ytdlp/update").json, self.ytdlp.update_payload)

        self.ytdlp.update_payload = {"ok": False, "error": "boom"}
        self.ytdlp.update_status = 502
        failed = self.client.post("/ytdlp/update")
        self.assertEqual(failed.status_code, 502)
        self.assertEqual(failed.json, {"ok": False, "error": "boom"})
