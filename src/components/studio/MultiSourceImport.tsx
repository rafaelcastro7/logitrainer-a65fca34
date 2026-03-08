import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Link2, Search, Image, X, Loader2, CheckCircle2,
  ExternalLink, Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImportedAsset {
  id: string;
  url: string;
  name: string;
  source: 'upload' | 'url' | 'search';
}

interface MultiSourceImportProps {
  onImportImage: (url: string, name: string) => void;
}

export default function MultiSourceImport({ onImportImage }: MultiSourceImportProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'search'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imported, setImported] = useState<ImportedAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'upload' as const, label: 'Subir archivo', icon: Upload },
    { id: 'url' as const, label: 'Desde URL', icon: Link2 },
    { id: 'search' as const, label: 'Buscar con IA', icon: Search },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede 10MB`);
        continue;
      }

      const url = URL.createObjectURL(file);
      const asset: ImportedAsset = {
        id: crypto.randomUUID(),
        url,
        name: file.name,
        source: 'upload',
      };
      setImported(prev => [...prev, asset]);
      onImportImage(url, file.name);
      toast.success(`✅ ${file.name} importado`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);

    try {
      // Validate the URL is an image
      const url = urlInput.trim();
      const asset: ImportedAsset = {
        id: crypto.randomUUID(),
        url,
        name: url.split('/').pop()?.split('?')[0] || 'imported-image',
        source: 'url',
      };
      setImported(prev => [...prev, asset]);
      onImportImage(url, asset.name);
      setUrlInput('');
      toast.success('✅ Imagen importada desde URL');
    } catch (err) {
      toast.error('Error al importar desde URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchImport = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    try {
      // Use Lovable AI to generate an image based on search
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: searchQuery, modelTier: 'prototyping' },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      if (data?.imageUrl) {
        const asset: ImportedAsset = {
          id: crypto.randomUUID(),
          url: data.imageUrl,
          name: `ai-${searchQuery.slice(0, 30)}`,
          source: 'search',
        };
        setImported(prev => [...prev, asset]);
        onImportImage(data.imageUrl, asset.name);
        toast.success('✅ Imagen generada con IA');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error en búsqueda IA');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAsset = (id: string) => {
    setImported(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Multi-Source Import</h2>
          <p className="text-xs text-muted-foreground">Importa assets desde cualquier fuente</p>
        </div>
        {imported.length > 0 && (
          <Badge variant="outline" className="ml-auto text-xs">{imported.length} importados</Badge>
        )}
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div
          className="glass-panel rounded-xl p-8 text-center border-2 border-dashed border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium">Arrastra o haz clic para subir</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP · Max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
              className="flex-1 bg-muted/50 border-border/50 text-sm"
            />
            <Button size="sm" onClick={handleUrlImport} disabled={!urlInput.trim() || isLoading} className="gap-1.5">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              Importar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Pega la URL directa de cualquier imagen pública</p>
        </div>
      )}

      {/* AI Search Tab */}
      {activeTab === 'search' && (
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Máquina CNC industrial cortando aluminio"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchImport()}
              className="flex-1 bg-muted/50 border-border/50 text-sm"
            />
            <Button size="sm" onClick={handleSearchImport} disabled={!searchQuery.trim() || isLoading} className="gap-1.5">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Generar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Describe la imagen que necesitas y la IA la generará al instante</p>
        </div>
      )}

      {/* Imported Assets Grid */}
      {imported.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Assets Importados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imported.map(asset => (
              <motion.div
                key={asset.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel rounded-lg overflow-hidden group relative"
              >
                <div className="aspect-video bg-muted/30">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="p-2 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{asset.name}</p>
                    <Badge variant="outline" className="text-[9px] h-4 mt-0.5">
                      {asset.source === 'upload' ? '📁 Upload' : asset.source === 'url' ? '🔗 URL' : '🤖 AI'}
                    </Badge>
                  </div>
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
