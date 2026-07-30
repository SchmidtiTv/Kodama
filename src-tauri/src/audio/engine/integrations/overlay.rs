use reqwest::blocking::Client;
use serde_json::json;

use super::super::model::{PlaybackIntegrationSettings, PlaybackSnapshot, PlaybackStatus};
use super::http::{artists, API_ROOT};

#[derive(Default)]
pub(super) struct OverlaySync {
    signature: String,
}

impl OverlaySync {
    pub(super) fn tick(
        &mut self,
        client: &Client,
        snapshot: &PlaybackSnapshot,
        settings: &PlaybackIntegrationSettings,
    ) {
        if !settings.overlay_updates_enabled {
            self.signature.clear();
            return;
        }
        let signature = overlay_signature(snapshot);
        if signature == self.signature {
            return;
        }
        self.signature = signature;

        let track = snapshot.current_track.as_ref();
        let thumbnail = track
            .filter(|track| !track.thumbnail.is_empty())
            .map(|track| {
                format!(
                    "{API_ROOT}/imgproxy?url={}",
                    url::form_urlencoded::byte_serialize(track.thumbnail.as_bytes())
                        .collect::<String>()
                )
            })
            .unwrap_or_default();
        let _ = client
            .post(format!("{API_ROOT}/overlay/push"))
            .json(&json!({
                "title": track.map(|track| track.title.as_str()).unwrap_or_default(),
                "artist": track.map(artists).unwrap_or_default(),
                "album": track.map(|track| track.album.as_str()).unwrap_or_default(),
                "cover": thumbnail,
                "progress": snapshot.position_seconds,
                "duration": snapshot.duration_seconds,
                "isPlaying": snapshot.status == PlaybackStatus::Playing && track.is_some(),
            }))
            .send();
    }
}

fn overlay_signature(snapshot: &PlaybackSnapshot) -> String {
    format!(
        "{}:{}:{}:{}",
        snapshot
            .current_track
            .as_ref()
            .map(|track| track.video_id.as_str())
            .unwrap_or_default(),
        snapshot
            .current_track
            .as_ref()
            .map(|track| track.title.as_str())
            .unwrap_or_default(),
        snapshot.status == PlaybackStatus::Playing,
        (snapshot.position_seconds / 5.0).floor()
    )
}
