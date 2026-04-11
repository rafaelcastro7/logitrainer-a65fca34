import { useState } from 'react';
import { Megaphone, Sparkles, Copy, Download, Loader2, Wand2, RefreshCw, Square, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';
import ContentHistoryPanel from './ContentHistoryPanel';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook Ads', icon: '📘', sizes: '1200x628' },
  { id: 'instagram_feed', label: 'Instagram Feed', icon: '📸', sizes: '1080x1080' },
  { id: 'instagram_story', label: 'Instagram Story', icon: '📱', sizes: '1080x1920' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', sizes: '1080x1920' },
  { id: 'google', label: 'Google Ads', icon: '🔍', sizes: 'Responsive' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', sizes: '1200x627' },
];

const FRAMEWORKS = [
  { id: 'aida', name: 'AIDA', desc: 'Atención → Interés → Deseo → Acción' },
  { id: 'pas', name: 'PAS', desc: 'Problema → Agitación → Solución' },
  { id: 'bab', name: 'BAB', desc: 'Before → After → Bridge' },
  { id: 'hso', name: 'HSO (Brunson)', desc: 'Hook → Story → Offer' },
  { id: 'storytelling', name: 'Storytelling', desc: 'Historia personal + transformación' },
  { id: '4u', name: '4U', desc: 'Útil → Urgente → Único → Ultra-específico' },
];

interface AdVariant {
  headline: string;
  primary_text: string;
  cta: string;
  hook: string;
  framework: string;
}

export default function AdCreativeGenerator() {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [benefit, setBenefit] = useState('');
  const [platform, setPlatform] = useState('facebook');
  const [framework, setFramework] = useState('aida');
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const [useMultiAgent, setUseMultiAgent] = useState(false);
  const { generate, stop, isGenerating, streamText, progress } = useStreamingGeneration();
  const contentStore = useGeneratedContent('ads');

  const handleGenerate = async () => {
    if (!product.trim()) { toast.error('Ingresa el producto/servicio'); return; }

    try {
      await generate(
        { type: 'ads', product, audience, benefit, platform, framework, variantsCount: 4, model },
        {
          useOrchestrator: useMultiAgent,
          orchestratorMode: 'pipeline',
          pipeline: ['strategist', 'writer', 'editor'],
          onComplete: (data) => {
            setVariants(data.variants || []);
            toast.success(`🎯 ${(data.variants || []).length} variantes de anuncio generadas`);
            const content = (data.variants || []).map((v: AdVariant, i: number) =>
              `### Variante ${i + 1}\n**Hook:** ${v.hook}\n**Headline:** ${v.headline}\n**Copy:** ${v.primary_text}\n**CTA:** ${v.cta}\n**Framework:** ${v.framework}`
            ).join('\n\n---\n\n');
            contentStore.saveContent({
              title: `Anuncios: ${product}`,
              prompt: `${product} | ${audience} | ${platform}`,
              content,
              metadata: { platform, framework, model, audience, benefit },
            });
          },
          onError: (msg) => toast.error(msg),
        }
      );
    } catch (err) {
      console.error('Ad generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generando anuncios');
    }
  };

  const copyVariant = (v: AdVariant) => {
    const text = `🎯 ${v.hook}\n\n📝 ${v.primary_text}\n\n👉 ${v.headline}\n\n🔘 ${v.cta}`;
    navigator.clipboard.writeText(text);
    toast.success('📋 Copy del anuncio copiado');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive/20 to-warning/10 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Generador de Anuncios</h2>
          <p className="text-xs text-muted-foreground">Crea copies de alta conversión con frameworks probados</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Platform */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Plataforma</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                  platform === p.id ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-border/60"
                )}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-[10px] font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Framework */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Framework de Copy</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FRAMEWORKS.map(f => (
              <button
                key={f.id}
                onClick={() => setFramework(f.id)}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all",
                  framework === f.id ? "border-primary bg-primary/10" : "border-border/30 hover:border-border/60"
                )}
              >
                <span className="text-xs font-semibold text-foreground">{f.name}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Producto/Servicio</label>
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ej: Curso de Instagram" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Audiencia</label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ej: Emprendedores" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Beneficio Principal</label>
            <Input value={benefit} onChange={(e) => setBenefit(e.target.value)} placeholder="Ej: 10K seguidores en 30 días" />
          </div>
        </div>

          <ModelSelector value={model} onChange={setModel} />

          {/* Multi-Agent Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs font-medium">Modo Multi-Agente</p>
                <p className="text-[10px] text-muted-foreground">Estratega → Redactor → Editor coordinados</p>
              </div>
            </div>
            <Switch checked={useMultiAgent} onCheckedChange={setUseMultiAgent} />
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">{Math.round(progress)}% · Generando variantes A/B en streaming...</p>
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
          {isGenerating ? 'Generando...' : 'Generar 4 Variantes A/B'}
        </Button>
      </div>

      {/* Results */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Variantes Generadas</h3>
            <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5 text-xs">
              <RefreshCw className="w-3 h-3" /> Regenerar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {variants.map((v, i) => (
              <Card key={i} className="p-4 border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">Variante {String.fromCharCode(65 + i)}</Badge>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{v.framework}</Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Hook</span>
                    <p className="text-xs font-semibold text-foreground">{v.hook}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Headline</span>
                    <p className="text-sm font-bold text-foreground">{v.headline}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Copy</span>
                    <p className="text-xs text-muted-foreground">{v.primary_text}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">CTA</span>
                    <p className="text-xs font-semibold text-primary">{v.cta}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyVariant(v)} className="w-full gap-1.5 text-xs">
                  <Copy className="w-3 h-3" /> Copiar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {contentStore.items.length > 0 && (
        <ContentHistoryPanel
          items={contentStore.items}
          loading={contentStore.loading}
          selectedItem={contentStore.selectedItem}
          onSelect={(item) => { contentStore.setSelectedItem(item); toast.info(`Cargado: ${item.title}`); }}
          onDelete={contentStore.deleteItem}
          onToggleFavorite={contentStore.toggleFavorite}
          moduleLabel="Anuncios"
        />
      )}
    </div>
  );
}
