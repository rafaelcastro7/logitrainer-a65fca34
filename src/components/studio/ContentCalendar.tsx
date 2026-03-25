import { useState } from 'react';
import { Calendar, Sparkles, Copy, Loader2, Wand2, RefreshCw, Hash, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
}

export default function ContentCalendar() {
  const [niche, setNiche] = useState('');
  const [weeks, setWeeks] = useState('1');
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!niche.trim()) { toast.error('Ingresa tu nicho'); return; }
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: { type: 'calendar', niche, weeks: parseInt(weeks), contentTypes: CONTENT_TYPES.map(c => c.id) },
      });

      if (error) throw error;
      setPosts(data.posts || []);
      toast.success(`📅 ${data.posts.length} publicaciones generadas para ${weeks} semana(s)`);
    } catch (err) {
      console.error('Calendar error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generando calendario');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPost = (post: ContentPost) => {
    const text = `${post.hook}\n\n${post.content}\n\n${post.hashtags.map(h => '#' + h).join(' ')}`;
    navigator.clipboard.writeText(text);
    toast.success('📋 Publicación copiada');
  };

  const filteredPosts = selectedType ? posts.filter(p => p.type === selectedType) : posts;

  const getPlatformIcon = (platform: string) => {
    if (platform.includes('Instagram')) return <Instagram className="w-3 h-3" />;
    if (platform.includes('Twitter') || platform.includes('X')) return <Twitter className="w-3 h-3" />;
    if (platform.includes('LinkedIn')) return <Linkedin className="w-3 h-3" />;
    return <Hash className="w-3 h-3" />;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
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
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{post.type}</Badge>
                </div>
                <h4 className="text-sm font-semibold text-foreground">{post.title}</h4>
                <p className="text-[11px] text-primary font-medium">🪝 {post.hook}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.slice(0, 5).map(h => (
                    <span key={h} className="text-[10px] text-primary/70">#{h}</span>
                  ))}
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
