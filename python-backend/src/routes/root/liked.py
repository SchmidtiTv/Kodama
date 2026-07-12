"""List liked songs for the active local or YouTube Music profile."""

from flask import jsonify, request

from . import blueprint
from ._formatters import is_signed_out_ytmusic_error, song_result
from ._services import music_session, profiles
from src.type_defs import RouteResponse


@blueprint.route("/liked")
def liked_songs() -> RouteResponse:
    session = music_session()
    profile_repository = profiles()
    profile_name = session.state.current_profile
    try:
        if profile_repository.is_local(profile_name):
            with profile_repository.local_database(profile_name or "default") as database:
                rows = database.execute(
                    "SELECT video_id, title, artists, album, thumbnail, duration "
                    "FROM liked_songs ORDER BY liked_at DESC"
                ).fetchall()
            tracks = [
                {
                    "videoId": row[0],
                    "title": row[1],
                    "artists": row[2],
                    "album": row[3],
                    "thumbnail": row[4],
                    "duration": row[5],
                }
                for row in rows
            ]
            return jsonify({"tracks": tracks})

        limit = request.args.get("limit", type=int)
        songs = session.get_active_client().get_liked_songs(limit=limit) if limit is not None else session.get_active_client().get_liked_songs()
        return jsonify({"tracks": [song_result(track) for track in songs.get("tracks", [])]})
    except Exception as error:
        if is_signed_out_ytmusic_error(error):
            return jsonify({"error": "YouTube session expired", "code": "auth_expired"}), 401
        return jsonify({"error": str(error)}), 500
