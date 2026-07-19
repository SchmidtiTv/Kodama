"""Search YouTube Music and normalize the supported result categories."""

from flask import jsonify, request
from typing import Literal, cast

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._formatters import song_result
from ._services import music_session
from src.type_defs import RouteResponse


@blueprint.route("/search")
def search() -> RouteResponse:
    query = request.args.get("q", "")
    filter_type = request.args.get("filter", "songs")
    allowed_filters = {"albums", "artists", "community_playlists", "episodes", "featured_playlists", "playlists", "podcasts", "profiles", "songs", "videos"}
    if filter_type not in allowed_filters:
        filter_type = "songs"
    if not query:
        return jsonify({"results": []})
    try:
        results = music_session().get_active_client().search(query, filter=cast(Literal["albums", "artists", "community_playlists", "episodes", "featured_playlists", "playlists", "podcasts", "profiles", "songs", "videos"], filter_type), limit=20)
        items = []
        for result in results:
            thumbnail = YoutubeResponseMapper.select_thumbnail(result.get("thumbnails", []))
            if filter_type == "songs":
                items.append(song_result(result))
            elif filter_type == "artists":
                items.append(
                    {
                        "type": "artist",
                        "browseId": result.get("browseId", ""),
                        "title": result.get("artist", "") or result.get("title", ""),
                        "subtitle": result.get("subscribers", ""),
                        "thumbnail": thumbnail,
                    }
                )
            elif filter_type == "albums":
                artists = result.get("artists", [])
                items.append(
                    {
                        "type": "album",
                        "browseId": result.get("browseId", ""),
                        "title": result.get("title", ""),
                        "artists": ", ".join(artist["name"] for artist in artists),
                        "year": result.get("year", ""),
                        "thumbnail": thumbnail,
                    }
                )
        return jsonify({"results": items})
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@blueprint.route("/search/suggestions")
def search_suggestions() -> RouteResponse:
    """Return a compact, de-duplicated set of titles for sidebar autocomplete."""
    query = request.args.get("q", "").strip()
    if len(query) < 2:
        return jsonify({"suggestions": []})
    try:
        results = music_session().get_active_client().search(query, filter="songs", limit=6)
        suggestions: list[str] = []
        seen: set[str] = set()
        for result in results:
            title = result.get("title") if isinstance(result, dict) else None
            if not isinstance(title, str) or not title.strip() or title.casefold() in seen:
                continue
            seen.add(title.casefold())
            suggestions.append(title)
        return jsonify({"suggestions": suggestions})
    except Exception as error:
        return jsonify({"error": str(error)}), 500
