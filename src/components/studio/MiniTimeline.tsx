import { Scene } from '@/types/project';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface MiniTimelineProps {
  scenes: Scene[];
  activeSceneId?: string;
  onSceneClick?: (id: string) => void;
}

export default function MiniTimeline({ scenes, activeSceneId, onSceneClick }: MiniTimelineProps) {
  const { t } = useTranslation();
  if (scenes.length === 0) return null;

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="glass-panel rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{scenes.length} {t.scenes}</span>
        <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
      </div>

      <div className="flex gap-1 h-16 rounded-lg overflow-hidden">
        {scenes.map((scene, i) => {
          const widthPercent = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 100 / scenes.length;
          const isActive = scene.id === activeSceneId;
          const hasImage = scene.image.status === 'completed';
          const hasAudio = scene.audio.status === 'completed';

          return (
            <button
              key={scene.id}
              onClick={() => onSceneClick?.(scene.id)}
              style={{ width: `${widthPercent}%`, minWidth: '2rem' }}
              className={cn(
                "relative rounded-md overflow-hidden transition-all duration-200 group",
                isActive ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:brightness-125",
                hasImage ? "" : "bg-muted/40"
              )}
            >
              {scene.image.url ? (
                <img src={scene.image.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] font-mono text-muted-foreground/50">{i + 1}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                <span className="text-[9px] font-medium truncate px-1">{scene.name}</span>
              </div>

              <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                {hasImage && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                {hasAudio && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
