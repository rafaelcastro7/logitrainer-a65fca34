import { useState, useRef } from 'react';
import { Images, Image, Mic, FolderOpen, Download, Play, Pause, Search, Grid, List, ExternalLink } from 'lucide-react';
import { Scene } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface AssetsViewProps {
  scenes: Scene[];
}

export default function AssetsView({ scenes }: AssetsViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const images = scenes.filter(s => s.image.status === 'completed' && s.image.url);
  const audios = scenes.filter(s => s.audio.status === 'completed' && s.audio.url);

  const filteredImages = images.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredAudios = audios.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handlePlayAudio = (scene: Scene) => {
    if (playingAudioId === scene.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(scene.audio.url!);
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingAudioId(scene.id);
  };

  const handleDownload = (url: string, name: string, ext: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${ext}`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Images className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t.assetGallery}</h2>
          <Badge variant="outline" className="text-xs">{images.length + audios.length} {t.total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-xs bg-muted/50 border-border/50"
            />
          </div>
          <div className="flex items-center gap-0.5 glass-panel rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Images Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t.imagesSection}</h3>
          <Badge variant="outline" className="text-xs">{filteredImages.length}</Badge>
        </div>
        {filteredImages.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">{search ? 'No matching images' : t.noImagesYet}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{!search && t.noImagesHint}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredImages.map(s => (
              <div key={s.id} className="glass-panel rounded-lg overflow-hidden group cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                <div className="aspect-video relative">
                  <img src={s.image.url!} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-background/60 backdrop-blur-sm" onClick={() => handleDownload(s.image.url!, s.name, 'png')}>
                      <Download className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-background/60 backdrop-blur-sm" onClick={() => window.open(s.image.url!, '_blank')}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.duration}s</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredImages.map(s => (
              <div key={s.id} className="glass-panel rounded-lg p-2 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition-all">
                <div className="w-16 h-10 rounded overflow-hidden shrink-0">
                  <img src={s.image.url!} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium flex-1 truncate">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.duration}s</span>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(s.image.url!, s.name, 'png')}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audios Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t.audiosSection}</h3>
          <Badge variant="outline" className="text-xs">{filteredAudios.length}</Badge>
        </div>
        {filteredAudios.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">{search ? 'No matching audios' : t.noAudiosYet}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{!search && t.noAudiosHint}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAudios.map(s => {
              const isPlaying = playingAudioId === s.id;
              return (
                <div key={s.id} className={cn(
                  "glass-panel rounded-lg p-3 flex items-center gap-3 transition-all",
                  isPlaying ? "ring-1 ring-primary/40 bg-primary/5" : "hover:ring-1 hover:ring-primary/30"
                )}>
                  <button
                    onClick={() => handlePlayAudio(s)}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                      isPlaying ? "bg-primary text-primary-foreground glow-primary" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground">{s.duration}s · {s.script.split(/\s+/).length} words</span>
                  </div>
                  {/* Mini waveform */}
                  <div className="hidden sm:flex items-end gap-px h-6 opacity-40">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn("w-0.5 rounded-t-full transition-all", isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground/40")}
                        style={{ height: `${20 + Math.sin(i * 0.8) * 40 + Math.random() * 40}%`, animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{s.duration}s</span>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => handleDownload(s.audio.url!, s.name, 'mp3')}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
