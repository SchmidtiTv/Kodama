"""Library listings for playlists, albums, and artists."""

from flask import jsonify

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._services import music_session, profiles
from src.type_defs import RouteResponse


@blueprint.route("/library/playlists")
def library_playlists() -> RouteResponse:
    session = music_session()
    profile_repo = profiles()
    profile_name = session.state.current_profile
    try:
        if profile_repo.is_local(profile_name):
            with profile_repo.local_database(profile_name or "default") as db:
                rows = db.execute(
                    "SELECT playlist_id, title, description, (SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id=p.playlist_id) FROM playlists p ORDER BY updated_at DESC"
                ).fetchall()
            result = [{"playlistId": r[0], "title": r[1], "description": r[2], "count": str(r[3]), "thumbnail": ""} for r in rows]
            return jsonify({"playlists": result})
        playlists = session.get_active_client().get_library_playlists(limit=50)
        result = []
        for p in playlists:
            result.append({
                "playlistId": p.get("playlistId", ""),
                "title": p.get("title", ""),
                "count": p.get("count", ""),
                "thumbnail": YoutubeResponseMapper.select_thumbnail(p.get("thumbnails", [])),
            })
        return jsonify({"playlists": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blueprint.route("/library/albums")
def library_albums() -> RouteResponse:
    session = music_session()
    profile_repo = profiles()
    profile_name = session.state.current_profile
    try:
        if profile_repo.is_local(profile_name):
            return jsonify({"albums": []})
        albums = session.get_active_client().get_library_albums(limit=50)
        result = []
        for a in albums:
            artists = ", ".join(x["name"] for x in a.get("artists", []))
            result.append({
                "browseId": a.get("browseId", ""),
                "title": a.get("title", ""),
                "artists": artists,
                "year": a.get("year", ""),
                "thumbnail": YoutubeResponseMapper.select_thumbnail(a.get("thumbnails", [])),
            })
        return jsonify({"albums": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blueprint.route("/library/artists")
def library_artists() -> RouteResponse:
    session = music_session()
    profile_repo = profiles()
    profile_name = session.state.current_profile
    try:
        if profile_repo.is_local(profile_name):
            return jsonify({"artists": []})
        artists = session.get_active_client().get_library_artists(limit=50)
        result = []
        for a in artists:
            result.append({
                "browseId": a.get("browseId", ""),
                "artist": a.get("artist", ""),
                "songs": a.get("songs", ""),
                "thumbnail": YoutubeResponseMapper.select_thumbnail(a.get("thumbnails", [])),
            })
        return jsonify({"artists": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
