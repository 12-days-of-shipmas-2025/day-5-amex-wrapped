import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

/**
 * Initialize FFmpeg with WASM files from CDN
 */
async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(progress * 100);
  });

  // Load FFmpeg from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export interface CaptureFrame {
  dataUrl: string;
  duration: number; // Duration in seconds
}

// Video recording settings - synced to music at 80 BPM (3 seconds per bar)
export const VIDEO_FPS = 24; // Smooth video (film standard)
export const SLIDE_DURATION_SECONDS = 3; // 1 bar per slide at 80 BPM

// Real-time recording settings
export const REALTIME_FPS = 24; // Capture rate for real-time recording
export const FRAME_INTERVAL_MS = 1000 / REALTIME_FPS;

/**
 * Export frames to MP4 video
 */
export async function exportToVideo(
  frames: CaptureFrame[],
  audioBlob: Blob | null,
  onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {
  onProgress?.('Initializing encoder...', 0);
  const ff = await initFFmpeg(p => onProgress?.('Encoding video...', p));

  // Write frames to FFmpeg virtual filesystem
  onProgress?.('Processing frames...', 0);
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const response = await fetch(frame.dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    await ff.writeFile(`frame${i.toString().padStart(4, '0')}.png`, new Uint8Array(arrayBuffer));
    onProgress?.('Processing frames...', ((i + 1) / frames.length) * 100);
  }

  // Create a concat file for variable duration frames
  const concatContent = frames
    .map((frame, i) => {
      const filename = `frame${i.toString().padStart(4, '0')}.png`;
      return `file '${filename}'\nduration ${frame.duration}`;
    })
    .join('\n');

  // Add last frame again (FFmpeg concat demuxer quirk)
  const lastFrameFile = `frame${(frames.length - 1).toString().padStart(4, '0')}.png`;
  const fullConcatContent = concatContent + `\nfile '${lastFrameFile}'`;

  await ff.writeFile('concat.txt', fullConcatContent);

  // Write audio if provided
  if (audioBlob) {
    onProgress?.('Adding audio...', 0);
    const audioData = await audioBlob.arrayBuffer();
    await ff.writeFile('audio.mp3', new Uint8Array(audioData));
  }

  // Calculate total duration
  const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);

  onProgress?.('Encoding video...', 0);

  // Build FFmpeg command
  const command: string[] = ['-f', 'concat', '-safe', '0', '-i', 'concat.txt'];

  if (audioBlob) {
    command.push('-i', 'audio.mp3', '-c:a', 'aac', '-shortest');
  }

  command.push(
    '-vf',
    'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'ultrafast', // Faster encoding (was 'fast')
    '-crf',
    '28', // Lower quality for faster encoding (was 23)
    '-t',
    totalDuration.toString(),
    'output.mp4'
  );

  await ff.exec(command);

  // Read the output file
  onProgress?.('Finalizing...', 90);
  const data = await ff.readFile('output.mp4');
  // Convert FileData to a fresh Uint8Array backed by ArrayBuffer (not SharedArrayBuffer)
  let videoBytes: Uint8Array<ArrayBuffer>;
  if (data instanceof Uint8Array) {
    // Create a new Uint8Array with a fresh ArrayBuffer to avoid SharedArrayBuffer issues
    const newArray = new Uint8Array(data.length);
    newArray.set(data);
    videoBytes = newArray;
  } else {
    videoBytes = new TextEncoder().encode(data as string);
  }
  const videoBlob = new Blob([videoBytes], { type: 'video/mp4' });

  // Cleanup
  for (let i = 0; i < frames.length; i++) {
    await ff.deleteFile(`frame${i.toString().padStart(4, '0')}.png`);
  }
  await ff.deleteFile('concat.txt');
  if (audioBlob) {
    await ff.deleteFile('audio.mp3');
  }
  await ff.deleteFile('output.mp4');

  onProgress?.('Complete!', 100);
  return videoBlob;
}

// Instagram story dimensions (9:16 portrait)
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

/**
 * Create an off-screen container for rendering slides
 */
