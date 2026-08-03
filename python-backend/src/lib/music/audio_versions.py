"""Resolve video-heavy YouTube Music playlists to their audio counterparts."""

import re
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from typing import Protocol


class WatchPlaylistClient(Protocol):
    def get_watch_playlist(
        self, videoId: str | None = None, playlistId: str | None = None, limit: int = 25
    ) -> dict[str, object]: ...

    def search(
        self, query: str, filter: str = "songs", limit: int = 20
    ) -> list[dict[str, object]]: ...


_VIDEO_TITLE_MARKER = re.compile(
    r"\s*[\[(](?:official(?:\s+(?:hd|music))?|music|lyric)\s+video[\])]\s*$",
    re.IGNORECASE,
)


def _normalized_title(track: dict[str, object]) -> str:
    title = _VIDEO_TITLE_MARKER.sub("", str(track.get("title", "")))
    return re.sub(r"[^\w]+", " ", title.casefold()).strip()


def _primary_artist(track: dict[str, object]) -> str:
    artists = track.get("artists") or []
    if not isinstance(artists, list) or not artists or not isinstance(artists[0], dict):
        return ""
    return str(artists[0].get("name", "")).casefold().strip()


def _same_song(video: dict[str, object], audio: dict[str, object]) -> bool:
    if _normalized_title(video) != _normalized_title(audio):
        return False
    video_artist = _primary_artist(video)
    audio_artist = _primary_artist(audio)
    return not video_artist or not audio_artist or video_artist == audio_artist


def _duration_seconds(track: dict[str, object]) -> int | None:
    duration = track.get("duration_seconds")
    if isinstance(duration, int):
        return duration

    text = str(track.get("duration") or track.get("length") or "")
    parts = text.split(":")
    if not parts or not all(part.isdigit() for part in parts):
        return None
    seconds = 0
    for part in parts:
        seconds = seconds * 60 + int(part)
    return seconds


def _is_search_audio_match(video: dict[str, object], candidate: dict[str, object]) -> bool:
    """Accept only an exact song search hit, avoiding covers and alternate mixes."""
    if candidate.get("resultType") not in (None, "song"):
        return False
    if candidate.get("videoType") != "MUSIC_VIDEO_TYPE_ATV" or not _same_song(video, candidate):
        return False

    video_duration = _duration_seconds(video)
    candidate_duration = _duration_seconds(candidate)
    return (
        video_duration is None
        or candidate_duration is None
        or abs(video_duration - candidate_duration) <= 5
    )


def _search_query(track: dict[str, object]) -> str:
    artists = track.get("artists") or []
    names = [str(artist.get("name", "")) for artist in artists if isinstance(artist, dict)]
    return " ".join(part for part in (str(track.get("title", "")), *names) if part).strip()


def _find_audio_search_match(
    client: WatchPlaylistClient, video: dict[str, object]
) -> dict[str, object] | None:
    query = _search_query(video)
    if not query or not _primary_artist(video):
        return None
    try:
        candidates = client.search(query, filter="songs", limit=5)
    except Exception as error:
        print(
            f"[playlist] audio search failed video_id={video.get('videoId', '')}: {error}",
            flush=True,
        )
        return None

    return next(
        (
            candidate
            for candidate in candidates
            if isinstance(candidate, dict) and _is_search_audio_match(video, candidate)
        ),
        None,
    )


def _watch_playlist_candidates(
    client: WatchPlaylistClient, playlist_id: str, track_count: int
) -> list[object]:
    try:
        response = client.get_watch_playlist(playlistId=playlist_id, limit=max(25, track_count))
        candidates = response.get("tracks", [])
    except Exception as error:
        print(f"[playlist] audio counterpart lookup failed playlist_id={playlist_id}: {error}", flush=True)
        return []

    return candidates if isinstance(candidates, list) else []


