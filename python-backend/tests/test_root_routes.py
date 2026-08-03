from route_test_support import RouteTestCase


class RootMusicRouteTests(RouteTestCase):
    def test_root_music_routes(self) -> None:
        self.assertEqual(self.client.get("/status").json["ok"], True)
        self.assertEqual(self.client.get("/search").json, {"results": []})
        self.assertEqual(self.client.get("/search?q=song").json["results"][0]["type"], "song")
        self.assertEqual(self.client.get("/search?q=artist&filter=artists").json["results"][0]["type"], "artist")
        self.assertEqual(self.client.get("/search?q=album&filter=albums").json["results"][0]["type"], "album")
        all_results = self.client.get("/search?q=anything&filter=all").json["results"]
        self.assertEqual({result["type"] for result in all_results}, {"song", "artist", "album", "playlist"})
        self.assertEqual(next(result for result in all_results if result["type"] == "artist")["title"], "Artist")
        self.assertEqual(next(result for result in all_results if result["type"] == "artist")["browseId"], "UCartist")
        self.assertEqual(next(result for result in all_results if result["type"] == "playlist")["playlistId"], "PLtest")
        top_artist = next(result for result in all_results if result.get("browseId") == "UCtop")
        self.assertEqual(top_artist["title"], "Top Artist")
        shelf_song = next(result for result in all_results if result.get("videoId") == "shelf")
        self.assertEqual(shelf_song["artists"], "")
        self.assertEqual(shelf_song["artistLinks"], [])
        self.assertEqual(
            self.client.get("/search/suggestions?q=song").json,
            {"suggestions": ["Song", "Artist", "Album", "Playlist", "Shelf Song"]},
        )
        self.assertEqual(self.client.get("/search/suggestions?q=x").json, {"suggestions": []})
        self.assertEqual(self.client.get("/home").json["sections"][0]["items"][0]["videoId"], "vid")
        self.assertEqual(self.client.get("/artist_albums?channelId=UCartist&params=abc").json["albums"][0]["title"], "Album")
        self.assertEqual(self.client.get("/artist_albums").status_code, 400)

        liked = self.client.get("/liked")
        self.assertEqual(liked.status_code, 200)
        self.assertEqual(liked.json["tracks"][0]["videoId"], "vid")
        self.assertEqual(liked.json["total"], 1)
        self.assertFalse(liked.json["hasMore"])
        self.assertEqual(self.music_session.client.liked_songs_limits, [50])
        self.assertEqual(self.client.get("/liked?offset=50&limit=50").json["offset"], 50)
        self.assertEqual(self.music_session.client.liked_songs_limits, [50, 100])
        self.assertEqual(self.client.get("/liked/ids").json, {"ids": ["vid"]})
        self.assertEqual(self.music_session.client.liked_songs_limits, [50, 100, None])
        like = self.client.post("/like/vid", json={"rating": "LIKE"})
        self.assertEqual(like.json, {"ok": True, "rating": "LIKE"})
        self.assertEqual(self.music_session.client.ratings, [("vid", "LIKE")])

        self.profile_repository.local_profiles.add("default")
        local_like = self.client.post(
            "/like/local",
            json={"rating": "LIKE", "title": "Local", "artists": "Artist", "album": "Album", "thumbnail": "", "duration": "1:00"},
        )
        self.assertEqual(local_like.json, {"ok": True, "rating": "LIKE"})
        self.assertEqual(self.client.get("/liked/ids").json, {"ids": ["local"]})
        self.assertEqual(self.client.get("/liked").json["tracks"][0]["title"], "Local")