export function createOffscreenContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${STORY_WIDTH}px;
    height: ${STORY_HEIGHT}px;
    overflow: hidden;
    pointer-events: none;
    z-index: -1;
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * Remove the off-screen container
 */
export function removeOffscreenContainer(container: HTMLDivElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Capture an HTML element as a PNG data URL
 */
export async function captureElement(element: HTMLElement): Promise<string> {
  // Use html-to-image library (already in package.json)
  const { toPng } = await import('html-to-image');

  const dataUrl = await toPng(element, {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    pixelRatio: 1,
    backgroundColor: '#0c1929',
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
      width: `${STORY_WIDTH}px`,
      height: `${STORY_HEIGHT}px`,
    },
  });

  return dataUrl;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Real-time recorder that captures frames while playback happens
 */
export interface RealtimeRecorder {
  start: () => void;
  stop: () => Promise<CaptureFrame[]>;
  isRecording: boolean;
}

/**
 * Create a real-time recorder for an element
 * Records frames at a fixed interval while playing through content
 */
export function createRealtimeRecorder(
  getElement: () => HTMLElement | null,
  onProgress?: (frameCount: number) => void
): RealtimeRecorder {
  let frames: CaptureFrame[] = [];
  let intervalId: NodeJS.Timeout | null = null;
  let isRecording = false;
  let capturePromise: Promise<void> | null = null;

  const frameDuration = 1 / REALTIME_FPS;

  const captureFrame = async () => {
    const element = getElement();
    if (!element || !isRecording) return;

    // Wait for previous capture to complete to avoid overlap
    if (capturePromise) {
      await capturePromise;
    }

    capturePromise = (async () => {
      try {
        const dataUrl = await captureElement(element);
        frames.push({ dataUrl, duration: frameDuration });
        onProgress?.(frames.length);
      } catch (e) {
        console.warn('Frame capture failed:', e);
      }
    })();
  };

  return {
    get isRecording() {
      return isRecording;
    },

    start() {
      if (isRecording) return;
      isRecording = true;
      frames = [];

      // Capture frames at fixed interval
      intervalId = setInterval(captureFrame, FRAME_INTERVAL_MS);

      // Capture initial frame immediately
      captureFrame();
    },

    async stop(): Promise<CaptureFrame[]> {
      if (!isRecording) return frames;

      isRecording = false;

      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      // Wait for any pending capture
      if (capturePromise) {
        await capturePromise;
      }

      return frames;
    },
  };
}

/**
 * Record real-time playback and export to video
 * This plays through slides at normal speed and captures the actual animations
 */
export async function recordRealtimeToVideo(
  getElement: () => HTMLElement | null,
  slideCount: number,
  audioBlob: Blob | null,
  advanceSlide: () => void,
  onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {
  onProgress?.('Starting real-time recording...', 0);

  const totalDuration = slideCount * SLIDE_DURATION_SECONDS;
  const totalFramesExpected = totalDuration * REALTIME_FPS;

  // Create recorder
  const recorder = createRealtimeRecorder(getElement, frameCount => {
    const recordingProgress = (frameCount / totalFramesExpected) * 50;
    onProgress?.(`Recording... ${Math.round(frameCount / REALTIME_FPS)}s`, recordingProgress);
  });

  // Start recording
  recorder.start();

  // Play through all slides in real-time
  for (let i = 0; i < slideCount; i++) {
    // Wait for slide duration before advancing
    await new Promise(resolve => setTimeout(resolve, SLIDE_DURATION_SECONDS * 1000));

    // Advance to next slide (except on last slide)
    if (i < slideCount - 1) {
      advanceSlide();
    }
  }

  // Give a brief moment for final frame
  await new Promise(resolve => setTimeout(resolve, 100));

  // Stop recording and get frames
  const frames = await recorder.stop();

  onProgress?.('Processing recorded frames...', 50);

  // Export to video using existing function
  const videoBlob = await exportToVideo(frames, audioBlob, (stage, progress) => {
    onProgress?.(stage, 50 + progress * 0.5);
  });

  return videoBlob;
}
