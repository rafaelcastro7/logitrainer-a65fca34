import { Images, Image, Mic, FolderOpen } from 'lucide-react';
import { Scene } from '@/types/project';
import { Badge } from '@/components/ui/badge';

interface AssetsViewProps {
  scenes: Scene[];
}

export default function AssetsView({ scenes }: AssetsViewProps) {
  const images = scenes.filter(s => s.image.status === 'completed' && s.image.url);
  const audios = scenes.filter(s => s.audio.status === 'completed' && s.audio.url);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Images className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Galería de Assets</h2>
      </div>

      {/* Images Grid */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Imágenes</h3>
          <Badge variant="outline" className="text-xs">{images.length}</Badge>
        </div>
        {images.length === 0 ? (
          <div className="glass-panel rounded-xl p-8 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No hay imágenes generadas aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map(s => (
              <div key={s.id} className="glass-panel rounded-lg overflow-hidden group">
                <div className="aspect-video">
                  <img src={s.image.url!} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audios List */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Audios</h3>
          <Badge variant="outline" className="text-xs">{audios.length}</Badge>
        </div>
        {audios.length === 0 ? (
          <div className="glass-panel rounded-xl p-8 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No hay audios generados aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audios.map(s => (
              <div key={s.id} className="glass-panel rounded-lg p-3 flex items-center gap-3">
                <Mic className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.duration}s</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
