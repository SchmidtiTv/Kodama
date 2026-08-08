use super::model::{
    CrossfadeOverride, PlaybackIntegrationSettings, PlaybackStatus, PlaybackTrack, RepeatMode,
    TransitionPolicyUpdate, TransportUpdate,
};
use super::state::PlaybackEngine;
use super::state::MAX_QUEUE_TRACKS;
use std::thread;

fn track(video_id: &str) -> PlaybackTrack {
    PlaybackTrack {
        video_id: video_id.to_string(),
        title: format!("Track {video_id}"),
        artists: vec!["Artist".to_string()],
        album: String::new(),
        thumbnail: String::new(),
        duration_seconds: Some(180.0),
    }
}

fn engine_with_queue() -> PlaybackEngine {
    let engine = PlaybackEngine::new();
    engine
        .replace_queue(vec![track("one"), track("two"), track("three")])
        .unwrap();
    engine.set_current_track(Some(track("one"))).unwrap();
    engine
}

#[test]
fn ui_visibility_is_shared_without_changing_playback_state() {
    let engine = engine_with_queue();
    let clone = engine.clone();
    let before = engine.snapshot().unwrap();

    clone.set_ui_visible(false);

    assert!(!engine.is_ui_visible());
    assert_eq!(engine.snapshot().unwrap(), before);
    engine.set_ui_visible(true);
    assert!(clone.is_ui_visible());
}

#[test]
fn queue_is_normalized_and_deduplicated() {
    let engine = PlaybackEngine::new();
    let snapshot = engine
        .replace_queue(vec![track(" one "), track("two"), track("one")])
        .unwrap();
    assert_eq!(
        snapshot
            .queue
            .iter()
            .map(|item| item.video_id.as_str())
            .collect::<Vec<_>>(),
        vec!["one", "two"]
    );
}

#[test]
fn setting_same_current_track_preserves_live_transport() {
    let engine = engine_with_queue();
    engine
        .update_transport(TransportUpdate {
            status: Some(PlaybackStatus::Playing),
            position_seconds: Some(42.0),
            ..TransportUpdate::default()
        })
        .unwrap();
    let snapshot = engine.set_current_track(Some(track("one"))).unwrap();
    assert_eq!(snapshot.status, PlaybackStatus::Playing);
    assert_eq!(snapshot.position_seconds, 42.0);
}

#[test]
fn selecting_a_track_without_starting_transport_is_stopped() {
    let engine = PlaybackEngine::new();
    let snapshot = engine.set_current_track(Some(track("restored"))).unwrap();

    assert_eq!(snapshot.status, PlaybackStatus::Stopped);
    assert_eq!(snapshot.current_track.unwrap().video_id, "restored");
}

#[test]
fn crossfade_is_prepared_once_inside_its_window() {
    let engine = engine_with_queue();
    engine
        .update_transition_policy(TransitionPolicyUpdate {
            crossfade_seconds: Some(5.0),
            ..TransitionPolicyUpdate::default()
        })
        .unwrap();
    assert_eq!(engine.prepare_crossfade(174.0, 180.0).unwrap(), None);
    let request = engine.prepare_crossfade(175.2, 180.0).unwrap().unwrap();
    assert_eq!(request.from_track.video_id, "one");
    assert_eq!(request.to_track.video_id, "two");
    assert_eq!(engine.prepare_crossfade(176.0, 180.0).unwrap(), None);
}

#[test]
fn transition_override_can_disable_one_pair() {
    let engine = engine_with_queue();
    engine
        .update_transition_policy(TransitionPolicyUpdate {
            crossfade_seconds: Some(5.0),
            crossfade_overrides: Some(vec![CrossfadeOverride {
                from_video_id: "one".to_string(),
                to_video_id: "two".to_string(),
                seconds: 0.0,
            }]),
            ..TransitionPolicyUpdate::default()
        })
        .unwrap();
    assert_eq!(engine.prepare_crossfade(179.0, 180.0).unwrap(), None);
}

#[test]
fn committing_crossfade_advances_native_current_track() {
    let engine = engine_with_queue();
    engine
        .update_transition_policy(TransitionPolicyUpdate {
            crossfade_seconds: Some(5.0),
            ..TransitionPolicyUpdate::default()
        })
        .unwrap();
    engine.prepare_crossfade(176.0, 180.0).unwrap();
    assert_eq!(
        engine
            .commit_crossfade(PlaybackStatus::Playing)
            .unwrap()
            .unwrap()
            .video_id,
        "two"
    );
    assert_eq!(
        engine.snapshot().unwrap().current_track.unwrap().video_id,
        "two"
    );
}

#[test]
fn committing_crossfade_preserves_a_paused_transport() {
    let engine = engine_with_queue();
    engine
        .update_transition_policy(TransitionPolicyUpdate {
            crossfade_seconds: Some(5.0),
            ..TransitionPolicyUpdate::default()
        })
        .unwrap();
    engine.prepare_crossfade(176.0, 180.0).unwrap();

    engine.commit_crossfade(PlaybackStatus::Paused).unwrap();

    let snapshot = engine.snapshot().unwrap();
    assert_eq!(snapshot.current_track.unwrap().video_id, "two");
    assert_eq!(snapshot.status, PlaybackStatus::Paused);
}

#[test]
fn natural_end_stops_at_queue_end_without_repeat() {
    let engine = engine_with_queue();
    engine.set_current_track(Some(track("three"))).unwrap();
    assert_eq!(engine.advance_after_end().unwrap(), None);
    assert_eq!(engine.snapshot().unwrap().status, PlaybackStatus::Stopped);
}

