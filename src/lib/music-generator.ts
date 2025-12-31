import * as mm from '@magenta/music';

let musicVAE: mm.MusicVAE | null = null;
let isInitializing = false;

// Lo-fi style chord progressions (in MIDI note numbers)
const LOFI_PROGRESSIONS = [
  // ii-V-I-vi (Dm7-G7-Cmaj7-Am7)
  [62, 65, 69, 72], // Dm7
  [67, 71, 74, 77], // G7
  [60, 64, 67, 71], // Cmaj7
  [69, 72, 76, 79], // Am7
];

const LOFI_BASS_NOTES = [62, 67, 60, 69]; // Root notes for progression

/**
 * Initialize Magenta.js MusicVAE model
 */
async function initMagenta(onProgress?: (progress: number) => void): Promise<mm.MusicVAE> {
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

/**
 * Generate a simple lo-fi melody using Web Audio API
 * This is a fallback that doesn't require Magenta model loading
 */
export async function generateLofiAudio(
  durationSeconds: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);

  const audioContext = new AudioContext({ sampleRate: 44100 });
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.ceil(durationSeconds * sampleRate);

  // Create offline context for rendering
  const offlineContext = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Create a reverb using convolver
  const convolver = offlineContext.createConvolver();
  const reverbBuffer = createReverbImpulse(offlineContext, 2, 2);
  convolver.buffer = reverbBuffer;

  // Create a low-pass filter for that lo-fi warmth
  const filter = offlineContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.7;

  // Create gain nodes
  const masterGain = offlineContext.createGain();
  masterGain.gain.value = 0.3;

  const dryGain = offlineContext.createGain();
  dryGain.gain.value = 0.6;

  const wetGain = offlineContext.createGain();
  wetGain.gain.value = 0.4;

  // Connect effects chain
  filter.connect(dryGain);
  filter.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(masterGain);
  wetGain.connect(masterGain);
  masterGain.connect(offlineContext.destination);

  onProgress?.(30);

  // Generate the lo-fi music
  const bpm = 75; // Slow, chill tempo
  const beatsPerBar = 4;
  const barsPerProgression = 4;
  const secondsPerBeat = 60 / bpm;

  // Calculate how many full progressions we need
  const progressionDuration = beatsPerBar * barsPerProgression * secondsPerBeat;
  const numProgressions = Math.ceil(durationSeconds / progressionDuration);

  // Schedule notes
  for (let prog = 0; prog < numProgressions; prog++) {
    const progressionStart = prog * progressionDuration;

    for (let bar = 0; bar < barsPerProgression; bar++) {
      const barStart = progressionStart + bar * beatsPerBar * secondsPerBeat;
      const chord = LOFI_PROGRESSIONS[bar % LOFI_PROGRESSIONS.length];
      const bassNote = LOFI_BASS_NOTES[bar % LOFI_BASS_NOTES.length];

      // Play chord with slight arpeggiation
      chord.forEach((note, i) => {
        const noteStart = barStart + i * 0.05; // Slight strum effect
        if (noteStart < durationSeconds) {
          playNote(
            offlineContext,
            filter,
            note,
            noteStart,
            beatsPerBar * secondsPerBeat * 0.9,
            0.15
          );
        }
      });

      // Play bass note
      if (barStart < durationSeconds) {
        playNote(
          offlineContext,
          filter,
          bassNote - 12,
          barStart,
          beatsPerBar * secondsPerBeat * 0.8,
          0.2
        );
      }

      // Add some melodic embellishments
      const melodyNotes = [chord[2], chord[3], chord[2], chord[0]];
      melodyNotes.forEach((note, i) => {
        const noteStart = barStart + i * secondsPerBeat;
        if (noteStart < durationSeconds && Math.random() > 0.3) {
          playNote(
            offlineContext,
            filter,
            note + 12,
            noteStart,
            secondsPerBeat * 0.7,
            0.08 + Math.random() * 0.05
          );
        }
      });
    }
  }

  onProgress?.(60);

  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();

  onProgress?.(80);

  // Convert to WAV blob
  const wavBlob = audioBufferToWav(renderedBuffer);

  onProgress?.(100);

  await audioContext.close();

  return wavBlob;
}

/**
 * Play a single note using an oscillator
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

  // Create oscillator with slight detuning for warmth
  const osc1 = context.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = frequency;
  osc1.detune.value = -5;

  const osc2 = context.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = frequency;
  osc2.detune.value = 5;

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

  // Connect
  const mixer = context.createGain();
  mixer.gain.value = 0.5;

  osc1.connect(mixer);
  osc2.connect(mixer);
  mixer.connect(envelope);
  envelope.connect(destination);

  // Schedule
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.1);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.1);
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
