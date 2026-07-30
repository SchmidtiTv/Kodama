mod http;
mod milestones;
mod now_playing;
mod overlay;
mod remote;

use std::time::Duration;

use tauri::AppHandle;

use super::model::{PlaybackIntegrationSettings, PlaybackSnapshot};
use super::PlaybackEngine;
use crate::audio::player::AudioCmd;

pub fn start_integration_worker(
    app: AppHandle,
    engine: PlaybackEngine,
    audio_tx: std::sync::mpsc::SyncSender<AudioCmd>,
) {
    std::thread::spawn(move || {
        let client = match http::build_client() {
            Ok(client) => client,
            Err(error) => {
                eprintln!("[integrations] HTTP client setup failed: {error}");
                return;
            }
        };
        let mut state = IntegrationWorker::default();

        loop {
            let snapshot = match engine.snapshot() {
                Ok(snapshot) => snapshot,
                Err(error) => {
                    eprintln!("[integrations] snapshot failed: {error}");
                    std::thread::sleep(Duration::from_secs(1));
                    continue;
                }
            };
            let settings = engine.integration_settings().unwrap_or_default();
            state.tick(&client, &app, &engine, &audio_tx, &snapshot, &settings);
            std::thread::sleep(Duration::from_secs(1));
        }
    });
}

#[derive(Default)]
struct IntegrationWorker {
    milestones: milestones::PlaybackMilestones,
    now_playing: now_playing::NowPlayingSync,
    overlay: overlay::OverlaySync,
}

impl IntegrationWorker {
    fn tick(
        &mut self,
        client: &reqwest::blocking::Client,
        app: &AppHandle,
        engine: &PlaybackEngine,
        audio_tx: &std::sync::mpsc::SyncSender<AudioCmd>,
        snapshot: &PlaybackSnapshot,
        settings: &PlaybackIntegrationSettings,
    ) {
        self.milestones.tick(client, snapshot, settings);
        self.now_playing.tick(app, snapshot, settings);
        self.overlay.tick(client, snapshot, settings);
        if settings.remote_enabled {
            remote::sync(client, app, engine, audio_tx, snapshot);
        }
    }
}
