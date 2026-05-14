import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Search, Star, Trash2, Download, Filter, Calendar, BookOpen, Megaphone, Mail, Presentation, Target, Video, Magnet, Bot, Archive, FileText, Pencil, Save, X, Sparkles, Copy, Layout, Gem, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { seedSampleContent } from '@/lib/sampleContent';

interface ContentItem {
  id: string;
  module: string;
  title: string;
  prompt: string;
  content: string;
  metadata: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

const MODULE_INFO: Record<string, { label: string; icon: any; color: string }> = {
  ebook: { label: 'Ebook', icon: BookOpen, color: 'text-blue-500' },
  ads: { label: 'Anuncios', icon: Megaphone, color: 'text-red-500' },
  emails: { label: 'Emails', icon: Mail, color: 'text-green-500' },
  presentation: { label: 'Presentación', icon: Presentation, color: 'text-amber-500' },
  lead_magnet: { label: 'Lead Magnet', icon: Magnet, color: 'text-pink-500' },
  vsl: { label: 'VSL Script', icon: Video, color: 'text-purple-500' },
  funnel: { label: 'Funnel', icon: Target, color: 'text-orange-500' },
  calendar: { label: 'Calendario', icon: Calendar, color: 'text-teal-500' },
  agents: { label: 'AI Crew', icon: Bot, color: 'text-indigo-500' },
  landing: { label: 'Landing', icon: Layout, color: 'text-cyan-500' },
  offer: { label: 'Oferta', icon: Gem, color: 'text-fuchsia-500' },
  webinar: { label: 'Webinar', icon: MonitorPlay, color: 'text-rose-500' },
};

export default function MyContentView() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [seeding, setSeeding] = useState(false);

  const handleSeedSamples = async () => {
    setSeeding(true);
    const n = await seedSampleContent();
    if (n > 0) await fetchAll();
    setSeeding(false);
  };

