import { useState } from 'react';
import { Calendar, Copy, Loader2, Wand2, RefreshCw, Hash, Instagram, Twitter, Linkedin, Square, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';

const CONTENT_TYPES = [
  { id: 'carousel', label: 'Carrusel', icon: '📸', platform: 'Instagram' },
  { id: 'reel', label: 'Reel/TikTok', icon: '🎬', platform: 'Instagram/TikTok' },
  { id: 'story', label: 'Story', icon: '📱', platform: 'Instagram' },
  { id: 'thread', label: 'Thread', icon: '🧵', platform: 'X/Twitter' },
  { id: 'post', label: 'Post', icon: '📝', platform: 'LinkedIn' },
  { id: 'newsletter', label: 'Newsletter', icon: '📧', platform: 'Email' },
];

interface ContentPost {
  day: string;
  type: string;
  title: string;
  content: string;
  hashtags: string[];
  hook: string;
  platform: string;
  bestTime?: string;
  contentPillar?: string;
}

export default function ContentCalendar() {
  const [niche, setNiche] = useState('');
  const [weeks, setWeeks] = useState('1');
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const { generate, stop, isGenerating, streamText, progress } = useStreamingGeneration();
  const contentStore = useGeneratedContent('calendar');

  const handleGenerate = async () => {
    if (!niche.trim()) { toast.error('Ingresa tu nicho'); return; }

    try {
      await generate(
        { type: 'calendar', niche, weeks: parseInt(weeks), contentTypes: CONTENT_TYPES.map(c => c.id), model },
        {
          onComplete: (data) => {
            setPosts(data.posts || []);
            toast.success(`📅 ${(data.posts || []).length} publicaciones generadas para ${weeks} semana(s)`);
            const content = (data.posts || []).map((p: ContentPost) =>
              `**${p.day} — ${p.type}** (${p.platform})\n${p.title}\n${p.content}\n#${(p.hashtags || []).join(' #')}`
            ).join('\n\n---\n\n');
            contentStore.saveContent({ title: `Calendario: ${niche} (${weeks} sem)`, prompt: niche, content, metadata: { weeks, model } });
          },
          onError: (msg) => toast.error(msg),
        }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generando calendario');
    }
  };

  const copyPost = (post: ContentPost) => {
    const text = `${post.hook}\n\n${post.content}\n\n${post.hashtags.map(h => '#' + h).join(' ')}`;
    navigator.clipboard.writeText(text);
    toast.success('📋 Publicación copiada');
  };

  const exportAll = () => {
    const md = posts.map((p, i) => `## ${p.day} — ${p.title} (${p.platform})\n\n**Hook:** ${p.hook}\n\n${p.content}\n\n**Hashtags:** ${p.hashtags.map(h => '#' + h).join(' ')}\n${p.bestTime ? `**Mejor hora:** ${p.bestTime}` : ''}`).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `content-calendar-${niche.replace(/\s+/g, '-')}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Calendario exportado');
  };

  const filteredPosts = selectedType ? posts.filter(p => p.type === selectedType) : posts;

  const getPlatformIcon = (platform: string) => {
    if (platform.includes('Instagram')) return <Instagram className="w-3 h-3" />;
    if (platform.includes('Twitter') || platform.includes('X')) return <Twitter className="w-3 h-3" />;
    if (platform.includes('LinkedIn')) return <Linkedin className="w-3 h-3" />;
    return <Hash className="w-3 h-3" />;
  };

  const pillarColors: Record<string, string> = {
    value: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    engagement: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    proof: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    entertainment: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    promo: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-success" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Content Calendar</h2>
          <p className="text-xs text-muted-foreground">Planifica y genera contenido para todas tus redes con IA</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tu Nicho</label>
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ej: Marketing digital para coaches" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Semanas</label>
              <Select value={weeks} onValueChange={setWeeks}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 semana (7 posts)</SelectItem>
                  <SelectItem value="2">2 semanas (14 posts)</SelectItem>
                  <SelectItem value="4">1 mes (28 posts)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipos de contenido incluidos</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map(t => (
                <Badge key={t.id} variant="secondary" className="text-xs gap-1">
                  {t.icon} {t.label} <span className="text-muted-foreground/60">({t.platform})</span>
                </Badge>
              ))}
            </div>
          </div>

          <ModelSelector value={model} onChange={setModel} />

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">{Math.round(progress)}% · Generando calendario de contenido...</p>
              {streamText && (
                <div className="max-h-24 overflow-y-auto rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                  {streamText.slice(-300)}
                  <span className="inline-block w-1 h-2.5 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
                </div>
              )}
              <Button variant="destructive" size="sm" className="w-full gap-1.5" onClick={stop}>
                <Square className="w-3 h-3" /> Detener
              </Button>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full glow-primary gap-2" size="lg">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isGenerating ? 'Generando calendario...' : 'Generar Calendario de Contenido'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant={selectedType === null ? "default" : "outline"} size="sm" onClick={() => setSelectedType(null)} className="text-xs">
                Todos ({posts.length})
              </Button>
              {CONTENT_TYPES.map(t => {
                const count = posts.filter(p => p.type === t.id).length;
                if (count === 0) return null;
                return (
                  <Button key={t.id} variant={selectedType === t.id ? "default" : "outline"} size="sm" onClick={() => setSelectedType(t.id)} className="text-xs gap-1">
                    {t.icon} {t.label} ({count})
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPosts([])} className="text-xs">← Nuevo</Button>
              <Button variant="outline" size="sm" onClick={exportAll} className="gap-1.5 text-xs"><Download className="w-3 h-3" /> Exportar</Button>
              <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5 text-xs"><RefreshCw className="w-3 h-3" /> Regenerar</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPosts.map((post, i) => (
              <Card key={i} className="p-4 border-border/30 space-y-2.5 hover:border-border/60 transition-all">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    {getPlatformIcon(post.platform)} {post.day}
                  </Badge>
                  <div className="flex gap-1">
                    {post.contentPillar && (
                      <Badge className={cn("text-[9px] border", pillarColors[post.contentPillar] || 'bg-muted')}>{post.contentPillar}</Badge>
                    )}
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{post.type}</Badge>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-foreground">{post.title}</h4>
                <p className="text-[11px] text-primary font-medium">🪝 {post.hook}</p>
                <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line">{post.content}</p>
                {post.bestTime && (
                  <p className="text-[10px] text-muted-foreground">⏰ {post.bestTime}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {(post.hashtags || []).slice(0, 8).map(h => (
                    <span key={h} className="text-[10px] text-primary/70">#{h}</span>
                  ))}
                  {(post.hashtags || []).length > 8 && (
                    <span className="text-[10px] text-muted-foreground">+{post.hashtags.length - 8}</span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => copyPost(post)} className="w-full gap-1.5 text-xs">
                  <Copy className="w-3 h-3" /> Copiar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
