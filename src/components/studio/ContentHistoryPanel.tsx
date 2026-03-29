import { useState } from 'react';
import { Clock, Star, Trash2, Eye, Download, Search, ChevronRight, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GeneratedContentItem } from '@/hooks/useGeneratedContent';

interface ContentHistoryPanelProps {
  items: GeneratedContentItem[];
  loading: boolean;
  selectedItem: GeneratedContentItem | null;
  onSelect: (item: GeneratedContentItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onExport?: (item: GeneratedContentItem) => void;
  moduleLabel?: string;
}

export default function ContentHistoryPanel({
  items, loading, selectedItem, onSelect, onDelete, onToggleFavorite, onExport, moduleLabel = 'Contenido'
}: ContentHistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = items.filter(i => {
    if (showFavoritesOnly && !i.is_favorite) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  };

  if (items.length === 0 && !loading) {
    return (
      <Card className="p-4 text-center">
        <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Sin {moduleLabel.toLowerCase()} guardado aún</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Genera contenido y se guardará automáticamente aquí</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full max-h-[500px]">
      <div className="p-2 border-b border-border/30 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Historial</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">{items.length}</Badge>
        </div>
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-6 text-[10px] pl-6 bg-muted/30"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? 'default' : 'ghost'}
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={cn("w-3 h-3", showFavoritesOnly && "fill-current")} />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {loading && <p className="text-xs text-muted-foreground text-center p-2">Cargando...</p>}
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                "group flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-xs transition-colors",
                selectedItem?.id === item.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/40"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-[11px] text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.prompt}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="text-[9px] text-muted-foreground">{formatDate(item.created_at)}</span>
                <Button
                  variant="ghost" size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={e => { e.stopPropagation(); onToggleFavorite(item.id); }}
                >
                  <Star className={cn("w-2.5 h-2.5", item.is_favorite && "fill-yellow-500 text-yellow-500")} />
                </Button>
                {onExport && (
                  <Button
                    variant="ghost" size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); onExport(item); }}
                  >
                    <Download className="w-2.5 h-2.5" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={e => { e.stopPropagation(); onDelete(item.id); }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center p-2">Sin resultados</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
