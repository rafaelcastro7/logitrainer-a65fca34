import { useState, useRef, useCallback, useEffect } from 'react';
import { Scene } from '@/types/project';
import { cn } from '@/lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, Scissors, Volume2, 
  Image as ImageIcon, Mic, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface InteractiveTimelineProps {
  scenes: Scene[];
  activeSceneId?: string;
  onSceneClick?: (id: string) => void;
  isPlaying?: boolean;
  currentTime?: number;
  totalDuration?: number;
  onSeek?: (time: number) => void;
  onSplitScene?: (sceneId: string, splitTime: number) => void;
}

export default function InteractiveTimeline({ 
  scenes, activeSceneId, onSceneClick, isPlaying, 
  currentTime = 0, totalDuration: propDuration, onSeek, onSplitScene 
}: InteractiveTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [hoveredScene, setHoveredScene] = useState<string | null>(null);

  const totalDuration = propDuration || scenes.reduce((sum, s) => sum + s.duration, 0);
  const pixelsPerSecond = Math.max(8, 12 * zoom);
  const trackWidth = totalDuration * pixelsPerSecond;
  const playheadPos = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;

  const getTimeFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left + trackRef.current.scrollLeft) / trackRef.current.scrollWidth;
    return Math.max(0, Math.min(totalDuration, x * totalDuration));
  }, [totalDuration]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const time = getTimeFromMouse(e);
    onSeek?.(time);
  }, [getTimeFromMouse, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const time = getTimeFromMouse(e);
    setHoveredTime(time);
    if (isDragging) onSeek?.(time);
  }, [getTimeFromMouse, isDragging, onSeek]);

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  const getSceneAtTime = (time: number): { scene: Scene; localTime: number } | null => {
    let elapsed = 0;
    for (const scene of scenes) {
      if (time >= elapsed && time < elapsed + scene.duration) {
        return { scene, localTime: time - elapsed };
      }
      elapsed += scene.duration;
    }
    return null;
  };

  const handleSplit = () => {
    const info = getSceneAtTime(currentTime);
    if (info && info.localTime > 0.5 && info.localTime < info.scene.duration - 0.5) {
      onSplitScene?.(info.scene.id, info.localTime);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
  };

  if (scenes.length === 0) return null;

  // Generate time ruler marks
  const rulerInterval = zoom > 2 ? 1 : zoom > 1 ? 2 : 5;
  const rulerMarks: number[] = [];
  for (let t = 0; t <= totalDuration; t += rulerInterval) rulerMarks.push(t);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-card/30">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-muted-foreground w-20">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-muted-foreground">/</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatTime(totalDuration)}
          </span>
        </div>

        <div className="w-px h-4 bg-border/40" />

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ImageIcon className="w-2.5 h-2.5" />
            {completedImages}/{scenes.length}
          </span>
          <span className="flex items-center gap-1">
            <Mic className="w-2.5 h-2.5" />
            {completedAudios}/{scenes.length}
          </span>
        </div>

        <div className="flex-1" />

        {/* Split button */}
        {onSplitScene && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="sm" className="h-6 w-6 p-0"
                onClick={handleSplit}
              >
                <Scissors className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Split at playhead (S)</TooltipContent>
          </Tooltip>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost" size="sm" className="h-6 w-6 p-0"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground w-8 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost" size="sm" className="h-6 w-6 p-0"
            onClick={() => setZoom(z => Math.min(4, z + 0.25))}
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost" size="sm" className="h-6 w-6 p-0"
            onClick={() => setZoom(1)}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative overflow-x-auto" ref={trackRef}>
        {/* Time ruler */}
        <div className="h-5 relative bg-muted/20 border-b border-border/20" style={{ minWidth: `${trackWidth}px` }}>
          {rulerMarks.map(t => {
            const pos = totalDuration > 0 ? (t / totalDuration) * 100 : 0;
            return (
              <div key={t} className="absolute top-0 h-full" style={{ left: `${pos}%` }}>
                <div className="w-px h-2 bg-border/40" />
                <span className="text-[8px] font-mono text-muted-foreground/60 ml-0.5">
                  {Math.floor(t / 60)}:{String(Math.floor(t % 60)).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scene blocks */}
        <div 
          className="flex h-20 relative cursor-crosshair"
          style={{ minWidth: `${trackWidth}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoveredTime(null); setHoveredScene(null); }}
        >
          {scenes.map((scene, i) => {
            const widthPercent = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 100 / scenes.length;
            const isActive = scene.id === activeSceneId;
            const isHovered = scene.id === hoveredScene;

            return (
              <div
                key={scene.id}
                style={{ width: `${widthPercent}%`, minWidth: '24px' }}
                className={cn(
                  "relative h-full border-r border-border/20 transition-all group/scene",
                  isActive ? "ring-1 ring-inset ring-primary/60" : ""
                )}
                onMouseEnter={() => setHoveredScene(scene.id)}
                onClick={(e) => { e.stopPropagation(); onSceneClick?.(scene.id); }}
              >
                {/* Background image or gradient */}
                {scene.image.url ? (
                  <img 
                    src={scene.image.url} alt="" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60" 
                  />
                ) : (
                  <div className={cn(
                    "absolute inset-0",
                    i % 2 === 0 ? "bg-muted/20" : "bg-muted/30"
                  )} />
                )}

                {/* Scene info overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80 flex flex-col justify-between p-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono bg-background/60 px-1 rounded text-foreground/80">
                      {i + 1}
                    </span>
                    <span className="text-[9px] font-medium truncate text-foreground/80">
                      {scene.name}
                    </span>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        scene.image.status === 'completed' ? 'bg-success' :
                        scene.image.status === 'generating' ? 'bg-warning animate-pulse' :
                        'bg-muted-foreground/30'
                      )} />
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        scene.audio.status === 'completed' ? 'bg-success' :
                        scene.audio.status === 'generating' ? 'bg-warning animate-pulse' :
                        'bg-muted-foreground/30'
                      )} />
                    </div>
                    <span className="text-[8px] font-mono text-muted-foreground">
                      {scene.duration}s
                    </span>
                  </div>
                </div>

                {/* Audio waveform indicator */}
                {scene.audio.status === 'completed' && (
                  <div className="absolute bottom-0 inset-x-0 h-3 flex items-end gap-px px-0.5 opacity-40">
                    {Array.from({ length: Math.max(4, Math.floor(scene.duration * 2)) }).map((_, j) => (
                      <div
                        key={j}
                        className="flex-1 bg-primary/60 rounded-t-sm"
                        style={{ height: `${20 + Math.sin(j * 1.3) * 40 + Math.random() * 40}%` }}
                      />
                    ))}
                  </div>
                )}

                {/* Transition indicator */}
                {i > 0 && scene.transition !== 'none' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30" />
                )}
              </div>
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none"
            style={{ left: `${playheadPos}%` }}
          >
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary mx-auto -mt-[1px]" />
            <div className="w-px h-full bg-primary mx-auto" />
          </div>

          {/* Hover indicator */}
          {hoveredTime !== null && !isDragging && (
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{ left: `${(hoveredTime / totalDuration) * 100}%` }}
            >
              <div className="w-px h-full bg-foreground/20 mx-auto" />
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-mono bg-card/90 px-1 rounded border border-border/30 text-muted-foreground whitespace-nowrap">
                {formatTime(hoveredTime)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
