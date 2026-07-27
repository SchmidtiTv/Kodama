"""Resolve a music group's members and public portraits."""

from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from dataclasses import dataclass, field
from threading import Lock
import time
from typing import Any

import requests

from src.config import Config


MUSICBRAINZ_URL = "https://musicbrainz.org/ws/2"
WIKIDATA_URL = "https://www.wikidata.org/wiki/Special:EntityData"
WIKIMEDIA_COMMONS_URL = "https://commons.wikimedia.org/w/api.php"
REQUEST_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Kodama/1.0 (+https://github.com/KiyoshiTheDevil/Kodama)",
}


class BandMemberLookupError(Exception):
    """Raised when a required third-party lookup cannot be completed."""


@dataclass
class BandMember:
    """A MusicBrainz person related to a group."""

    id: str
    name: str
    roles: list[str] = field(default_factory=list)
    membership_dates: list[str] = field(default_factory=list)
    image: str | None = None
    wikipedia_url: str | None = None

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "name": self.name,
            "roles": self.roles,
            "membershipDates": self.membership_dates,
            "image": self.image,
            "wikipediaUrl": self.wikipedia_url,
        }


class BandMemberFinder:
    """MusicBrainz/Wikimedia boundary for group-member information."""

    def __init__(
        self,
        get: Callable[..., requests.Response] = requests.get,
        monotonic: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
        cache_ttl: float = Config.BAND_MEMBER_CACHE_TTL,
    ) -> None:
        self._get = get
        self._monotonic = monotonic
        self._sleep = sleep
        self._cache_ttl = cache_ttl
        self._member_cache: dict[str, tuple[float, list[dict[str, object]]]] = {}
        self._cache_lock = Lock()
        self._musicbrainz_lock = Lock()
        self._last_musicbrainz_request = 0.0

    def find(self, artist_name: str) -> list[dict[str, object]]:
        cache_key = artist_name.strip().casefold()
        cached_members = self._cached_members(cache_key)
        if cached_members is not None:
            return cached_members

        group = self._find_group(artist_name)
        if not group:
            return self._cache_members(cache_key, [])

        group_id = group.get("id")
        if not isinstance(group_id, str):
            return self._cache_members(cache_key, [])
        group_data = self._get_json(f"{MUSICBRAINZ_URL}/artist/{group_id}", {"inc": "artist-rels", "fmt": "json"})
        members = self._combine_relations(group_data.get("relations", []))
        for member in members:
            member.image, member.wikipedia_url = self._find_member_details(member.id)
        return self._cache_members(cache_key, [member.as_dict() for member in members])

    def _cached_members(self, cache_key: str) -> list[dict[str, object]] | None:
        with self._cache_lock:
            entry = self._member_cache.get(cache_key)
            if not entry:
                return None
            saved_at, members = entry
            if self._monotonic() - saved_at >= self._cache_ttl:
                del self._member_cache[cache_key]
                return None
            return deepcopy(members)

    def _cache_members(self, cache_key: str, members: list[dict[str, object]]) -> list[dict[str, object]]:
        with self._cache_lock:
            self._member_cache[cache_key] = (self._monotonic(), deepcopy(members))
        return members

    def _find_group(self, artist_name: str) -> dict[str, object] | None:
        search = self._get_json(
            f"{MUSICBRAINZ_URL}/artist/",
            {"query": f"artist:{artist_name} AND type:group", "fmt": "json", "limit": 5},
        )
        artists = search.get("artists", [])
        return artists[0] if artists and isinstance(artists[0], dict) else None

    def _combine_relations(self, relations: object) -> list[BandMember]:
        members: dict[str, BandMember] = {}
        if not isinstance(relations, list):
            return []
        for relation in relations:
            if not isinstance(relation, dict) or relation.get("type") != "member of band":
                continue
            if relation.get("ended"):
                continue
            artist = relation.get("artist")
            if relation.get("target-type") != "artist" or not isinstance(artist, dict):
                continue
            member_id = artist.get("id")
            name = artist.get("name")
            if not isinstance(member_id, str) or not isinstance(name, str):
                continue
            member = members.setdefault(member_id, BandMember(id=member_id, name=name))
            for role in relation.get("attributes", []):
                if isinstance(role, str) and role not in member.roles:
                    member.roles.append(role)
            date_range = self._date_range(relation)
            if date_range not in member.membership_dates:
                member.membership_dates.append(date_range)
        return list(members.values())

    @staticmethod
    def _date_range(relation: dict[str, object]) -> str:
        start = relation.get("begin") if isinstance(relation.get("begin"), str) else "Unknown start"
        return f"{start} – present"

    def _find_member_details(self, member_id: str) -> tuple[str | None, str | None]:
        try:
            artist = self._get_json(
                f"{MUSICBRAINZ_URL}/artist/{member_id}", {"inc": "url-rels", "fmt": "json"}
            )
            wikidata_id = self._wikidata_id(artist.get("relations", []))
            if not wikidata_id:
                return None, None
            entity = self._get_json(f"{WIKIDATA_URL}/{wikidata_id}.json")
            entities = entity.get("entities")
            entity_data = entities.get(wikidata_id) if isinstance(entities, dict) else None
            claims = entity_data.get("claims") if isinstance(entity_data, dict) else None
            wikipedia_url = self._wikipedia_url(entity_data)
            image_name = self._image_name(claims)
            if not image_name:
                return None, wikipedia_url
            image = self._find_commons_image(image_name)
            return image, wikipedia_url
        except (AttributeError, BandMemberLookupError, IndexError, StopIteration, TypeError):
            # A missing Wikidata link or portrait should not hide a member.
            return None, None

    def _find_commons_image(self, image_name: str) -> str | None:
        try:
            commons = self._get_json(
                WIKIMEDIA_COMMONS_URL,
                {
                    "action": "query",
                    "format": "json",
                    "prop": "imageinfo",
                    "iiprop": "url",
                    "iiurlwidth": "600",
                    "titles": f"File:{image_name}",
                },
            )
            query = commons.get("query")
            pages = query.get("pages") if isinstance(query, dict) else None
            page = next(iter(pages.values()), {}) if isinstance(pages, dict) else {}
            image_info = page.get("imageinfo", [{}])[0] if isinstance(page, dict) else {}
            return image_info.get("thumburl") or image_info.get("url")
        except (AttributeError, BandMemberLookupError, IndexError, StopIteration, TypeError):
            return None

    @staticmethod
    def _wikidata_id(relations: object) -> str | None:
        if not isinstance(relations, list):
            return None
        for relation in relations:
            if not isinstance(relation, dict) or relation.get("type") != "wikidata":
                continue
            url = relation.get("url")
            resource = url.get("resource") if isinstance(url, dict) else None
            if isinstance(resource, str):
                identifier = resource.rsplit("/", 1)[-1]
                if identifier.startswith("Q") and identifier[1:].isdigit():
                    return identifier
        return None

    @staticmethod
    def _image_name(claims: object) -> str | None:
        if not isinstance(claims, dict):
            return None
        images = claims.get("P18", [])
        if not isinstance(images, list) or not images:
            return None
        image = images[0]
        if not isinstance(image, dict):
            return None
        mainsnak = image.get("mainsnak")
        datavalue = mainsnak.get("datavalue") if isinstance(mainsnak, dict) else None
        value = datavalue.get("value") if isinstance(datavalue, dict) else None
        return value if isinstance(value, str) else None

    @staticmethod
    def _wikipedia_url(entity: object) -> str | None:
        if not isinstance(entity, dict):
            return None
        sitelinks = entity.get("sitelinks")
        if not isinstance(sitelinks, dict):
            return None
        english = sitelinks.get("enwiki")
        if isinstance(english, dict) and isinstance(english.get("url"), str):
            return english["url"]
        for key, sitelink in sitelinks.items():
            if key.endswith("wiki") and isinstance(sitelink, dict) and isinstance(sitelink.get("url"), str):
                return sitelink["url"]
        return None

    def _get_json(self, url: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        try:
            if url.startswith(MUSICBRAINZ_URL):
                self._wait_for_musicbrainz()
            response = self._get(url, params=params, headers=REQUEST_HEADERS, timeout=10)
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError, AttributeError) as error:
            raise BandMemberLookupError from error
        if not isinstance(payload, dict):
            raise BandMemberLookupError
        return payload

    def _wait_for_musicbrainz(self) -> None:
        with self._musicbrainz_lock:
            wait_seconds = 1 - (self._monotonic() - self._last_musicbrainz_request)
            if wait_seconds > 0:
                self._sleep(wait_seconds)
            self._last_musicbrainz_request = self._monotonic()
