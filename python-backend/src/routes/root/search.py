"""Search YouTube Music and normalize the supported result categories."""

from flask import jsonify, request

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._formatters import song_result
from ._services import music_session


@blueprint.route("/search")
def search():
    query = request.args.get("q", "")
    filter_type = request.args.get("filter", "songs")
    if not query:
        return jsonify({"results": []})
    try:
        results = music_session().get_active_client().search(query, filter=filter_type, limit=20)
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
