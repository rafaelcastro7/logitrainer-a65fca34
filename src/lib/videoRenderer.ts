import { Scene, TransitionType as SceneTransitionType } from '@/types/project';

export interface RenderProgress {
  phase: 'loading' | 'rendering' | 'encoding' | 'done';
  currentScene: number;
  totalScenes: number;
  percent: number;
}

export type TransitionType = 'fade' | 'wipe_left' | 'wipe_right' | 'dissolve' | 'slide_up';
export type ProgressCallback = (progress: RenderProgress) => void;

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  animation: Scene['animation'],
  progress: number
) {
  const scale = 1 + animation.intensity * progress;
  const dw = width * scale;
  const dh = height * scale;

  let dx = (width - dw) / 2;
  let dy = (height - dh) / 2;

  switch (animation.type) {
    case 'zoom_in':
      dx = (width - dw) / 2;
      dy = (height - dh) / 2;
      break;
    case 'zoom_out': {
      const s = 1 + animation.intensity - animation.intensity * progress;
      const odw = width * s;
      const odh = height * s;
      dx = (width - odw) / 2;
      dy = (height - odh) / 2;
      ctx.drawImage(img, dx, dy, odw, odh);
      return;
    }
    case 'pan_left':
      dx = -dw * progress * animation.intensity * 0.3;
      dy = (height - dh) / 2;
      break;
    case 'pan_right':
      dx = dw * progress * animation.intensity * 0.3 - (dw - width);
      dy = (height - dh) / 2;
      break;
    case 'static':
    default:
      ctx.drawImage(img, 0, 0, width, height);
      return;
  }

  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, width: number, height: number, scene?: Scene) {
  // Draw text overlay if enabled
  const overlay = scene?.textOverlay;
  if (overlay?.enabled && overlay.text.trim()) {
    drawTextOverlay(ctx, overlay.text, width, height, overlay.position, overlay.style);
  }

  // Draw subtitle from script
  if (!text.trim()) return;
  
  ctx.save();
  const fontSize = Math.max(16, Math.floor(width / 40));
  ctx.font = `600 ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const maxWidth = width * 0.85;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const visibleLines = lines.slice(-2);
  const lineHeight = fontSize * 1.4;
  const blockHeight = visibleLines.length * lineHeight + 20;
  const y = height - 30;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  const rx = width * 0.05;
  const ry = y - blockHeight;
  const rw = width * 0.9;
  const rh = blockHeight + 10;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 8);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  visibleLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, y - (visibleLines.length - 1 - i) * lineHeight);
  });

  ctx.restore();
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  position: 'top' | 'center' | 'bottom',
  style: 'title' | 'subtitle' | 'lower_third'
) {
  ctx.save();
  const fontSize = style === 'title' ? Math.floor(width / 20) : style === 'lower_third' ? Math.floor(width / 35) : Math.floor(width / 30);
  ctx.font = `${style === 'title' ? '700' : '600'} ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = style === 'lower_third' ? 'left' : 'center';

  const y = position === 'top' ? height * 0.15 : position === 'center' ? height * 0.5 : height * 0.82;

  if (style === 'lower_third') {
    // Lower third bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, y - fontSize, width * 0.5, fontSize * 2);
    ctx.fillStyle = 'hsl(234, 89%, 64%)';
    ctx.fillRect(0, y - fontSize, 4, fontSize * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, 20, y + fontSize * 0.3);
  } else {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(text, width / 2 + 2, y + 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, width / 2, y);
  }
  ctx.restore();
}

function drawTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: 'in' | 'out',
  type: TransitionType = 'fade'
) {
  const transitionDuration = 0.08;
  let alpha = 0;

  if (phase === 'in' && progress < transitionDuration) {
    alpha = 1 - progress / transitionDuration;
  } else if (phase === 'out' && progress > 1 - transitionDuration) {
    alpha = (progress - (1 - transitionDuration)) / transitionDuration;
  } else {
    return;
  }

  switch (type) {
    case 'wipe_left': {
      const wipeX = phase === 'in' ? width * (1 - alpha) : width * alpha;
      ctx.fillStyle = '#000000';
      if (phase === 'in') {
        ctx.fillRect(0, 0, width - wipeX, height);
      } else {
        ctx.fillRect(width - wipeX, 0, wipeX, height);
      }
      break;
    }
    case 'wipe_right': {
      const wipeX = phase === 'in' ? width * alpha : width * (1 - alpha);
      ctx.fillStyle = '#000000';
      if (phase === 'in') {
        ctx.fillRect(wipeX, 0, width - wipeX, height);
      } else {
        ctx.fillRect(0, 0, width - wipeX, height);
      }
      break;
    }
    case 'slide_up': {
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      const slideY = height * alpha;
      ctx.fillRect(0, height - slideY, width, slideY);
      break;
    }
    case 'dissolve': {
      // Pixelated dissolve
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.9})`;
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case 'fade':
    default: {
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }
}

// Scene-level transition type selection — use scene's own transition if set
function getTransitionType(scene: Scene, _sceneIndex: number): TransitionType {
  if (scene.transition && scene.transition !== 'none') return scene.transition as TransitionType;
  if (scene.transition === 'none') return 'fade'; // still need minimal transition
  const types: TransitionType[] = ['fade', 'wipe_left', 'dissolve', 'slide_up', 'wipe_right'];
  return types[_sceneIndex % types.length];
}

export async function renderVideo(
  scenes: Scene[],
  onProgress: ProgressCallback,
  options: { width?: number; height?: number; fps?: number } = {}
): Promise<Blob> {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const fps = options.fps || 30;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  onProgress({ phase: 'loading', currentScene: 0, totalScenes: scenes.length, percent: 0 });
  const images: (HTMLImageElement | null)[] = [];
  for (let i = 0; i < scenes.length; i++) {
    onProgress({ phase: 'loading', currentScene: i + 1, totalScenes: scenes.length, percent: (i / scenes.length) * 20 });
    try {
      if (scenes[i].image.url) {
        images.push(await loadImage(scenes[i].image.url!));
      } else {
        images.push(null);
      }
    } catch {
      images.push(null);
    }
  }

  const audioElements: (HTMLAudioElement | null)[] = scenes.map(s => {
    if (s.audio.url) {
      const audio = new Audio(s.audio.url);
      audio.crossOrigin = 'anonymous';
      return audio;
    }
    return null;
  });

  const stream = canvas.captureStream(fps);
  const audioCtx = new AudioContext();
  const destination = audioCtx.createMediaStreamDestination();
  destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    mediaRecorder.onerror = reject;
    mediaRecorder.onstop = () => {
      onProgress({ phase: 'done', currentScene: scenes.length, totalScenes: scenes.length, percent: 100 });
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };

    mediaRecorder.start();

    let sceneIndex = 0;
    let frameInScene = 0;

    const renderFrame = () => {
      if (sceneIndex >= scenes.length) {
        mediaRecorder.stop();
        audioCtx.close();
        return;
      }

      const scene = scenes[sceneIndex];
      const totalFrames = scene.duration * fps;
      const progress = frameInScene / totalFrames;
      const transType = getTransitionType(scene, sceneIndex);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const img = images[sceneIndex];
      if (img) {
        drawKenBurns(ctx, img, width, height, scene.animation, progress);
      } else {
        const grd = ctx.createLinearGradient(0, 0, width, height);
        grd.addColorStop(0, '#1a1a2e');
        grd.addColorStop(1, '#16213e');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = `bold ${width / 20}px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(scene.name, width / 2, height / 2);
      }

      drawSubtitle(ctx, scene.script, width, height, scene);
      drawTransition(ctx, width, height, progress, 'in', transType);
      drawTransition(ctx, width, height, progress, 'out', transType);

      const completedFrames = scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.duration * fps, 0) + frameInScene;
      const totalFramesAll = scenes.reduce((s, sc) => s + sc.duration * fps, 0);
      onProgress({
        phase: 'rendering',
        currentScene: sceneIndex + 1,
        totalScenes: scenes.length,
        percent: 20 + (completedFrames / totalFramesAll) * 75,
      });

      frameInScene++;
      if (frameInScene >= totalFrames) {
        sceneIndex++;
        frameInScene = 0;
        if (sceneIndex < scenes.length && audioElements[sceneIndex]) {
          try {
            const source = audioCtx.createMediaElementSource(audioElements[sceneIndex]!);
            source.connect(destination);
            audioElements[sceneIndex]!.play().catch(() => {});
          } catch {}
        }
      }

      requestAnimationFrame(renderFrame);
    };

    if (audioElements[0]) {
      try {
        const source = audioCtx.createMediaElementSource(audioElements[0]);
        source.connect(destination);
        audioElements[0].play().catch(() => {});
      } catch {}
    }

    renderFrame();
  });
}

export async function playPreview(
  canvas: HTMLCanvasElement,
  scenes: Scene[],
  onProgress: ProgressCallback,
  onComplete: () => void
): Promise<() => void> {
  const ctx = canvas.getContext('2d')!;
  const width = canvas.width;
  const height = canvas.height;
  const fps = 30;
  let cancelled = false;

  const images: (HTMLImageElement | null)[] = [];
  for (const scene of scenes) {
    try {
      if (scene.image.url) images.push(await loadImage(scene.image.url));
      else images.push(null);
    } catch {
      images.push(null);
    }
  }

  const audioElements: (HTMLAudioElement | null)[] = scenes.map(s => {
    if (s.audio.url) return new Audio(s.audio.url);
    return null;
  });

  let sceneIndex = 0;
  let frameInScene = 0;

  const render = () => {
    if (cancelled || sceneIndex >= scenes.length) {
      audioElements.forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
      onComplete();
      return;
    }

    const scene = scenes[sceneIndex];
    const totalFrames = scene.duration * fps;
    const progress = frameInScene / totalFrames;
    const transType = getTransitionType(scene, sceneIndex);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const img = images[sceneIndex];
    if (img) {
      drawKenBurns(ctx, img, width, height, scene.animation, progress);
    }

    drawSubtitle(ctx, scene.script, width, height, scene);
    drawTransition(ctx, width, height, progress, 'in', transType);
    drawTransition(ctx, width, height, progress, 'out', transType);

    const completedFrames = scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.duration * fps, 0) + frameInScene;
    const totalFramesAll = scenes.reduce((s, sc) => s + sc.duration * fps, 0);
    onProgress({
      phase: 'rendering',
      currentScene: sceneIndex + 1,
      totalScenes: scenes.length,
      percent: (completedFrames / totalFramesAll) * 100,
    });

    frameInScene++;
    if (frameInScene >= totalFrames) {
      if (audioElements[sceneIndex]) {
        audioElements[sceneIndex]!.pause();
        audioElements[sceneIndex]!.currentTime = 0;
      }
      sceneIndex++;
      frameInScene = 0;
      if (sceneIndex < scenes.length && audioElements[sceneIndex]) {
        audioElements[sceneIndex]!.play().catch(() => {});
      }
    }

    setTimeout(() => requestAnimationFrame(render), 1000 / fps);
  };

  if (audioElements[0]) audioElements[0].play().catch(() => {});
  render();

  return () => {
    cancelled = true;
    audioElements.forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
  };
}
