import { Play, Download, MonitorPlay, Image, Mic, Clock, Film } from 'lucide-react';
import { Scene } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MiniTimeline from './MiniTimeline';
import { useTranslation } from '@/i18n/LanguageContext';

interface PreviewViewProps {
  scenes: Scene[];
}

export default function PreviewView({ scenes }: PreviewViewProps) {
  const { t } = useTranslation();
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
        <h2 className="text-lg font-bold">{t.previewAndRender}</h2>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="aspect-video bg-muted/10 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none" />
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
        </div>
      </div>

      {scenes.length > 0 && <MiniTimeline scenes={scenes} />}

      <div className="flex items-center gap-3 justify-center">
        <Button size="lg" className="gap-2 glow-primary" disabled={readyImages === 0}>
          <Play className="w-5 h-5" /> {t.playPreview}
        </Button>
        <Button size="lg" variant="outline" className="gap-2" disabled={readyImages === 0}>
          <Download className="w-5 h-5" /> {t.renderVideo}
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
