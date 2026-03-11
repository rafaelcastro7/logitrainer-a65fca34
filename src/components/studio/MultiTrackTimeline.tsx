import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Scene } from '@/types/project';
import { cn } from '@/lib/utils';
import { 
  Image as ImageIcon, Mic, Music, Type, ZoomIn, ZoomOut, 
  Maximize2, Scissors, Lock, Unlock, Eye, EyeOff, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MultiTrackTimelineProps {
  scenes: Scene[];
  activeSceneId?: string;
  onSceneClick?: (id: string) => void;
  currentTime?: number;
  onSeek?: (time: number) => void;
  onSplitScene?: (sceneId: string, splitTime: number) => void;
  hasBgMusic?: boolean;
}

type TrackType = 'video' | 'audio' | 'text' | 'music';

interface TrackConfig {
  type: TrackType;
  label: string;
  icon: typeof ImageIcon;
  color: string;
  visible: boolean;
  locked: boolean;
}

export default function MultiTrackTimeline({ 
  scenes, activeSceneId, onSceneClick, 
  currentTime = 0, onSeek, onSplitScene, hasBgMusic 
}: MultiTrackTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [tracks, setTracks] = useState<TrackConfig[]>([
    { type: 'video', label: 'Video', icon: ImageIcon, color: 'bg-blue-500/60', visible: true, locked: false },
    { type: 'audio', label: 'Voiceover', icon: Mic, color: 'bg-emerald-500/60', visible: true, locked: false },
    { type: 'text', label: 'Subtitles', icon: Type, color: 'bg-amber-500/60', visible: true, locked: false },
    { type: 'music', label: 'Music', icon: Music, color: 'bg-purple-500/60', visible: true, locked: false },
  ]);

  const totalDuration = useMemo(() => scenes.reduce((sum, s) => sum + s.duration, 0), [scenes]);
  const pixelsPerSecond = Math.max(8, 12 * zoom);
  const trackWidth = Math.max(totalDuration * pixelsPerSecond, 400);
  const playheadPos = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const getTimeFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const scrollContainer = trackRef.current;
    const totalWidth = scrollContainer.scrollWidth;
    const x = e.clientX - rect.left + scrollContainer.scrollLeft;
    return Math.max(0, Math.min(totalDuration, (x / totalWidth) * totalDuration));
  }, [totalDuration]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    onSeek?.(getTimeFromMouse(e));
  }, [getTimeFromMouse, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setHoveredTime(getTimeFromMouse(e));
    if (isDragging) onSeek?.(getTimeFromMouse(e));
  }, [getTimeFromMouse, isDragging, onSeek]);

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const toggleTrack = (type: TrackType, key: 'visible' | 'locked') => {
    setTracks(prev => prev.map(t => t.type === type ? { ...t, [key]: !t[key] } : t));
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const rulerInterval = zoom > 2 ? 1 : zoom > 1 ? 2 : 5;
  const rulerMarks = useMemo(() => {
    const marks: number[] = [];
    for (let t = 0; t <= totalDuration; t += rulerInterval) marks.push(t);
    return marks;
  }, [totalDuration, rulerInterval]);

  if (scenes.length === 0) return null;

  const handleSplit = () => {
    let elapsed = 0;
    for (const scene of scenes) {
      if (currentTime >= elapsed && currentTime < elapsed + scene.duration) {
        const localTime = currentTime - elapsed;
        if (localTime > 0.5 && localTime < scene.duration - 0.5) {
          onSplitScene?.(scene.id, localTime);
        }
        break;
      }
      elapsed += scene.duration;
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-card/40">
        <span className="text-[10px] font-mono text-muted-foreground min-w-[90px]">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
        <div className="w-px h-3.5 bg-border/30" />
        <span className="text-[10px] text-muted-foreground">{scenes.length} clips</span>
        <div className="flex-1" />

        {onSplitScene && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSplit}>
                <Scissors className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Split at playhead</TooltipContent>
          </Tooltip>
        )}

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[9px] font-mono text-muted-foreground w-7 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(z => Math.min(4, z + 0.25))}>
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(1)}>
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Track Labels */}
        <div className="w-28 shrink-0 border-r border-border/20 bg-card/30">
          {/* Ruler spacer */}
          <div className="h-5 border-b border-border/20" />
          {tracks.map(track => {
            const Icon = track.icon;
            return (
              <div key={track.type} className="h-10 flex items-center gap-1 px-2 border-b border-border/10 group">
                <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-medium text-muted-foreground truncate flex-1">{track.label}</span>
                <button onClick={() => toggleTrack(track.type, 'visible')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.visible ? <Eye className="w-2.5 h-2.5 text-muted-foreground/60" /> : <EyeOff className="w-2.5 h-2.5 text-muted-foreground/40" />}
                </button>
                <button onClick={() => toggleTrack(track.type, 'locked')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.locked ? <Lock className="w-2.5 h-2.5 text-destructive/60" /> : <Unlock className="w-2.5 h-2.5 text-muted-foreground/40" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Timeline Area */}
        <div className="flex-1 overflow-x-auto" ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTime(null)}
        >
          {/* Ruler */}
          <div className="h-5 relative bg-muted/10 border-b border-border/20" style={{ minWidth: `${trackWidth}px` }}>
            {rulerMarks.map(t => (
              <div key={t} className="absolute top-0 h-full" style={{ left: `${(t / totalDuration) * 100}%` }}>
                <div className="w-px h-2.5 bg-border/40" />
                <span className="text-[7px] font-mono text-muted-foreground/50 ml-0.5">
                  {formatTime(t)}
                </span>
              </div>
            ))}
          </div>

          {/* Video Track */}
          {tracks[0].visible && (
            <div className="h-10 flex relative border-b border-border/10" style={{ minWidth: `${trackWidth}px` }}>
              {scenes.map((scene, i) => {
                const w = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 100 / scenes.length;
                return (
                  <div
                    key={scene.id}
                    style={{ width: `${w}%` }}
                    className={cn(
                      "relative h-full border-r border-border/20 cursor-pointer group/clip transition-all",
                      scene.id === activeSceneId && "ring-1 ring-inset ring-primary/50"
                    )}
                    onClick={() => onSceneClick?.(scene.id)}
                  >
                    {scene.image.url ? (
                      <img src={scene.image.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className={cn("absolute inset-0", i % 2 === 0 ? "bg-blue-500/10" : "bg-blue-500/15")} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-transparent">
                      <span className="text-[8px] font-medium px-1 pt-0.5 block truncate text-foreground/80">
                        {i + 1}. {scene.name}
                      </span>
                    </div>
                    {i > 0 && scene.transition !== 'none' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-primary/30 to-transparent" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Audio Track */}
          {tracks[1].visible && (
            <div className="h-10 flex relative border-b border-border/10" style={{ minWidth: `${trackWidth}px` }}>
              {scenes.map((scene, i) => {
                const w = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 100 / scenes.length;
                const hasAudio = scene.audio.status === 'completed';
                return (
                  <div key={scene.id} style={{ width: `${w}%` }} className="relative h-full border-r border-border/10">
                    {hasAudio ? (
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-end gap-px px-0.5 py-0.5">
                        {Array.from({ length: Math.max(6, Math.floor(scene.duration * 3)) }).map((_, j) => (
                          <div
                            key={j}
                            className="flex-1 bg-emerald-500/40 rounded-t-sm"
                            style={{ height: `${15 + Math.sin(j * 0.8) * 35 + Math.random() * 35}%` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={cn("absolute inset-0", i % 2 === 0 ? "bg-emerald-500/5" : "bg-emerald-500/8")} />
                    )}
                    {hasAudio && (
                      <div className="absolute top-0.5 right-1">
                        <Volume2 className="w-2 h-2 text-emerald-400/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Text/Subtitle Track */}
          {tracks[2].visible && (
            <div className="h-10 flex relative border-b border-border/10" style={{ minWidth: `${trackWidth}px` }}>
              {scenes.map((scene) => {
                const w = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 100 / scenes.length;
                const hasOverlay = scene.textOverlay?.enabled;
                return (
                  <div key={scene.id} style={{ width: `${w}%` }} className="relative h-full border-r border-border/10">
                    {hasOverlay ? (
                      <div className="absolute inset-1 bg-amber-500/15 rounded border border-amber-500/20 flex items-center px-1.5">
                        <span className="text-[8px] text-amber-300/70 truncate">{scene.textOverlay?.text || 'Text'}</span>
                      </div>
                    ) : scene.script.trim() ? (
                      <div className="absolute inset-1 bg-amber-500/5 rounded border border-dashed border-amber-500/10 flex items-center px-1.5">
                        <span className="text-[7px] text-muted-foreground/30 truncate">auto-caption</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Music Track */}
          {tracks[3].visible && (
            <div className="h-10 relative border-b border-border/10" style={{ minWidth: `${trackWidth}px` }}>
              {hasBgMusic ? (
                <div className="absolute inset-0 bg-purple-500/10">
                  <div className="absolute inset-0 flex items-center gap-px px-1">
                    {Array.from({ length: Math.max(20, Math.floor(totalDuration * 2)) }).map((_, j) => (
                      <div
                        key={j}
                        className="flex-1 bg-purple-500/25 rounded-sm"
                        style={{ height: `${20 + Math.sin(j * 0.5) * 30 + Math.random() * 30}%` }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-1 left-2 flex items-center gap-1">
                    <Music className="w-2.5 h-2.5 text-purple-400/60" />
                    <span className="text-[8px] text-purple-300/60">Background Music</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-purple-500/5 flex items-center justify-center">
                  <span className="text-[8px] text-muted-foreground/20">No music</span>
                </div>
              )}
            </div>
          )}

          {/* Playhead overlay - spans all tracks */}
          <div
            className="absolute top-5 bottom-0 z-20 pointer-events-none"
            style={{ left: `${playheadPos}%` }}
          >
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500 mx-auto -mt-px" />
            <div className="w-px h-full bg-red-500/80 mx-auto" />
          </div>

          {/* Hover line */}
          {hoveredTime !== null && !isDragging && (
            <div className="absolute top-5 bottom-0 z-10 pointer-events-none"
              style={{ left: `${(hoveredTime / totalDuration) * 100}%` }}
            >
              <div className="w-px h-full bg-foreground/15 mx-auto" />
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-mono bg-card/90 px-1 rounded border border-border/30 text-muted-foreground whitespace-nowrap">
                {formatTime(hoveredTime)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
