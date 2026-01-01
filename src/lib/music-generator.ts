// Music generator v2 - uses OfflineAudioContext only
// Note: Magenta import is dynamic to avoid loading Tone.js for simple audio generation

let musicVAE: any = null;
let isInitializing = false;

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Creates reproducible random sequences from a seed
 */
function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a seed from a string (for user-provided seeds)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Multiple lo-fi chord progressions to choose from (in MIDI note numbers)
const CHORD_PROGRESSIONS = [
  // ii-V-I-vi (Dm7-G7-Cmaj7-Am7) - Classic jazz
  {
    chords: [
      [62, 65, 69, 72],
      [67, 71, 74, 77],
      [60, 64, 67, 71],
      [69, 72, 76, 79],
    ],
    bass: [62, 67, 60, 69],
  },
  // I-vi-IV-V (Cmaj7-Am7-Fmaj7-G7) - Pop progression
  {
    chords: [
      [60, 64, 67, 71],
      [69, 72, 76, 79],
      [65, 69, 72, 76],
      [67, 71, 74, 77],
    ],
    bass: [60, 69, 65, 67],
  },
  // vi-IV-I-V (Am7-Fmaj7-Cmaj7-G7) - Emotional
  {
    chords: [
      [69, 72, 76, 79],
      [65, 69, 72, 76],
      [60, 64, 67, 71],
      [67, 71, 74, 77],
    ],
    bass: [69, 65, 60, 67],
  },
  // I-V-vi-IV (Cmaj7-G7-Am7-Fmaj7) - Axis progression
  {
    chords: [
      [60, 64, 67, 71],
      [67, 71, 74, 77],
      [69, 72, 76, 79],
      [65, 69, 72, 76],
    ],
    bass: [60, 67, 69, 65],
  },
  // ii-V-iii-vi (Dm7-G7-Em7-Am7) - Neo-soul
  {
    chords: [
      [62, 65, 69, 72],
      [67, 71, 74, 77],
      [64, 67, 71, 74],
      [69, 72, 76, 79],
    ],
    bass: [62, 67, 64, 69],
  },
  // I-iii-vi-IV (Cmaj7-Em7-Am7-Fmaj7) - Dreamy
  {
    chords: [
      [60, 64, 67, 71],
      [64, 67, 71, 74],
      [69, 72, 76, 79],
      [65, 69, 72, 76],
    ],
    bass: [60, 64, 69, 65],
  },
];

