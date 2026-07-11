"""Radio (watch-playlist) endpoint."""

from flask import jsonify

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._services import music_session


@blueprint.route("/radio/<playlist_id>")
def get_radio(playlist_id):
    try:
        watch = music_session().get_active_client().get_watch_playlist(playlistId=playlist_id, limit=50)
        tracks = []
        for t in watch.get("tracks", []):
            if not t.get("videoId"):
                continue
            artist_list = t.get("artists") or []
            artists = ", ".join(a["name"] for a in artist_list if isinstance(a, dict) and a.get("name"))
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
