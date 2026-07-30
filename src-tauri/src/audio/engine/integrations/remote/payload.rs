use serde_json::{json, Value};

use super::super::super::model::{PlaybackSnapshot, PlaybackStatus};
use super::super::super::PlaybackEngine;
use super::super::http::artists;

pub(super) fn build(snapshot: &PlaybackSnapshot, engine: &PlaybackEngine) -> Value {
    let track = snapshot.current_track.as_ref();
    let current_index = track.and_then(|current| {
        snapshot
            .queue
            .iter()
            .position(|item| item.video_id == current.video_id)
    });
    let queue = snapshot
        .queue
        .iter()
        .skip(current_index.map(|index| index + 1).unwrap_or(0))
        .take(100)
        .map(|track| {
            json!({
                "videoId": track.video_id,
                "title": track.title,
                "artists": artists(track),
                "thumbnail": track.thumbnail,
            })
        })
        .collect::<Vec<_>>();

    json!({
        "state": {
            "title": track.map(|track| track.title.as_str()).unwrap_or_default(),
            "artists": track.map(artists).unwrap_or_default(),
            "thumbnail": track.map(|track| track.thumbnail.as_str()).unwrap_or_default(),
            "isPlaying": snapshot.status == PlaybackStatus::Playing,
            "position": snapshot.position_seconds.floor(),
            "duration": snapshot.duration_seconds.floor(),
            "hasTrack": track.is_some(),
            "shuffle": snapshot.shuffle,
            "repeat": snapshot.repeat,
            "volume": (snapshot.volume * 100.0).round(),
            "isLiked": engine.current_track_liked().unwrap_or(false),
            "queue": queue,
        }
    })
}
