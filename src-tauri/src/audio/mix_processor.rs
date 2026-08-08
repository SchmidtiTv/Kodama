//! Offline PCM renderer for a single-sink Mix transition.
//!
//! Rendering happens before replacing the live source, never on rodio's output callback. A
//! caller can therefore discard a failed render and retain the existing two-sink crossfade.

use ssstretch::Stretch;

use super::engine::{MixEffect, MixEqCurve, MixPreset, MixTransition, MixVolumeCurve};

const MIN_TEMPO_RATIO: f32 = 0.75;
const MAX_TEMPO_RATIO: f32 = 1.5;

pub struct KeyLockedTempo {
    stretch: Stretch,
    channels: usize,
}

impl KeyLockedTempo {
    pub fn new(channels: u16, sample_rate: u32) -> Result<Self, String> {
        let channels = usize::from(channels);
        if channels == 0 || sample_rate == 0 {
            return Err("tempo processor requires channels and sample rate".to_string());
        }
        let mut stretch = Stretch::new();
        stretch.preset_default(channels as i32, sample_rate as f32);
        Ok(Self { stretch, channels })
    }

    /// Render interleaved PCM at `tempo_ratio` without changing its perceived key.
    pub fn render(&mut self, interleaved: &[f32], tempo_ratio: f32) -> Result<Vec<f32>, String> {
        if !(MIN_TEMPO_RATIO..=MAX_TEMPO_RATIO).contains(&tempo_ratio) {
            return Err("tempo ratio must be between 0.75 and 1.5".to_string());
        }
        if interleaved.len() % self.channels != 0 {
            return Err("interleaved PCM does not contain complete frames".to_string());
        }
        let input_frames = interleaved.len() / self.channels;
        if input_frames == 0 {
            return Ok(Vec::new());
        }
        let output_frames = ((input_frames as f32 / tempo_ratio).round() as usize).max(1);
        let mut input = vec![vec![0.0; input_frames]; self.channels];
        for (frame, samples) in interleaved.chunks_exact(self.channels).enumerate() {
            for (channel, sample) in samples.iter().enumerate() {
                input[channel][frame] = *sample;
            }
        }
        let mut output = vec![Vec::new(); self.channels];
        self.stretch.process_vec(
            &input,
            input_frames as i32,
            &mut output,
            output_frames as i32,
        );
        let mut rendered = vec![0.0; output_frames * self.channels];
        for frame in 0..output_frames {
            for channel in 0..self.channels {
                rendered[frame * self.channels + channel] = output[channel][frame];
            }
        }
        Ok(rendered)
    }
}

pub struct RenderedTransition {
    pub pcm: Vec<f32>,
    pub incoming_offset_seconds: f64,
}

/// Creates the PCM handoff. `incoming` must contain enough source material for the requested
/// tempo-adjusted window; missing samples are rendered as silence instead of panicking.
pub fn render_transition(
    outgoing: &[f32],
    incoming: &[f32],
    channels: u16,
    sample_rate: u32,
    seconds: f64,
    transition: &MixTransition,
    tempo_lock: bool,
) -> Result<RenderedTransition, String> {
    if !seconds.is_finite() || !(0.05..=16.0).contains(&seconds) {
        return Err("PCM transition duration must be between 0.05 and 16 seconds".to_string());
    }
    let channels_usize = usize::from(channels);
    if channels_usize == 0
        || outgoing.len() % channels_usize != 0
        || incoming.len() % channels_usize != 0
    {
        return Err("PCM transition requires complete interleaved frames".to_string());
    }
    let frames = (seconds * sample_rate as f64).round().max(1.0) as usize;
    let tempo_ratio = if tempo_lock {
        tempo_ratio(transition)
    } else {
        1.0
    };
    let mut tempo = KeyLockedTempo::new(channels, sample_rate)?;
    let stretched = tempo.render(incoming, tempo_ratio)?;
    let beat_offset_frames =
        (transition.beat_offset_ms / 1000.0 * sample_rate as f64).round() as isize;
    let mut pcm = vec![0.0; frames * channels_usize];
    let mut low = vec![0.0; channels_usize];
    let mut previous = vec![0.0; channels_usize];
    let alpha = (2.0 * std::f32::consts::PI * 220.0 / sample_rate as f32).clamp(0.001, 0.5);

    for frame in 0..frames {
        let progress = frame as f32 / frames.max(1) as f32;
        let (out_gain, in_gain) = gain_envelopes(transition, progress);
        for channel in 0..channels_usize {
            let out = outgoing
                .get(frame * channels_usize + channel)
                .copied()
                .unwrap_or(0.0);
            let incoming_frame = frame as isize - beat_offset_frames;
            let input = if incoming_frame >= 0 {
                stretched
                    .get(incoming_frame as usize * channels_usize + channel)
                    .copied()
                    .unwrap_or(0.0)
            } else {
                0.0
            };
            let filtered = shape_incoming(
                input,
                &mut low[channel],
                &mut previous[channel],
                alpha,
                transition,
                progress,
            );
            pcm[frame * channels_usize + channel] =
                (out * out_gain + filtered * in_gain).clamp(-1.0, 1.0);
        }
    }

    // Positive offsets delay the incoming start; negative offsets consume audio before frame 0.
    let output_input_frames = (frames as f32 * tempo_ratio).round() as isize;
    let consumed_frames = (output_input_frames - beat_offset_frames).max(0) as f64;
    Ok(RenderedTransition {
        pcm,
        incoming_offset_seconds: consumed_frames / sample_rate as f64,
    })
}

