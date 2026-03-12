import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, Download, MonitorPlay, Image, Mic, Clock, Film, Square, Loader2, Music, Volume2, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { Scene, BackgroundMusic, AspectRatio, ExportQuality, ASPECT_RATIO_DIMENSIONS, EXPORT_QUALITIES } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MiniTimeline from './MiniTimeline';
import { useTranslation } from '@/i18n/LanguageContext';
import { renderVideo, playPreview, RenderProgress } from '@/lib/videoRenderer';
import { toast } from 'sonner';

interface PreviewViewProps {
  scenes: Scene[];
  backgroundMusic?: BackgroundMusic;
  aspectRatio?: AspectRatio;
}

export default function PreviewView({ scenes, backgroundMusic, aspectRatio = '16:9' }: PreviewViewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [exportQuality, setExportQuality] = useState<ExportQuality>('1080p');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const readyImages = scenes.filter(s => s.image.status === 'completed').length;
  const readyAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const readyPercent = scenes.length > 0
    ? ((readyImages + readyAudios) / (scenes.length * 2)) * 100
    : 0;
  const hasBgMusic = backgroundMusic?.url && backgroundMusic.status === 'ready';

  const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[60vh]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  const currentTime = progress ? (progress.percent / 100) * totalDuration : 0;

  const startBgMusic = useCallback(() => {
    if (!hasBgMusic || !backgroundMusic?.url) return;
    const audio = new Audio(backgroundMusic.url);
    audio.volume = 0;
    audio.loop = backgroundMusic.loop;
    audio.play().catch(() => {});
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
    canvas.width = dims.width;
    canvas.height = dims.height;
    startBgMusic();

    const cancel = await playPreview(canvas, scenes, (p) => {
      setProgress(p);
      if (p.currentScene !== currentSceneIndex) setCurrentSceneIndex(p.currentScene - 1);
    }, () => {
      stopBgMusic();
      setIsPlaying(false);
      setProgress(null);
      setCurrentSceneIndex(0);
    });
    cancelRef.current = cancel;
  }, [scenes, isPlaying, startBgMusic, stopBgMusic, dims, currentSceneIndex]);

  const handleRender = useCallback(async () => {
    if (scenes.length === 0) return;
    setIsRendering(true);
    toast.info(t.renderingVideo);
    const qualityConfig = EXPORT_QUALITIES[exportQuality];
    const width = Math.round(dims.width * qualityConfig.scale);
    const height = Math.round(dims.height * qualityConfig.scale);
    try {
      const blob = await renderVideo(scenes, setProgress, { width, height, fps: 30 });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${exportQuality}.webm`;
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
  }, [scenes, t, exportQuality, dims]);

  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <MonitorPlay className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">{t.previewAndRender}</h2>
        <Badge variant="outline" className="text-[10px] gap-1">
          {aspectRatio}
        </Badge>
        {hasBgMusic && (
          <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary">
            <Music className="w-2.5 h-2.5" /> {t.backgroundMusic}
          </Badge>
        )}
      </div>

      {/* Player Container */}
      <div ref={containerRef} className="glass-panel rounded-xl overflow-hidden">
        <div className={`${aspectClass} bg-muted/10 flex items-center justify-center relative mx-auto max-w-full`}>
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
                  : t.imagesAndAudios(readyImages, scenes.length, readyAudios)}
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

        {/* Player Controls Bar */}
        {scenes.length > 0 && (
          <div className="px-4 py-3 border-t border-border/30 bg-card/50 space-y-2">
            {/* Seek bar */}
            <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden cursor-pointer group">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress?.percent || 0}%` }}
              />
              {/* Scene markers */}
              {scenes.reduce<{ offset: number; markers: { pos: number; name: string }[] }>((acc, scene) => {
                const pos = totalDuration > 0 ? (acc.offset / totalDuration) * 100 : 0;
                acc.markers.push({ pos, name: scene.name });
                acc.offset += scene.duration;
                return acc;
              }, { offset: 0, markers: [] }).markers.map((m, i) => (
                i > 0 && <div
                  key={i}
                  className="absolute top-0 h-full w-[2px] bg-border/60"
                  style={{ left: `${m.pos}%` }}
                />
              ))}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={currentSceneIndex === 0 || !isPlaying}
                onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
              >
                <SkipBack className="w-3.5 h-3.5" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={readyImages === 0 || isRendering}
                onClick={handlePlay}
              >
                {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={currentSceneIndex >= scenes.length - 1 || !isPlaying}
                onClick={() => setCurrentSceneIndex(Math.min(scenes.length - 1, currentSceneIndex + 1))}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </Button>

              <div className="text-xs font-mono text-muted-foreground min-w-[80px]">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>

              {isPlaying && scenes[currentSceneIndex] && (
                <span className="text-[11px] text-muted-foreground truncate flex-1">
                  {currentSceneIndex + 1}. {scenes[currentSceneIndex].name}
                </span>
              )}

              <div className="flex-1" />

              {hasBgMusic && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Volume2 className="w-3 h-3 text-primary/60" />
                  <span>BGM</span>
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleFullscreen}
              >
                <Maximize className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
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

      {/* Scene Thumbnail Strip */}
      {scenes.length > 0 && (
        <div className="glass-panel rounded-xl p-3 space-y-2">
          <p className="text-[11px] text-muted-foreground font-medium">Scene Navigator</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {scenes.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => setCurrentSceneIndex(i)}
                className={cn(
                  "shrink-0 rounded-lg border overflow-hidden transition-all",
                  currentSceneIndex === i
                    ? "ring-2 ring-primary border-primary/40 scale-105"
                    : "border-border/30 opacity-70 hover:opacity-100"
                )}
                style={{ width: 80 }}
              >
                <div className="aspect-video bg-muted/30 relative">
                  {scene.image.url ? (
                    <img src={scene.image.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[10px] font-mono text-muted-foreground/40">{i + 1}</span>
                    </div>
                  )}
                  {/* Status indicators */}
                  <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                    {scene.image.status === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                    {scene.audio.status === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground truncate px-1 py-0.5">{scene.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {scenes.length > 0 && <MiniTimeline scenes={scenes} activeSceneId={scenes[currentSceneIndex]?.id} />}

      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-center flex-wrap">
        <Button
          size="lg"
          className="gap-2 glow-primary"
          disabled={readyImages === 0 || isRendering}
          onClick={handlePlay}
        >
          {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? t.stopPreview : t.playPreview}
        </Button>

        <div className="flex items-center gap-2">
          <Select value={exportQuality} onValueChange={v => setExportQuality(v as ExportQuality)}>
            <SelectTrigger className="h-10 w-[140px] bg-card/80 border-border/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(EXPORT_QUALITIES) as [ExportQuality, { label: string }][]).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Film, label: t.scenesLabel, value: scenes.length },
          { icon: Image, label: t.imagesLabel, value: `${readyImages}/${scenes.length}` },
          { icon: Mic, label: t.audiosLabel, value: `${readyAudios}/${scenes.length}` },
          { icon: Clock, label: t.durationLabel, value: formatTime(totalDuration) },
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
