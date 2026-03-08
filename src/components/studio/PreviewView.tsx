import { Play, Download, MonitorPlay, Image, Mic, Clock, Film } from 'lucide-react';
import { Scene } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MiniTimeline from './MiniTimeline';

interface PreviewViewProps {
  scenes: Scene[];
}

export default function PreviewView({ scenes }: PreviewViewProps) {
  const readyImages = scenes.filter(s => s.image.status === 'completed').length;
  const readyAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const readyPercent = scenes.length > 0
    ? ((readyImages + readyAudios) / (scenes.length * 2)) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <MonitorPlay className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Vista Previa y Renderizado</h2>
      </div>

      {/* Video Canvas Area */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="aspect-video bg-muted/10 flex items-center justify-center relative">
          {/* Fake scanlines for cinematic feel */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(var(--background)/0.03)_2px,hsl(var(--background)/0.03)_4px)] pointer-events-none" />
          <div className="text-center text-muted-foreground/40 relative z-10">
            <Film className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-semibold text-foreground/60">Vista Previa del Video</p>
            <p className="text-sm mt-1">
              {scenes.length === 0
                ? 'Genera escenas primero para ver la vista previa'
                : `${readyImages}/${scenes.length} imágenes · ${readyAudios}/${scenes.length} audios`
              }
            </p>
            {readyPercent > 0 && readyPercent < 100 && (
              <div className="mt-4 w-48 mx-auto">
                <Progress value={readyPercent} className="h-1.5" />
                <p className="text-[10px] mt-1 text-muted-foreground">{Math.round(readyPercent)}% de assets listos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {scenes.length > 0 && <MiniTimeline scenes={scenes} />}

      {/* Controls */}
      <div className="flex items-center gap-3 justify-center">
        <Button size="lg" className="gap-2 glow-primary" disabled={readyImages === 0}>
          <Play className="w-5 h-5" /> Reproducir Preview
        </Button>
        <Button size="lg" variant="outline" className="gap-2" disabled={readyImages === 0}>
          <Download className="w-5 h-5" /> Renderizar Video (WebM)
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Film, label: 'Escenas', value: scenes.length },
          { icon: Image, label: 'Imágenes', value: `${readyImages}/${scenes.length}` },
          { icon: Mic, label: 'Audios', value: `${readyAudios}/${scenes.length}` },
          { icon: Clock, label: 'Duración', value: `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')}` },
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
