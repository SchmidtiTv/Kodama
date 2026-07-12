"""Album detail endpoint with a disk cache."""

from flask import jsonify, request

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._services import album_cache, cache_settings, music_session
from src.type_defs import RouteResponse


@blueprint.route("/album/<browse_id>")
def get_album(browse_id: str) -> RouteResponse:
    try:
        cache = album_cache()
        cache_flags = cache_settings().enabled
        force_refresh = request.args.get("refresh", "0") == "1"
        if not force_refresh and cache_flags["albums"]:
            cached = cache.load_album_disk(browse_id)
            if cached:
                return jsonify(cached)

        album = music_session().get_active_client().get_album(browse_id)
        tracks = []
        album_artists = album.get("artists", [])
        album_artist_name = ", ".join(a["name"] for a in album_artists)
        album_artist_browse_id = album_artists[0].get("id", "") if album_artists else ""
        for t in album.get("tracks", []):
            if not t.get("videoId"):
                continue
            track_artists = t.get("artists", [])
            artists = ", ".join(a["name"] for a in track_artists) or album_artist_name
            artist_browse_id = track_artists[0].get("id", "") if track_artists else album_artist_browse_id
            thumbnail = YoutubeResponseMapper.select_thumbnail(album.get("thumbnails", []))
            tracks.append({
                "videoId": t.get("videoId", ""),
                "title": t.get("title", ""),
                "artists": artists,
                "artistBrowseId": artist_browse_id,
                "artistLinks": YoutubeResponseMapper.build_artist_links(track_artists or album_artists),
                "album": album.get("title", ""),
                "duration": t.get("duration", ""),
                "thumbnail": thumbnail,
                "isExplicit": bool(t.get("isExplicit", False)),
            })
        result = {
            "title": album.get("title", ""),
            "artists": album_artist_name,
            "artistBrowseId": album_artist_browse_id,
            "year": album.get("year", ""),
            "thumbnail": YoutubeResponseMapper.select_thumbnail(album.get("thumbnails", [])),
            "tracks": tracks,
        }
        if cache_flags["albums"]:
            cache.save_album_disk(browse_id, result)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
