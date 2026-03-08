import { Images, Image, Mic, FolderOpen } from 'lucide-react';
import { Scene } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n/LanguageContext';

interface AssetsViewProps {
  scenes: Scene[];
}

export default function AssetsView({ scenes }: AssetsViewProps) {
  const { t } = useTranslation();
  const images = scenes.filter(s => s.image.status === 'completed' && s.image.url);
  const audios = scenes.filter(s => s.audio.status === 'completed' && s.audio.url);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Images className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">{t.assetGallery}</h2>
        <Badge variant="outline" className="text-xs">{images.length + audios.length} {t.total}</Badge>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t.imagesSection}</h3>
          <Badge variant="outline" className="text-xs">{images.length}</Badge>
        </div>
        {images.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">{t.noImagesYet}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{t.noImagesHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map(s => (
              <div key={s.id} className="glass-panel rounded-lg overflow-hidden group cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                <div className="aspect-video">
                  <img src={s.image.url!} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.duration}s</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t.audiosSection}</h3>
          <Badge variant="outline" className="text-xs">{audios.length}</Badge>
        </div>
        {audios.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">{t.noAudiosYet}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{t.noAudiosHint}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audios.map(s => (
              <div key={s.id} className="glass-panel rounded-lg p-3 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-primary" />
                </div>
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