  const startEdit = (item: ContentItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedItem) return;
    const { data, error } = await supabase
      .from('generated_content')
      .update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() })
      .eq('id', selectedItem.id)
      .select()
      .single();
    if (error) { toast.error('Error: ' + error.message); return; }
    const updated = { ...data, metadata: (data.metadata as Record<string, any>) ?? {} } as ContentItem;
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelectedItem(updated);
    setEditing(false);
    toast.success('Cambios guardados ✅');
  };

  const reuseAsNew = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        module: item.module,
        title: `${item.title} (copia)`,
        prompt: item.prompt,
        content: item.content,
        metadata: { ...item.metadata, reusedFrom: item.id },
      })
      .select()
      .single();
    if (error) { toast.error('Error: ' + error.message); return; }
    const newItem = { ...data, metadata: (data.metadata as Record<string, any>) ?? {} } as ContentItem;
    setItems(prev => [newItem, ...prev]);
    setSelectedItem(newItem);
    toast.success('📋 Duplicado para reutilizar');
  };

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) {
      setItems(data.map(d => ({ ...d, metadata: (d.metadata as Record<string, any>) ?? {} })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = items.filter(i => {
    if (favoritesOnly && !i.is_favorite) return false;
    if (moduleFilter !== 'all' && i.module !== moduleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.title.toLowerCase().includes(q) && !i.prompt.toLowerCase().includes(q) && !i.module.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const toggleFavorite = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const { error } = await supabase.from('generated_content').update({ is_favorite: !item.is_favorite }).eq('id', id);
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: !i.is_favorite } : i));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('generated_content').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      toast.success('Eliminado');
    }
  };

  const exportZip = async () => {
    const grouped: Record<string, ContentItem[]> = {};
    filtered.forEach(item => {
      if (!grouped[item.module]) grouped[item.module] = [];
      grouped[item.module].push(item);
    });

    // Create a combined markdown file per module
    let allContent = '';
    for (const [mod, modItems] of Object.entries(grouped)) {
      const info = MODULE_INFO[mod];
      allContent += `# ${info?.label || mod}\n\n`;
      modItems.forEach((item, i) => {
        allContent += `## ${i + 1}. ${item.title}\n`;
        allContent += `_Generado: ${new Date(item.created_at).toLocaleDateString('es')}_\n`;
        allContent += `_Prompt: ${item.prompt}_\n\n`;
        allContent += item.content;
        allContent += '\n\n---\n\n';
      });
    }

    const blob = new Blob([allContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-contenido-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`📥 Exportados ${filtered.length} elementos`);
  };

  const moduleCounts = items.reduce((acc, i) => {
    acc[i.module] = (acc[i.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
            <Archive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mi Contenido</h1>
            <p className="text-xs text-muted-foreground">{items.length} elementos generados en total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSeedSamples} disabled={seeding} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {seeding ? 'Cargando...' : 'Cargar muestras'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportZip} disabled={filtered.length === 0} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Exportar ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {Object.entries(MODULE_INFO).map(([key, info]) => {
          const Icon = info.icon;
          const count = moduleCounts[key] || 0;
          return (
            <Card
              key={key}
              className={cn(
                "p-2 text-center cursor-pointer transition-all border",
                moduleFilter === key ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
              )}
              onClick={() => setModuleFilter(moduleFilter === key ? 'all' : key)}
            >
              <Icon className={cn("w-4 h-4 mx-auto", info.color)} />
              <p className="text-[10px] font-medium text-foreground mt-1">{info.label}</p>
              <p className="text-lg font-bold text-foreground">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título, prompt o módulo..." className="pl-9 h-9 text-sm" />
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Más recientes</SelectItem>
            <SelectItem value="title">Alfabético</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={favoritesOnly ? 'default' : 'outline'} size="sm" className="h-9 gap-1.5" onClick={() => setFavoritesOnly(!favoritesOnly)}>
          <Star className={cn("w-3.5 h-3.5", favoritesOnly && "fill-current")} /> Favoritos
        </Button>
        {moduleFilter !== 'all' && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setModuleFilter('all')}>
            ✕ Limpiar filtro
          </Button>
        )}
      </div>

      {/* Content Grid */}
      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">
                {items.length === 0 ? 'Aún no has generado contenido' : 'Sin resultados para este filtro'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => {
                const info = MODULE_INFO[item.module];
                const Icon = info?.icon || FileText;
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all border group",
                      selectedItem?.id === item.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
                    )}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", info?.color ? `bg-${info.color.replace('text-', '')}/10` : 'bg-muted')}>
                        <Icon className={cn("w-4 h-4", info?.color || 'text-muted-foreground')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          {item.is_favorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{info?.label || item.module}</Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
                          <span className="text-[10px] text-muted-foreground">{item.content.length.toLocaleString()} chars</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); toggleFavorite(item.id); }}>
                          <Star className={cn("w-3.5 h-3.5", item.is_favorite ? "fill-yellow-500 text-yellow-500" : "")} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {selectedItem && (
          <div className="hidden lg:block w-[450px] shrink-0">
            <Card className="sticky top-4 max-h-[calc(100vh-200px)] flex flex-col">
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center justify-between gap-2">
                  {editing ? (
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-sm font-semibold" />
                  ) : (
                    <h3 className="text-sm font-semibold text-foreground truncate flex-1">{selectedItem.title}</h3>
                  )}
                  <div className="flex gap-1 shrink-0">
                    {editing ? (
                      <>
                        <Button variant="default" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={saveEdit}>
                          <Save className="w-3 h-3" /> Guardar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(false)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Editar" onClick={() => startEdit(selectedItem)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Duplicar para reutilizar" onClick={() => reuseAsNew(selectedItem)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Copiar al portapapeles" onClick={() => {
                          navigator.clipboard.writeText(selectedItem.content);
                          toast.success('Copiado');
                        }}>
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedItem(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{selectedItem.prompt}</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                {editing ? (
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="min-h-[400px] text-xs font-mono leading-relaxed"
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedItem.content}</ReactMarkdown>
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
