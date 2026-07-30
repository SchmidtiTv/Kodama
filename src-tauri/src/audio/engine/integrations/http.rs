use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::blocking::Client;
use serde_json::json;

use super::super::model::PlaybackTrack;

pub(super) const API_ROOT: &str = "http://localhost:9847";

pub(super) fn build_client() -> Result<Client, reqwest::Error> {
    Client::builder()
        .connect_timeout(Duration::from_millis(300))
        .timeout(Duration::from_millis(800))
        .build()
}

pub(super) fn post_lastfm(client: &Client, action: &str, track: &PlaybackTrack, started_at: i64) {
    let artist = artists(track)
        .trim_end_matches(" - Topic")
        .trim()
        .to_string();
    if artist.is_empty() || track.title.trim().is_empty() {
        return;
    }
    let _ = client
        .post(format!("{API_ROOT}/lastfm/{action}"))
        .json(&json!({
            "artist": artist,
            "track": track.title.trim(),
            "album": track.album,
            "duration": track.duration_seconds.unwrap_or_default(),
            "timestamp": started_at,
        }))
        .send();
}

pub(super) fn artists(track: &PlaybackTrack) -> String {
    track.artists.join(", ")
}

pub(super) fn unix_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