fn tempo_ratio(transition: &MixTransition) -> f32 {
    match (transition.from_bpm, transition.to_bpm) {
        (Some(from), Some(to)) if from > 0.0 && to > 0.0 => {
            (from / to).clamp(MIN_TEMPO_RATIO, MAX_TEMPO_RATIO)
        }
        _ => 1.0,
    }
}

fn gain_envelopes(transition: &MixTransition, progress: f32) -> (f32, f32) {
    let curve = match transition.preset {
        MixPreset::Fade => MixVolumeCurve::Smooth,
        MixPreset::Slam => MixVolumeCurve::Cut,
        _ => transition.volume_curve,
    };
    match curve {
        MixVolumeCurve::Smooth => {
            let angle = progress * std::f32::consts::FRAC_PI_2;
            (angle.cos(), angle.sin())
        }
        MixVolumeCurve::Overlap => {
            let rise = if transition.preset == MixPreset::Rise {
                progress.sqrt()
            } else {
                progress
            };
            (1.0 - rise * 0.7, 0.35 + rise * 0.65)
        }
        MixVolumeCurve::Cut => {
            if progress < 0.5 {
                (1.0, 0.0)
            } else {
                (0.0, 1.0)
            }
        }
    }
}

fn shape_incoming(
    sample: f32,
    low: &mut f32,
    previous: &mut f32,
    alpha: f32,
    transition: &MixTransition,
    progress: f32,
) -> f32 {
    *low += alpha * (sample - *low);
    let high = sample - *low;
    let prior = *previous;
    *previous = sample;
    let eq = match transition.eq_curve {
        MixEqCurve::None => sample,
        MixEqCurve::CenterBass => *low * (0.65 + progress * 0.35) + high,
        MixEqCurve::EndBassSwap => *low * progress + high,
        MixEqCurve::ThreeBandFade => *low * progress + high * (0.5 + progress * 0.5),
    };
    match transition.effect {
        MixEffect::None => eq,
        MixEffect::LowPass => *low,
        MixEffect::HighPass => eq - prior + *low * 0.05,
    }
}

#[cfg(test)]
mod tests {
    use super::{render_transition, KeyLockedTempo};
    use crate::audio::engine::{MixEffect, MixEqCurve, MixPreset, MixTransition, MixVolumeCurve};

    fn transition() -> MixTransition {
        MixTransition {
            from_video_id: "one".to_string(),
            to_video_id: "two".to_string(),
            preset: MixPreset::Blend,
            bars: 4,
            volume_curve: MixVolumeCurve::Smooth,
            eq_curve: MixEqCurve::EndBassSwap,
            effect: MixEffect::LowPass,
            beat_offset_ms: 0.0,
            from_bpm: Some(120.0),
            to_bpm: Some(128.0),
        }
    }

    #[test]
    fn rejects_pcm_with_an_incomplete_frame() {
        let mut processor = KeyLockedTempo::new(2, 48_000).unwrap();
        assert!(processor.render(&[0.0], 1.0).is_err());
    }

    #[test]
    fn renders_single_pcm_transition_with_tempo_lock() {
        let rendered = render_transition(
            &vec![0.25; 48_000],
            &vec![0.5; 64_000],
            1,
            48_000,
            1.0,
            &transition(),
            true,
        )
        .unwrap();
        assert_eq!(rendered.pcm.len(), 48_000);
        assert!(rendered.incoming_offset_seconds > 0.8);
    }
}
