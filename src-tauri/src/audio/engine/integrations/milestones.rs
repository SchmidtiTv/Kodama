use std::time::Instant;

use reqwest::blocking::Client;
use serde_json::json;

use super::super::model::{
    PlaybackIntegrationSettings, PlaybackSnapshot, PlaybackStatus, PlaybackTrack,
};
use super::http::{post_lastfm, unix_timestamp, API_ROOT};

#[derive(Default)]
pub(super) struct PlaybackMilestones {
    video_id: Option<String>,
    playback_instance: u64,
    played_seconds: f64,
    started_at: i64,
    scrobbled: bool,
    history_sent: bool,
    last_tick: Option<Instant>,
}

impl PlaybackMilestones {
    pub(super) fn tick(
        &mut self,
        client: &Client,
        snapshot: &PlaybackSnapshot,
        settings: &PlaybackIntegrationSettings,
    ) {
        let elapsed = self.elapsed_since_last_tick();
        if self.playback_changed(snapshot) {
            self.begin_playback(client, snapshot, settings);
        }
        if snapshot.status == PlaybackStatus::Playing {
            self.played_seconds += elapsed;
        }
        self.submit_due_milestones(client, snapshot, settings);
    }

    fn elapsed_since_last_tick(&mut self) -> f64 {
        let now = Instant::now();
        self.last_tick
            .replace(now)
            .map(|previous| now.duration_since(previous).as_secs_f64().min(2.0))
            .unwrap_or(0.0)
    }

    fn playback_changed(&self, snapshot: &PlaybackSnapshot) -> bool {
        self.playback_instance != snapshot.playback_instance
            || self.video_id.as_deref()
                != snapshot
                    .current_track
                    .as_ref()
                    .map(|track| track.video_id.as_str())
    }

    fn begin_playback(
        &mut self,
        client: &Client,
        snapshot: &PlaybackSnapshot,
        settings: &PlaybackIntegrationSettings,
    ) {
        self.playback_instance = snapshot.playback_instance;
        self.video_id = snapshot
            .current_track
            .as_ref()
            .map(|track| track.video_id.clone());
        self.played_seconds = 0.0;
        self.started_at = unix_timestamp();
        self.scrobbled = false;
        self.history_sent = false;
        if settings.lastfm_connected && snapshot.status != PlaybackStatus::Stopped {
            if let Some(track) = snapshot.current_track.as_ref() {
                post_lastfm(client, "now-playing", track, self.started_at);
            }
        }
    }

    fn submit_due_milestones(
        &mut self,
        client: &Client,
        snapshot: &PlaybackSnapshot,
        settings: &PlaybackIntegrationSettings,
    ) {
        let Some(track) = snapshot.current_track.as_ref() else {
            return;
        };
        let duration = effective_duration(track, snapshot);
        if duration < 30.0 || self.played_seconds < (duration / 2.0).min(240.0) {
            return;
        }
        if settings.lastfm_connected && !self.scrobbled {
            self.scrobbled = true;
            post_lastfm(client, "scrobble", track, self.started_at);
        }
        if settings.youtube_history_enabled && !self.history_sent {
            self.history_sent = true;
            let _ = client
                .post(format!("{API_ROOT}/ytmusic/history"))
                .json(&json!({ "videoId": track.video_id }))
                .send();
        }
    }
}

fn effective_duration(track: &PlaybackTrack, snapshot: &PlaybackSnapshot) -> f64 {
    snapshot
        .duration_seconds
        .max(track.duration_seconds.unwrap_or_default())
}