def _resolve_audio_batch(
    client: WatchPlaylistClient,
    candidates: list[object],
    tracks: list[dict[str, object]],
    offset: int,
) -> tuple[list[dict[str, object]], int]:
    """Resolve one ordered playlist batch without delaying other batches."""
    video_types = {"MUSIC_VIDEO_TYPE_OMV", "MUSIC_VIDEO_TYPE_UGC"}
    resolved = list(tracks)
    replacement_count = 0
    unresolved: list[tuple[int, dict[str, object]]] = []
    for batch_index, video in enumerate(tracks):
        if video.get("videoType") not in video_types:
            continue
        audio = candidates[offset + batch_index] if offset + batch_index < len(candidates) else None
        if isinstance(audio, dict) and audio.get("videoType") == "MUSIC_VIDEO_TYPE_ATV" and _same_song(video, audio):
            resolved[batch_index] = audio
            replacement_count += 1
            print(
                "[playlist] resolved audio counterpart "
                f"video_id={video.get('videoId', '')} audio_id={audio.get('videoId', '')} "
                f"title={audio.get('title', '')!r} source=watch-playlist",
                flush=True,
            )
            continue
        unresolved.append((batch_index, video))

    if not unresolved:
        return resolved, replacement_count

    # A playlist queue can retain the original video entries even with isAudioOnly
    # enabled. Resolve only this batch so the SSE route can emit earlier batches
    # while subsequent lookups run later.
    with ThreadPoolExecutor(max_workers=4) as executor:
        search_matches = executor.map(
            lambda item: _find_audio_search_match(client, item[1]), unresolved
        )
        for (batch_index, video), audio in zip(unresolved, search_matches):
            if audio is None:
                continue
            resolved[batch_index] = audio
            replacement_count += 1
            print(
                "[playlist] resolved audio counterpart "
                f"video_id={video.get('videoId', '')} audio_id={audio.get('videoId', '')} "
                f"title={audio.get('title', '')!r} source=search",
                flush=True,
            )

    return resolved, replacement_count


def iter_preferred_audio_versions(
    client: WatchPlaylistClient,
    playlist_id: str | None,
    tracks: list[dict[str, object]],
    batch_size: int,
) -> Iterator[list[dict[str, object]]]:
    """Yield ordered, audio-preferred track batches for an SSE playlist response."""
    if not tracks:
        return

    video_types = {"MUSIC_VIDEO_TYPE_OMV", "MUSIC_VIDEO_TYPE_UGC"}
    if not any(track.get("videoType") in video_types for track in tracks):
        for index in range(0, len(tracks), batch_size):
            yield tracks[index:index + batch_size]
        return

    candidates = _watch_playlist_candidates(client, playlist_id, len(tracks)) if playlist_id else []
    replacement_count = 0
    for index in range(0, len(tracks), batch_size):
        batch, replacements = _resolve_audio_batch(
            client, candidates, tracks[index:index + batch_size], index
        )
        replacement_count += replacements
        yield batch

    print(
        f"[playlist] audio counterpart resolution playlist_id={playlist_id or 'none'} "
        f"replaced={replacement_count}/{len(tracks)}",
        flush=True,
    )


def prefer_audio_versions(
    client: WatchPlaylistClient, playlist_id: str | None, tracks: list[dict[str, object]]
) -> list[dict[str, object]]:
    """Replace OMV/UGC playlist entries with their audio versions when available."""
    video_types = {"MUSIC_VIDEO_TYPE_OMV", "MUSIC_VIDEO_TYPE_UGC"}
    if not tracks or not any(track.get("videoType") in video_types for track in tracks):
        return tracks

    candidates = _watch_playlist_candidates(client, playlist_id, len(tracks)) if playlist_id else []
    resolved, replacement_count = _resolve_audio_batch(client, candidates, tracks, 0)

    print(
        f"[playlist] audio counterpart resolution playlist_id={playlist_id or 'none'} "
        f"replaced={replacement_count}/{len(tracks)}",
        flush=True,
    )
    return resolved
