mod commands;
mod payload;

use reqwest::blocking::Client;
use serde_json::Value;
use tauri::AppHandle;

use super::super::model::PlaybackSnapshot;
use super::super::PlaybackEngine;
use super::http::API_ROOT;
use crate::audio::player::AudioCmd;

pub(super) fn sync(
    client: &Client,
    app: &AppHandle,
    engine: &PlaybackEngine,
    audio_tx: &std::sync::mpsc::SyncSender<AudioCmd>,
    snapshot: &PlaybackSnapshot,
) {
    let response = client
        .post(format!("{API_ROOT}/remote/_sync"))
        .json(&payload::build(snapshot, engine))
        .send()
        .and_then(|response| response.json::<Value>());
    let Ok(response) = response else {
        return;
    };
    for command in response
        .get("commands")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        if let Err(error) = commands::run(command, client, app, engine, audio_tx) {
            eprintln!("[integrations] remote command failed: {error}");
        }
    }
}