#[test]
fn natural_end_wraps_when_repeat_all_is_enabled() {
    let engine = engine_with_queue();
    engine.set_current_track(Some(track("three"))).unwrap();
    engine
        .update_transport(TransportUpdate {
            repeat: Some(RepeatMode::All),
            ..TransportUpdate::default()
        })
        .unwrap();
    assert_eq!(
        engine.advance_after_end().unwrap().unwrap().track.video_id,
        "one"
    );
}

#[test]
fn repeat_one_replays_the_current_track() {
    let engine = engine_with_queue();
    let first_instance = engine.snapshot().unwrap().playback_instance;
    engine
        .update_transport(TransportUpdate {
            repeat: Some(RepeatMode::One),
            ..TransportUpdate::default()
        })
        .unwrap();
    assert_eq!(
        engine.advance_after_end().unwrap().unwrap().track.video_id,
        "one"
    );
    assert!(engine.snapshot().unwrap().playback_instance > first_instance);
}

#[test]
fn manual_next_wraps_without_repeat() {
    let engine = engine_with_queue();
    engine.set_current_track(Some(track("three"))).unwrap();
    let request = engine.select_next().unwrap().unwrap();
    assert_eq!(request.track.video_id, "one");
    assert_eq!(engine.snapshot().unwrap().status, PlaybackStatus::Loading);
}

#[test]
fn manual_previous_wraps_to_queue_end() {
    let engine = engine_with_queue();
    let request = engine.select_previous().unwrap().unwrap();
    assert_eq!(request.track.video_id, "three");
    assert_eq!(
        engine.snapshot().unwrap().current_track.unwrap().video_id,
        "three"
    );
}

#[test]
fn transport_preferences_are_reflected_in_subscriber_snapshots() {
    let engine = engine_with_queue();
    let snapshot = engine
        .update_transport(TransportUpdate {
            volume: Some(0.75),
            shuffle: Some(true),
            repeat: Some(RepeatMode::All),
            ..TransportUpdate::default()
        })
        .unwrap();

    assert_eq!(snapshot.volume, 0.75);
    assert!(snapshot.shuffle);
    assert_eq!(snapshot.repeat, RepeatMode::All);
    assert_eq!(engine.snapshot().unwrap(), snapshot);
}

#[test]
fn selecting_a_remote_queue_track_updates_the_native_engine() {
    let engine = engine_with_queue();
    let request = engine.select_track("three").unwrap().unwrap();
    assert_eq!(request.track.video_id, "three");
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(snapshot.current_track.unwrap().video_id, "three");
    assert_eq!(snapshot.status, PlaybackStatus::Loading);
}

#[test]
fn integration_preferences_are_shared_and_validated() {
    let engine = engine_with_queue();
    engine
        .update_integration_settings(PlaybackIntegrationSettings {
            discord_enabled: true,
            discord_status_display: "artist".to_string(),
            lastfm_connected: true,
            youtube_history_enabled: true,
            overlay_updates_enabled: true,
            remote_enabled: true,
        })
        .unwrap();
    assert!(engine.integration_settings().unwrap().remote_enabled);

    let mut invalid = engine.integration_settings().unwrap();
    invalid.discord_status_display = "invalid".to_string();
    assert!(engine.update_integration_settings(invalid).is_err());
    assert_eq!(
        engine
            .integration_settings()
            .unwrap()
            .discord_status_display,
        "artist"
    );
}

#[test]
fn checking_crossfade_early_does_not_consume_shuffle_choice() {
    let first = PlaybackEngine::new();
    let second = PlaybackEngine::new();
    let queue: Vec<_> = ["a", "b", "c", "d", "e", "f"]
        .into_iter()
        .map(track)
        .collect();
    for engine in [&first, &second] {
        engine.replace_queue(queue.clone()).unwrap();
        engine.set_current_track(Some(track("a"))).unwrap();
        engine
            .update_transport(TransportUpdate {
                shuffle: Some(true),
                ..TransportUpdate::default()
            })
            .unwrap();
    }

    for _ in 0..37 {
        assert!(first.prepare_crossfade(10.0, 200.0).unwrap().is_none());
    }

    let first_next = first.advance_after_end().unwrap().unwrap();
    let second_next = second.advance_after_end().unwrap().unwrap();
    assert_eq!(first_next.track.video_id, second_next.track.video_id);
}

#[test]
fn failed_queue_mutation_rolls_back_the_entire_state() {
    let engine = PlaybackEngine::new();
    let full_queue = (0..MAX_QUEUE_TRACKS)
        .map(|index| track(&format!("track-{index}")))
        .collect();
    engine.replace_queue(full_queue).unwrap();
    let before = engine.snapshot().unwrap();
    assert!(engine
        .set_current_track(Some(track("one-more-track")))
        .is_err());
    assert_eq!(engine.snapshot().unwrap(), before);
}

#[test]
fn concurrent_updates_produce_consistent_snapshots() {
    let engine = PlaybackEngine::new();
    let workers = (0..8)
        .map(|index| {
            let engine = engine.clone();
            thread::spawn(move || {
                engine
                    .update_transport(TransportUpdate {
                        position_seconds: Some(index as f64),
                        ..TransportUpdate::default()
                    })
                    .unwrap();
            })
        })
        .collect::<Vec<_>>();
    for worker in workers {
        worker.join().unwrap();
    }
    assert!((0.0..8.0).contains(&engine.snapshot().unwrap().position_seconds));
}
