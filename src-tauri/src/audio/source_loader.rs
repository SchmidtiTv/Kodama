use tauri::Emitter;

use super::decoder::StreamingSource;
use super::engine::{
    CrossfadeRequest, PlaybackEngine, PlaybackSourceRequest, PlaybackStatus, TransportUpdate,
};

pub(super) type SourceMessage = (StreamingSource, u64, bool, String);
pub(super) type CrossfadeSourceMessage = (StreamingSource, String, f64, u64, bool);

pub(super) fn build_streaming_source(url: &str, seek_to: f64) -> Result<StreamingSource, String> {
    if url.contains("/audio-stream/") {
        let source = super::http_source::HttpStream::new(url.to_string())
            .map_err(|error| error.to_string())?;
        return StreamingSource::new_streaming(Box::new(source), seek_to);
    }
    if let Some(path) = url.strip_prefix("file://") {
        let data = std::fs::read(path.replace("%20", " "))
            .map_err(|error| format!("File read error: {error}"))?;
        return StreamingSource::new_with_seek(data, seek_to);
    }

    let client = reqwest::blocking::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|error| error.to_string())?;
    let response = client.get(url).send().map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }
    let data = response
        .bytes()
        .map(|bytes| bytes.to_vec())
        .map_err(|error| error.to_string())?;
    StreamingSource::new_with_seek(data, seek_to)
}

fn resolve_automatic_source(request: &PlaybackSourceRequest) -> Result<String, String> {
    let cached_url = format!(
        "http://localhost:9847/song/cached/{}",
        request.track.video_id
    );
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|error| error.to_string())?;
    if client
        .head(&cached_url)
        .send()
        .map(|response| response.status().is_success())
        .unwrap_or(false)
    {
        return Ok(cached_url);
    }
    if request.progressive {
        return Ok(format!(
            "http://localhost:9847/audio-stream/{}",
            request.track.video_id
        ));
    }

    let response = client
        .get(format!(
            "http://localhost:9847/stream-prepare/{}",
            request.track.video_id
        ))
        .send()
        .map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "stream prepare returned HTTP {}",
            response.status()
        ));
    }
    let payload: serde_json::Value = response.json().map_err(|error| error.to_string())?;
    let path = payload
        .get("path")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| {
            payload
                .get("error")
                .and_then(serde_json::Value::as_str)
                .unwrap_or("stream prepare did not return a path")
                .to_string()
        })?;
    Ok(format!("file://{}", path.replace('\\', "/")))
}

pub(super) fn spawn_automatic_source(
    request: PlaybackSourceRequest,
    generation: u64,
    source_tx: std::sync::mpsc::Sender<SourceMessage>,
    app: tauri::AppHandle,
    engine: PlaybackEngine,
) {
    std::thread::spawn(move || {
        let result = resolve_automatic_source(&request)
            .and_then(|url| build_streaming_source(&url, 0.0).map(|source| (source, url)));
        match result {
            Ok((source, url)) => {
                let _ = source_tx.send((source, generation, false, url));
            }
            Err(error) => {
                let _ = engine.update_transport(TransportUpdate {
                    status: Some(PlaybackStatus::Stopped),
                    ..TransportUpdate::default()
                });
                if let Ok(snapshot) = engine.snapshot() {
                    let _ = app.emit("playback-state-changed", snapshot);
                }
                let _ = app.emit(
                    "audio-error",
                    format!(
                        "Could not load queued track {}: {error}",
                        request.track.video_id
                    ),
                );
            }
        }
    });
}

pub(super) fn spawn_automatic_crossfade(
    request: CrossfadeRequest,
    generation: u64,
    source_tx: std::sync::mpsc::Sender<CrossfadeSourceMessage>,
    app: tauri::AppHandle,
    engine: PlaybackEngine,
) {
    std::thread::spawn(move || {
        let source_request = PlaybackSourceRequest {
            track: request.to_track.clone(),
            progressive: request.progressive,
        };
        let result = resolve_automatic_source(&source_request)
            .and_then(|url| build_streaming_source(&url, 0.0).map(|source| (source, url)));
        match result {
            Ok((source, url)) => {
                let _ = source_tx.send((source, url, request.seconds, generation, true));
            }
            Err(error) => {
                let _ = engine.fail_crossfade();
                eprintln!(
                    "[Audio] Automatic crossfade build failed for {}: {error}",
                    request.to_track.video_id
                );
                let _ = app.emit("audio-crossfade-failed", ());
            }
        }
    });
}
