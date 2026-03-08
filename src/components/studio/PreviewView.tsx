import { useState, useRef, useCallback } from 'react';
import { Play, Download, MonitorPlay, Image, Mic, Clock, Film, Square, Loader2, Music, Volume2 } from 'lucide-react';
import { Scene, BackgroundMusic } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import MiniTimeline from './MiniTimeline';
import { useTranslation } from '@/i18n/LanguageContext';
import { renderVideo, playPreview, RenderProgress } from '@/lib/videoRenderer';
import { toast } from 'sonner';

interface PreviewViewProps {
  scenes: Scene[];
  backgroundMusic?: BackgroundMusic;
}

export default function PreviewView({ scenes, backgroundMusic }: PreviewViewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);

  const readyImages = scenes.filter(s => s.image.status === 'completed').length;
  const readyAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const readyPercent = scenes.length > 0
    ? ((readyImages + readyAudios) / (scenes.length * 2)) * 100
    : 0;
  const hasBgMusic = backgroundMusic?.url && backgroundMusic.status === 'ready';

  const startBgMusic = useCallback(() => {
    if (!hasBgMusic || !backgroundMusic?.url) return;
    const audio = new Audio(backgroundMusic.url);
    audio.volume = 0;
    audio.loop = backgroundMusic.loop;
    audio.play().catch(() => {});
    
    // Fade in
    const fadeIn = backgroundMusic.fadeIn || 2;
    const targetVol = backgroundMusic.volume || 0.15;
    const steps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      audio.volume = Math.min(targetVol, (step / steps) * targetVol);
      if (step >= steps) clearInterval(interval);
    }, (fadeIn * 1000) / steps);

    bgMusicRef.current = audio;
  }, [backgroundMusic, hasBgMusic]);

  const stopBgMusic = useCallback(() => {
    const audio = bgMusicRef.current;
    if (!audio) return;
    const fadeOut = backgroundMusic?.fadeOut || 3;
    const startVol = audio.volume;
    const steps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(interval);
        audio.pause();
        audio.currentTime = 0;
        bgMusicRef.current = null;
      }
    }, (fadeOut * 1000) / steps);
  }, [backgroundMusic]);

  const handlePlay = useCallback(async () => {
    if (!canvasRef.current || scenes.length === 0) return;
    if (isPlaying && cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
      stopBgMusic();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const canvas = canvasRef.current;
    canvas.width = 1280;
    canvas.height = 720;

    startBgMusic();

    const cancel = await playPreview(canvas, scenes, setProgress, () => {
      stopBgMusic();
      setIsPlaying(false);
      setProgress(null);
    });
    cancelRef.current = cancel;
  }, [scenes, isPlaying, startBgMusic, stopBgMusic]);

  const handleRender = useCallback(async () => {
    if (scenes.length === 0) return;
    setIsRendering(true);
    toast.info(t.renderingVideo);
    try {
      const blob = await renderVideo(scenes, setProgress, { width: 1920, height: 1080, fps: 30 });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video.webm';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t.renderComplete);
    } catch (err) {
      console.error(err);
      toast.error('Render failed');
    } finally {
      setIsRendering(false);
      setProgress(null);
    }
  }, [scenes, t]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <MonitorPlay className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">{t.previewAndRender}</h2>
        {hasBgMusic && (
          <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary">
            <Music className="w-2.5 h-2.5" /> {t.backgroundMusic}
          </Badge>
        )}
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="aspect-video bg-muted/10 flex items-center justify-center relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ display: isPlaying ? 'block' : 'none' }}
          />
          {!isPlaying && (
            <div className="text-center text-muted-foreground/40 relative z-10">
              <Film className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-semibold text-foreground/60">{t.videoPreview}</p>
              <p className="text-sm mt-1">
                {scenes.length === 0
                  ? t.generateScenesFirst
                  : t.imagesAndAudios(readyImages, scenes.length, readyAudios)
                }
              </p>
              {readyPercent > 0 && readyPercent < 100 && (
                <div className="mt-4 w-48 mx-auto">
                  <Progress value={readyPercent} className="h-1.5" />
                  <p className="text-[10px] mt-1 text-muted-foreground">{t.assetsReady(Math.round(readyPercent))}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {(progress && (isPlaying || isRendering)) && (
        <div className="glass-panel rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.phase === 'loading' ? t.loadingAssets
                : progress.phase === 'rendering' ? t.renderingScene(progress.currentScene, progress.totalScenes)
                : progress.phase === 'encoding' ? t.encodingVideo
                : t.renderComplete}
            </span>
            <span className="font-mono text-primary">{Math.round(progress.percent)}%</span>
          </div>
          <Progress value={progress.percent} className="h-1.5" />
        </div>
      )}

      {scenes.length > 0 && <MiniTimeline scenes={scenes} />}

      <div className="flex items-center gap-3 justify-center">
        <Button
          size="lg"
          className="gap-2 glow-primary"
          disabled={readyImages === 0 || isRendering}
          onClick={handlePlay}
        >
          {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? t.stopPreview : t.playPreview}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          disabled={readyImages === 0 || isPlaying || isRendering}
          onClick={handleRender}
        >
          {isRendering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {isRendering ? t.renderingVideo : t.renderVideo}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Film, label: t.scenesLabel, value: scenes.length },
          { icon: Image, label: t.imagesLabel, value: `${readyImages}/${scenes.length}` },
          { icon: Mic, label: t.audiosLabel, value: `${readyAudios}/${scenes.length}` },
          { icon: Clock, label: t.durationLabel, value: `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')}` },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel rounded-lg p-4 text-center">
              <Icon className="w-4 h-4 mx-auto mb-2 text-primary/60" />
              <p className="text-xl font-bold text-gradient-primary">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