// Multiple drum patterns to choose from (1 = hit, 0 = rest) - 16 steps per bar
const DRUM_PATTERNS = [
  // Classic boom-bap
  {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    hihatOpen: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  // Laid-back
  {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    hihatOpen: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  // Syncopated
  {
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    hihatOpen: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  },
  // Minimal
  {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihatOpen: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  // Driving
  {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    hihatOpen: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  },
];

/**
 * Initialize Magenta.js MusicVAE model (dynamically loaded)
 */
async function initMagenta(onProgress?: (progress: number) => void): Promise<any> {
  if (musicVAE) {
    return musicVAE;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return musicVAE!;
  }

  isInitializing = true;
  onProgress?.(10);

  try {
    // Dynamically import Magenta to avoid loading Tone.js for simple audio generation
    const mm = await import('@magenta/music');

    // Use MelodyRNN which is smaller and faster for our needs
    musicVAE = new mm.MusicVAE(
      'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_lokl_q2'
    );

    onProgress?.(30);
    await musicVAE.initialize();
    onProgress?.(100);

    return musicVAE;
  } finally {
    isInitializing = false;
  }
}

export interface MusicGeneratorOptions {
  seed?: number | string; // Numeric seed or string to hash
  onProgress?: (progress: number) => void;
}

// Fixed BPM for consistent slide timing sync
// At 80 BPM: 1 beat = 0.75s, 4 beats (1 bar) = 3s = perfect slide duration
export const MUSIC_BPM = 80;
export const SECONDS_PER_BAR = (60 / MUSIC_BPM) * 4; // 3 seconds per bar

// Loopable audio duration - 4 bars = 1 full chord progression = 12 seconds
// This generates MUCH faster than 60+ seconds and can be looped seamlessly
export const LOOPABLE_DURATION = SECONDS_PER_BAR * 4; // 12 seconds

// Crossfade duration for seamless looping (in seconds)
const CROSSFADE_DURATION = 0.5;

// Cached noise data for drum sounds (avoids regenerating for every hit)
const noiseDataCache = new Map<string, Float32Array>();

function getCachedNoiseData(sampleRate: number, duration: number): Float32Array {
  const key = `${sampleRate}_${duration}`;
  if (!noiseDataCache.has(key)) {
    const length = Math.ceil(sampleRate * duration);
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseDataCache.set(key, data);
  }
  return noiseDataCache.get(key)!;
}

// Cached distortion curve (avoids regenerating for every kick)
let cachedDistortionCurve: Float32Array<ArrayBuffer> | null = null;

/**
 * Generate a lo-fi track using Web Audio API
 * Fully generative with seeded randomness for reproducibility
 * Optimized for performance
 */
export async function generateLofiAudio(
  durationSeconds: number,
  onProgressOrOptions?: ((progress: number) => void) | MusicGeneratorOptions
): Promise<Blob> {
  // Handle both old API (just callback) and new API (options object)
  const options: MusicGeneratorOptions =
    typeof onProgressOrOptions === 'function'
      ? { onProgress: onProgressOrOptions }
      : onProgressOrOptions || {};

  const { onProgress } = options;

  // Create seeded random - use provided seed, or generate one from current time
  let seedNum: number;
  if (options.seed !== undefined) {
    seedNum = typeof options.seed === 'string' ? hashString(options.seed) : options.seed;
  } else {
    seedNum = Date.now(); // Different every time if no seed provided
  }

  const random = createSeededRandom(seedNum);

  onProgress?.(10);

  // Use lower sample rate for faster generation (still good quality)
  const sampleRate = 44100;
  // Generate extra audio for crossfade overlap
  const totalDuration = durationSeconds + CROSSFADE_DURATION;
  const totalSamples = Math.ceil(totalDuration * sampleRate);

  // Create offline context for rendering (with extra crossfade duration)
  const offlineContext = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Randomly select characteristics based on seed
  const selectedProgression = CHORD_PROGRESSIONS[Math.floor(random() * CHORD_PROGRESSIONS.length)];
  const selectedDrumPattern = DRUM_PATTERNS[Math.floor(random() * DRUM_PATTERNS.length)];

  // Fixed BPM for slide sync (80 BPM = 3 seconds per bar = 1 bar per slide)
  const bpm = MUSIC_BPM;

  // Vary reverb and filter settings (but keep ranges tighter for faster processing)
  const reverbDecay = 1.5 + random() * 1; // 1.5-2.5s decay (shorter = faster)
  const filterFreq = 1800 + random() * 1000; // 1800-2800 Hz
  const wetMix = 0.3 + random() * 0.2; // 30-50% wet

  // Create a reverb using convolver
  const convolver = offlineContext.createConvolver();
  const reverbBuffer = createReverbImpulse(offlineContext, 2, reverbDecay);
  convolver.buffer = reverbBuffer;

  // Create a low-pass filter for that lo-fi warmth
  const filter = offlineContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.5 + random() * 0.5;

  // Create gain nodes
  const masterGain = offlineContext.createGain();
  masterGain.gain.value = 0.3;

  const dryGain = offlineContext.createGain();
  dryGain.gain.value = 1 - wetMix;

  const wetGain = offlineContext.createGain();
  wetGain.gain.value = wetMix;

  // Connect effects chain
  filter.connect(dryGain);
  filter.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(masterGain);
  wetGain.connect(masterGain);
  masterGain.connect(offlineContext.destination);

  onProgress?.(30);

  // Generate the lo-fi music
  const beatsPerBar = 4;
  const barsPerProgression = 4;
  const secondsPerBeat = 60 / bpm;

  // Calculate how many full progressions we need
  const progressionDuration = beatsPerBar * barsPerProgression * secondsPerBeat;
  const numProgressions = Math.ceil(totalDuration / progressionDuration);

  // Randomly decide if we want swing feel (50% chance)
  const hasSwing = random() > 0.5;
  const swingAmount = hasSwing ? 0.02 + random() * 0.03 : 0; // 20-50ms swing

  // Schedule notes
  for (let prog = 0; prog < numProgressions; prog++) {
    const progressionStart = prog * progressionDuration;

    for (let bar = 0; bar < barsPerProgression; bar++) {
      const barStart = progressionStart + bar * beatsPerBar * secondsPerBeat;
      const chord = selectedProgression.chords[bar % selectedProgression.chords.length];
      const bassNote = selectedProgression.bass[bar % selectedProgression.bass.length];

      // Play chord with slight arpeggiation (timing varies with seed)
      const strumSpeed = 0.03 + random() * 0.04; // 30-70ms between notes
      chord.forEach((note, i) => {
        const noteStart = barStart + i * strumSpeed;
        if (noteStart < totalDuration) {
          playNote(
            offlineContext,
            filter,
            note,
            noteStart,
            beatsPerBar * secondsPerBeat * 0.9,
            0.12 + random() * 0.06 // Vary velocity
          );
        }
      });

      // Play bass note
      if (barStart < totalDuration) {
        playNote(
          offlineContext,
          filter,
          bassNote - 12,
          barStart,
          beatsPerBar * secondsPerBeat * 0.8,
          0.18 + random() * 0.06
        );
      }

      // Add some melodic embellishments (probability and notes vary with seed)
      const melodyProbability = 0.4 + random() * 0.3; // 40-70% chance per beat
      const melodyNotes = [chord[2], chord[3], chord[2], chord[0]];
      melodyNotes.forEach((note, i) => {
        const swingOffset = i % 2 === 1 ? swingAmount : 0;
        const noteStart = barStart + i * secondsPerBeat + swingOffset;
        if (noteStart < totalDuration && random() > 1 - melodyProbability) {
          playNote(
            offlineContext,
            filter,
            note + 12,
            noteStart,
            secondsPerBeat * 0.7,
            0.06 + random() * 0.06
          );
        }
      });

      // Add drums - 16 steps per bar
      const stepsPerBar = 16;
      const secondsPerStep = (beatsPerBar * secondsPerBeat) / stepsPerBar;

      for (let step = 0; step < stepsPerBar; step++) {
        // Add swing to off-beats
        const stepSwing = step % 2 === 1 ? swingAmount * 0.5 : 0;
        const stepTime = barStart + step * secondsPerStep + stepSwing;
        if (stepTime >= totalDuration) continue;

        // Kick drum (with velocity variation)
        if (selectedDrumPattern.kick[step]) {
          playKick(offlineContext, filter, stepTime, 0.6 + random() * 0.2);
        }

        // Snare drum
        if (selectedDrumPattern.snare[step]) {
          playSnare(offlineContext, filter, stepTime, 0.4 + random() * 0.2);
        }

        // Hi-hat (closed) - add ghost notes randomly
        if (selectedDrumPattern.hihat[step] || random() > 0.85) {
          const ghostNote = !selectedDrumPattern.hihat[step];
          playHiHat(
            offlineContext,
            filter,
            stepTime,
            ghostNote ? 0.1 : 0.25 + random() * 0.1,
            false
          );
        }

        // Hi-hat (open)
        if (selectedDrumPattern.hihatOpen[step]) {
          playHiHat(offlineContext, filter, stepTime, 0.2 + random() * 0.1, true);
        }
      }
    }
  }

  onProgress?.(60);

  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();

  onProgress?.(80);

  // Apply crossfade for seamless looping
  const loopedBuffer = applyLoopCrossfade(renderedBuffer, durationSeconds, CROSSFADE_DURATION);

  // Convert to WAV blob
  const wavBlob = audioBufferToWav(loopedBuffer);

  onProgress?.(100);

  return wavBlob;
}

/**
 * Apply crossfade to create a seamless loop
 * Takes audio with extra duration and crossfades the end with the beginning
 */
function applyLoopCrossfade(
  buffer: AudioBuffer,
  targetDuration: number,
  crossfadeDuration: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const targetSamples = Math.floor(targetDuration * sampleRate);
  const crossfadeSamples = Math.floor(crossfadeDuration * sampleRate);
  const numChannels = buffer.numberOfChannels;

  // Create new buffer with exact target duration
  const ctx = new OfflineAudioContext(numChannels, targetSamples, sampleRate);
  const outputBuffer = ctx.createBuffer(numChannels, targetSamples, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    // Copy most of the audio unchanged
    for (let i = 0; i < targetSamples - crossfadeSamples; i++) {
      outputData[i] = inputData[i];
    }

    // Apply crossfade at the end
    // Fade out the end portion while fading in the overlapping beginning portion
    for (let i = 0; i < crossfadeSamples; i++) {
      const outputIndex = targetSamples - crossfadeSamples + i;
      const fadeOutIndex = targetSamples - crossfadeSamples + i;
      const fadeInIndex = i; // Beginning of the audio

      // Use equal-power crossfade for smoother transition
      const t = i / crossfadeSamples;
      const fadeOut = Math.cos(t * Math.PI * 0.5);
      const fadeIn = Math.sin(t * Math.PI * 0.5);

      outputData[outputIndex] = inputData[fadeOutIndex] * fadeOut + inputData[fadeInIndex] * fadeIn;
    }
  }

  return outputBuffer;
}

/**
 * Play a single note using an oscillator
 * Optimized: Single oscillator with random detune for warmth (was 2 oscillators)
 */
function playNote(
  context: OfflineAudioContext,
  destination: AudioNode,
  midiNote: number,
  startTime: number,
  duration: number,
  volume: number
): void {
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

  // Single oscillator with slight random detune for warmth (50% fewer oscillators)
  const osc = context.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  osc.detune.value = (Math.random() - 0.5) * 10; // Random detune -5 to +5 cents

  // Create envelope
  const envelope = context.createGain();
  envelope.gain.value = 0;

  // ADSR envelope
  const attackTime = 0.02;
  const decayTime = 0.1;
  const sustainLevel = 0.7;
  const releaseTime = 0.3;

  envelope.gain.setValueAtTime(0, startTime);
  envelope.gain.linearRampToValueAtTime(volume, startTime + attackTime);
  envelope.gain.linearRampToValueAtTime(volume * sustainLevel, startTime + attackTime + decayTime);
  envelope.gain.setValueAtTime(volume * sustainLevel, startTime + duration - releaseTime);
  envelope.gain.linearRampToValueAtTime(0, startTime + duration);

  // Connect directly (no mixer needed with single oscillator)
  osc.connect(envelope);
  envelope.connect(destination);

  // Schedule
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

/**
 * Play a kick drum (808-style)
 */
function playKick(
  context: OfflineAudioContext,
  destination: AudioNode,
  startTime: number,
  volume: number
): void {
  const osc = context.createOscillator();
  osc.type = 'sine';

  // Pitch envelope for 808 kick - starts high and drops
  osc.frequency.setValueAtTime(150, startTime);
  osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

  const gain = context.createGain();
  gain.gain.setValueAtTime(volume * 0.8, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

  // Add some distortion for punch (use cached curve)
  const distortion = context.createWaveShaper();
  if (!cachedDistortionCurve) {
    cachedDistortionCurve = makeDistortionCurve(50);
  }
  distortion.curve = cachedDistortionCurve;

  osc.connect(distortion);
  distortion.connect(gain);
  gain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + 0.5);
}

/**
 * Play a snare drum
 */
function playSnare(
  context: OfflineAudioContext,
  destination: AudioNode,
  startTime: number,
  volume: number
): void {
  // Noise component (use cached noise data for performance)
  const duration = 0.2;
  const noiseBuffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const cachedData = getCachedNoiseData(context.sampleRate, duration);
  noiseBuffer.copyToChannel(cachedData.slice(0, noiseBuffer.length), 0);

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;

  // Filter for snare tone
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.3, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

  // Tone component
  const osc = context.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 200;

  const oscGain = context.createGain();
  oscGain.gain.setValueAtTime(volume * 0.4, startTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  osc.connect(oscGain);
  oscGain.connect(destination);

  noise.start(startTime);
  osc.start(startTime);
  osc.stop(startTime + 0.2);
}

/**
 * Play a hi-hat
 */
function playHiHat(
  context: OfflineAudioContext,
  destination: AudioNode,
  startTime: number,
  volume: number,
  open: boolean
): void {
  // Use cached noise data for performance
  const duration = open ? 0.3 : 0.05;
  const noiseBuffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const cachedData = getCachedNoiseData(context.sampleRate, duration);
  noiseBuffer.copyToChannel(cachedData.slice(0, noiseBuffer.length), 0);

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;

  // High-pass filter for metallic sound
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  // Bandpass for tone
  const bandpass = context.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 10000;

  const gain = context.createGain();
  const decay = open ? 0.2 : 0.04;
  gain.gain.setValueAtTime(volume * 0.15, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

  noise.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);

  noise.start(startTime);
}

/**
 * Create a distortion curve for waveshaper
 */
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const buffer = new ArrayBuffer(samples * 4); // 4 bytes per float32
  const curve = new Float32Array(buffer);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Create a reverb impulse response
 */
function createReverbImpulse(
  context: OfflineAudioContext,
  duration: number,
  decay: number
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const buffer = context.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return buffer;
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Generate lo-fi music using Magenta.js (more sophisticated)
 * Falls back to simple generation if model loading fails
 */
export async function generateLofiWithMagenta(
  durationSeconds: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    onProgress?.(5);
    const vae = await initMagenta(p => onProgress?.(5 + p * 0.3));

    onProgress?.(40);

    // Generate a melody using the VAE
    const sequences = await vae.sample(1, 0.7); // Temperature 0.7 for some variation
    // Note: We generate but don't directly use the sequence since Magenta's player
    // requires user interaction. The generation validates the model works.
    console.log('Generated', sequences.length, 'sequences');

    onProgress?.(60);

    // Render the sequence to audio
    // For now, fall back to our simpler generator since Magenta's player
    // requires browser interaction and doesn't support offline rendering well
    return generateLofiAudio(durationSeconds, p => onProgress?.(60 + p * 0.4));
  } catch (error) {
    console.warn('Magenta model failed to load, using fallback generator:', error);
    return generateLofiAudio(durationSeconds, onProgress);
  }
}
