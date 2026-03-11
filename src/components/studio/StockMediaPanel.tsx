import { useState, useCallback } from 'react';
import { Search, Image as ImageIcon, Download, ExternalLink, Loader2, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  photographer: string;
  source: string;
  width: number;
  height: number;
}

interface StockMediaPanelProps {
  onSelectImage?: (url: string, name: string) => void;
}

const SAMPLE_CATEGORIES = [
  '🌅 Nature', '🏙️ City', '💻 Technology', '🎬 Cinema',
  '🎨 Abstract', '🏔️ Mountains', '🌊 Ocean', '🚀 Space',
];

export default function StockMediaPanel({ onSelectImage }: StockMediaPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchImages = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // Using Unsplash Source API (no key needed for basic search)
      // We'll generate placeholder results that link to real unsplash images
      const terms = searchQuery.trim().toLowerCase().replace(/\s+/g, ',');
      const mockResults: StockImage[] = Array.from({ length: 12 }, (_, i) => ({
        id: `unsplash-${i}-${Date.now()}`,
        url: `https://source.unsplash.com/1920x1080/?${terms}&sig=${i}`,
        thumbUrl: `https://source.unsplash.com/400x300/?${terms}&sig=${i}`,
        alt: `${searchQuery} - Photo ${i + 1}`,
        photographer: 'Unsplash',
        source: 'unsplash',
        width: 1920,
        height: 1080,
      }));

      setResults(mockResults);
    } catch (error) {
      console.error('Stock search error:', error);
      toast.error('Failed to search stock images');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (image: StockImage) => {
    onSelectImage?.(image.url, image.alt);
    toast.success(`📸 Image selected: ${image.alt}`);
  };

  return (
    <section className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Stock Media Library</h3>
        <Badge variant="outline" className="text-[9px] ml-auto">Free • Unsplash</Badge>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search free stock images..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchImages(query)}
            className="pl-9 bg-muted/50 border-border/50 h-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => searchImages(query)}
          disabled={loading || !query.trim()}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Search
        </Button>
      </div>

      {/* Quick Categories */}
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_CATEGORIES.map(cat => {
          const label = cat.slice(2).trim();
          return (
            <button
              key={cat}
              onClick={() => {
                setQuery(label);
                searchImages(label);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/30 transition-all"
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1">
          {results.map(img => (
            <div
              key={img.id}
              className="group relative aspect-video rounded-lg overflow-hidden bg-muted/20 border border-border/20 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              onClick={() => handleSelect(img)}
            >
              <img
                src={img.thumbUrl}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[9px] text-white/80 truncate">{img.photographer}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button className="p-1 rounded bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors">
                    <Download className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searched ? (
        <div className="text-center py-8">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No results found</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground/60">
            Search millions of free stock photos from Unsplash
          </p>
        </div>
      )}
    </section>
  );
}
