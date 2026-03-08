import { Play, Download, MonitorPlay } from 'lucide-react';
import { Scene } from '@/types/project';
import { Button } from '@/components/ui/button';

interface PreviewViewProps {
  scenes: Scene[];
}

export default function PreviewView({ scenes }: PreviewViewProps) {
  const readyScenes = scenes.filter(s => s.image.status === 'completed');
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <MonitorPlay className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Vista Previa y Renderizado</h2>
      </div>

      {/* Video Canvas Area */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="aspect-video bg-muted/20 flex items-center justify-center">
          <div className="text-center text-muted-foreground/50">
            <MonitorPlay className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Vista Previa del Video</p>
            <p className="text-sm mt-1">{readyScenes.length}/{scenes.length} escenas listas · {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')} total</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 justify-center">
        <Button size="lg" className="gap-2 glow-primary" disabled={readyScenes.length === 0}>
          <Play className="w-5 h-5" /> Reproducir Preview
        </Button>
        <Button size="lg" variant="outline" className="gap-2" disabled={readyScenes.length === 0}>
          <Download className="w-5 h-5" /> Renderizar Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Escenas Totales', value: scenes.length },
          { label: 'Imágenes Listas', value: readyScenes.length },
          { label: 'Duración Total', value: `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')}` },
        ].map(stat => (
          <div key={stat.label} className="glass-panel rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gradient-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
