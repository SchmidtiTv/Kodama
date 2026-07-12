"""Track normalization shared by the playlist fetch and stream endpoints."""

from src.lib import YoutubeResponseMapper
from typing import cast
from typing import cast


# Old server.py: the `fmt` closure in stream_playlist / the track loop in get_playlist
def format_track(track: dict[str, object]) -> dict[str, object]:
    """Full track object as returned by /playlist/<id> and /playlist/<id>/stream."""
    artist_list = cast(list[dict[str, str]], track.get("artists", []))
    artists = ", ".join(a["name"] for a in artist_list)
    artist_browse_id = (artist_list[0].get("id") or "") if artist_list else ""
    album = cast(dict[str, str], track.get("album") or {})
    return {
        "videoId": track.get("videoId", ""),
        "setVideoId": track.get("setVideoId", ""),
        "title": track.get("title", ""),
        "artists": artists,
        "artistBrowseId": artist_browse_id,
        "artistLinks": YoutubeResponseMapper.build_artist_links(artist_list),
        "album": album.get("name", ""),
        "albumBrowseId": (album.get("id") or ""),
        "duration": track.get("duration", ""),
        "thumbnail": YoutubeResponseMapper.select_thumbnail(cast(list[dict[str, object]], track.get("thumbnails", []))),
        "isExplicit": bool(track.get("isExplicit", False)),
    }
