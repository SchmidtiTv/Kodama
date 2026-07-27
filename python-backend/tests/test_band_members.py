import unittest

from src.lib.music.band_members import BandMemberFinder


class FakeResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, object]:
        return self.payload


class BandMemberFinderTests(unittest.TestCase):
    def test_finds_members_combines_roles_and_loads_portraits(self) -> None:
        group_id = "group-id"
        member_id = "member-id"
        responses = {
            "https://musicbrainz.org/ws/2/artist/": {
                "artists": [{"id": group_id, "name": "The Group"}],
            },
            f"https://musicbrainz.org/ws/2/artist/{group_id}": {
                "relations": [
                    {
                        "type": "member of band",
                        "target-type": "artist",
                        "artist": {"id": member_id, "name": "A Member"},
                        "attributes": ["vocals"],
                        "begin": "2001",
                    },
                    {
                        "type": "member of band",
                        "target-type": "artist",
                        "artist": {"id": member_id, "name": "A Member"},
                        "attributes": ["guitar", "vocals"],
                        "begin": "2005",
                        "ended": True,
                        "end": "2008",
                    },
                ],
            },
            f"https://musicbrainz.org/ws/2/artist/{member_id}": {
                "relations": [{"type": "wikidata", "url": {"resource": "https://www.wikidata.org/wiki/Q123"}}],
            },
            "https://www.wikidata.org/wiki/Special:EntityData/Q123.json": {
                "entities": {
                    "Q123": {
                        "claims": {"P18": [{"mainsnak": {"datavalue": {"value": "Member.jpg"}}}]},
                        "sitelinks": {"enwiki": {"url": "https://en.wikipedia.org/wiki/A_Member"}},
                    }
                },
            },
            "https://commons.wikimedia.org/w/api.php": {
                "query": {"pages": {"1": {"imageinfo": [{"thumburl": "https://commons.example/member.jpg"}]}}},
            },
        }

        def get(url: str, **_kwargs: object) -> FakeResponse:
            return FakeResponse(responses[url])

        finder = BandMemberFinder(get=get, monotonic=lambda: 1, sleep=lambda _seconds: None)

        self.assertEqual(
            finder.find("The Group"),
            [
                {
                    "id": member_id,
                    "name": "A Member",
                    "roles": ["vocals"],
                    "membershipDates": ["2001 – present"],
                    "image": "https://commons.example/member.jpg",
                    "wikipediaUrl": "https://en.wikipedia.org/wiki/A_Member",
                }
            ],
        )

    def test_returns_no_members_when_no_group_matches(self) -> None:
        requests = []

        def get(url: str, **_kwargs: object) -> FakeResponse:
            requests.append(url)
            return FakeResponse({"artists": []})

        finder = BandMemberFinder(
            get=get,
            monotonic=lambda: 1,
            sleep=lambda _seconds: None,
        )

        self.assertEqual(finder.find("Solo Artist"), [])
        self.assertEqual(finder.find(" solo artist "), [])
        self.assertEqual(requests, ["https://musicbrainz.org/ws/2/artist/"])
