"""Artist detail page and subscribe/unsubscribe endpoints."""

from flask import jsonify, request

from src.lib import YoutubeResponseMapper

from . import blueprint
from ._services import music_session


# Old server.py: _extract_artist_desc_url
def _extract_artist_desc_url(browse_id):
    """ytmusicapi keeps only the first description run, dropping the trailing
    "From Wikipedia (URL)" link run. Re-fetch and pull the real source URL out."""
    try:
        from ytmusicapi.navigation import find_object_by_key, nav, SINGLE_COLUMN_TAB, SECTION_LIST
        resp = music_session().get_active_client()._send_request("browse", {"browseId": browse_id})
        results = nav(resp, SINGLE_COLUMN_TAB + SECTION_LIST)
        shelf = find_object_by_key(results, "musicDescriptionShelfRenderer", is_key=True)
        if not shelf:
            return None
        if isinstance(shelf, dict) and "musicDescriptionShelfRenderer" in shelf:
            shelf = shelf["musicDescriptionShelfRenderer"]
        for r in shelf.get("description", {}).get("runs", []):
            url = ((r.get("navigationEndpoint") or {}).get("urlEndpoint") or {}).get("url")
            if url and "creativecommons" not in url:
                return url
    except Exception:
        pass
    return None


@blueprint.route("/artist/<browse_id>")
def get_artist(browse_id):
    try:
        artist = music_session().get_active_client().get_artist(browse_id)

        # Top songs
        tracks = []
        for t in (artist.get("songs", {}).get("results", []))[:20]:
            if not t.get("videoId"):
                continue
            thumbnail = YoutubeResponseMapper.select_thumbnail(t.get("thumbnails", []))
            # duration may be a pre-formatted string ("3:45") or absent;
            # fall back to duration_seconds if available
            duration = t.get("duration", "")
            if not duration:
                secs = t.get("duration_seconds") or t.get("durationSeconds") or 0
                if secs:
                    m, s = divmod(int(secs), 60)
                    duration = f"{m}:{s:02d}"
            tracks.append({
                "videoId": t.get("videoId", ""),
                "title": t.get("title", ""),
                "artists": artist.get("name", ""),
                "artistBrowseId": browse_id,
                "album": (t.get("album") or {}).get("name", ""),
                "albumBrowseId": ((t.get("album") or {}).get("id") or ""),
                "duration": duration,
                "thumbnail": thumbnail,
                "isExplicit": bool(t.get("isExplicit", False)),
            })

        # Albums
        albums = []
        for a in (artist.get("albums", {}).get("results", [])):
            albums.append({
                "browseId": a.get("browseId", ""),
                "title": a.get("title", ""),
                "year": a.get("year", ""),
                "thumbnail": YoutubeResponseMapper.select_thumbnail(a.get("thumbnails", [])),
            })

        # Singles
        singles = []
        for s in (artist.get("singles", {}).get("results", [])):
            singles.append({
                "browseId": s.get("browseId", ""),
                "title": s.get("title", ""),
                "year": s.get("year", ""),
                "thumbnail": YoutubeResponseMapper.select_thumbnail(s.get("thumbnails", [])),
            })

        # Videos
        videos = []
        for v in (artist.get("videos", {}).get("results", [])):
            if not v.get("videoId"):
                continue
            v_artists = v.get("artists") or []
            videos.append({
                "videoId":   v.get("videoId", ""),
                "title":     v.get("title", ""),
                "artists":   ", ".join(a.get("name", "") for a in v_artists) or artist.get("name", ""),
                "views":     v.get("views", ""),
                "thumbnail": YoutubeResponseMapper.select_thumbnail(v.get("thumbnails", [])),
            })

        # Related artists ("Fans might also like")
        related = []
        for r in (artist.get("related", {}).get("results", [])):
            related.append({
                "browseId":    r.get("browseId", ""),
                "title":       r.get("title", ""),
                "subscribers": r.get("subscribers", ""),
                "thumbnail":   YoutubeResponseMapper.select_thumbnail(r.get("thumbnails", [])),
            })

        _desc = artist.get("description", "") or ""
        return jsonify({
            "name":          artist.get("name", ""),
            "thumbnail":     YoutubeResponseMapper.select_thumbnail(artist.get("thumbnails", [])),
            "description":   _desc,
            "descriptionUrl": (_extract_artist_desc_url(browse_id) if "wikipedia" in _desc.lower() else None),
            "subscribers":      artist.get("subscribers", "") or "",
            "monthlyListeners": artist.get("monthlyListeners", "") or "",
            "radioId":       artist.get("radioId", "") or "",
            "subscribed":    bool(artist.get("subscribed", False)),
            "channelId":     artist.get("channelId", "") or browse_id,
            "songsBrowseId": (lambda b: b[2:] if b.startswith("VL") else b)(artist.get("songs", {}).get("browseId", "") or ""),
            "albumsBrowseId": artist.get("albums", {}).get("browseId", "") or "",
            "albumsParams":   artist.get("albums", {}).get("params", "") or "",
            "singlesBrowseId": artist.get("singles", {}).get("browseId", "") or "",
            "singlesParams":   artist.get("singles", {}).get("params", "") or "",
            "tracks":  tracks,
            "albums":  albums,
            "singles": singles,
            "videos":  videos,
            "related": related,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blueprint.route("/artist/<browse_id>/subscribe", methods=["POST"])
def artist_subscribe(browse_id):
    try:
        data = request.get_json(silent=True) or {}
        channel_id = data.get("channelId") or browse_id
        music_session().get_active_client().subscribe_artists([channel_id])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blueprint.route("/artist/<browse_id>/unsubscribe", methods=["POST"])
def artist_unsubscribe(browse_id):
    try:
        data = request.get_json(silent=True) or {}
        channel_id = data.get("channelId") or browse_id
        music_session().get_active_client().unsubscribe_artists([channel_id])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
