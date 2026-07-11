from route_test_support import RouteTestCase


class DiscoveryRouteTests(RouteTestCase):
    def test_podcast_route_normalizes_metadata_and_playable_episodes(self):
        response = self.client.get("/podcast/podcast-pl")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["title"], "Podcast")
        self.assertEqual(response.json["author"], {"name": "Host", "id": "UChost"})
        self.assertEqual(response.json["episodes"][0]["videoId"], "episode")
        self.assertEqual(len(response.json["episodes"]), 1)

    def test_mood_categories_deduplicate_params_by_section(self):
        response = self.client.get("/mood/categories")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["For you"], [{"title": "Energize", "params": "energy"}])
        self.assertEqual(response.json["Genres"], [{"title": "Jazz", "params": "jazz"}])

    def test_mood_playlists_requires_params_and_parses_browse_response(self):
        self.assertEqual(self.client.get("/mood/playlists").status_code, 400)

        response = self.client.get("/mood/playlists?params=energy")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json[0]["type"], "playlist")
        self.assertEqual(response.json[0]["playlistId"], "mood-pl")
        self.assertEqual(response.json[1]["type"], "song")
        self.assertEqual(response.json[1]["videoId"], "mood-song")
        self.assertEqual(len(response.json), 2)
