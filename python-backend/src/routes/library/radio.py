"""Radio (watch-playlist) endpoint."""

from flask import jsonify, request

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._services import music_session
from src.type_defs import RouteResponse


@blueprint.route("/radio/<playlist_id>")
def get_radio(playlist_id: str) -> RouteResponse:
    try:
        # A song-seeded radio has no playlist ID yet. The frontend uses "_" as the
        # route placeholder and supplies the seed in the query string instead.
        video_id = request.args.get("videoId", "").strip()
        if playlist_id == "_":
            if not video_id:
                return jsonify({"error": "videoId required"}), 400
            watch = music_session().get_active_client().get_watch_playlist(
                videoId=video_id,
                limit=50,
                radio=True,
            )
        else:
            watch = music_session().get_active_client().get_watch_playlist(
                playlistId=playlist_id,
                limit=50,
            )
        raw_tracks = watch.get("tracks") if isinstance(watch, dict) else None
        tracks: list[dict[str, object]] = []
        for t in raw_tracks if isinstance(raw_tracks, list) else []:
            if not isinstance(t, dict):
                continue
            if not t.get("videoId"):
                continue
            artist_list = t.get("artists") or []
            artists = ", ".join(
                name for artist in artist_list if isinstance(artist, dict)
                if isinstance(name := artist.get("name"), str)
            ) if isinstance(artist_list, list) else ""
            # get_watch_playlist returns thumbnail as a list of dicts OR a plain string
            thumb_raw = t.get("thumbnails") or t.get("thumbnail") or []
            if isinstance(thumb_raw, list):
                thumb = YoutubeResponseMapper.select_thumbnail(thumb_raw)
            elif isinstance(thumb_raw, str):
                thumb = thumb_raw
            else:
                thumb = ""
            album = t.get("album") or {}
            tracks.append({
                "videoId":    t.get("videoId", ""),
                "title":      t.get("title", ""),
                "artists":    artists,
                "album":      album.get("name", "") if isinstance(album, dict) else "",
                "thumbnail":  thumb,
                "duration":   t.get("duration") or t.get("length", ""),
                "isExplicit": bool(t.get("isExplicit", False)),
            })
        return jsonify({"tracks": tracks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
