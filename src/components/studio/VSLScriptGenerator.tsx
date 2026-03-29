import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Wand2, Loader2, Copy, Download, ChevronRight, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';

const SCRIPT_TYPES = [
  { id: 'vsl', name: 'VSL (Video Sales Letter)', desc: 'Script de venta en video 10-15 min', icon: '🎬', duration: '10-15 min' },
  { id: 'webinar', name: 'Perfect Webinar (Brunson)', desc: 'Script de 60-90 min: 3 secretos + oferta', icon: '🎓', duration: '60-90 min' },
  { id: 'mini_vsl', name: 'Mini VSL', desc: 'Video corto de venta 2-5 min', icon: '⚡', duration: '2-5 min' },
  { id: 'story_sell', name: 'Epiphany Bridge (Brunson)', desc: 'Historia personal → revelación → oferta', icon: '🌉', duration: '10-20 min' },
];

interface ScriptSection {
  name: string;
  content: string;
  duration: string;
  type: 'hook' | 'story' | 'content' | 'offer' | 'close';
}

export default function VSLScriptGenerator() {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [mainBenefit, setMainBenefit] = useState('');
  const [price, setPrice] = useState('');
  const [scriptType, setScriptType] = useState('vsl');
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [model, setModel] = useState('google/gemini-2.5-pro');
  const { generate, stop, isGenerating, streamText, progress } = useStreamingGeneration();
  const contentStore = useGeneratedContent('vsl');

  const handleGenerate = async () => {
    if (!product.trim()) { toast.error('Ingresa tu producto/servicio'); return; }

    try {
      await generate(
        { type: 'vsl_script', scriptType, product, audience, mainBenefit, price, model },
        {
          onComplete: (data) => {
            const typeConfig = SCRIPT_TYPES.find(t => t.id === scriptType);
            let parsedSections: ScriptSection[] = [];
            if (data.sections) {
              parsedSections = data.sections;
              setSections(parsedSections);
              toast.success(`🎬 Script ${typeConfig?.name} generado con ${data.sections.length} secciones`);
            } else if (data.rawContent) {
              parsedSections = [{ name: 'Script Completo', content: data.rawContent, duration: typeConfig?.duration || '', type: 'content' }];
              setSections(parsedSections);
              toast.success('📝 Script generado');
            }
            const content = parsedSections.map((s, i) => `### ${s.name}\n${s.content}`).join('\n\n---\n\n');
            contentStore.saveContent({
              title: `VSL (${typeConfig?.name}): ${product}`,
              prompt: `${product} | ${audience}`,
              content,
              metadata: { scriptType, model, price },
            });
          },
          onError: (msg) => toast.error(msg),
        }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generando script');
    }
  };

  const copyAll = () => {
    const text = sections.map(s => `=== ${s.name} (${s.duration}) ===\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('📋 Script copiado');
  };

  const exportScript = () => {
    const md = `# ${SCRIPT_TYPES.find(t => t.id === scriptType)?.name} — ${product}\n\n${sections.map(s => `## ${s.name} (${s.duration})\n\n${s.content}`).join('\n\n---\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vsl-script-${product.slice(0, 20).replace(/\s+/g, '-')}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Script exportado');
  };

  const sectionColors: Record<string, string> = {
    hook: 'border-l-red-500',
    story: 'border-l-blue-500',
    content: 'border-l-primary',
    offer: 'border-l-amber-500',
    close: 'border-l-emerald-500',
  };

  const totalWords = sections.reduce((s, sec) => s + (sec.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-primary/10 flex items-center justify-center">
          <Video className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">VSL & Webinar Scripts</h2>
          <p className="text-xs text-muted-foreground">Scripts de venta estilo Brunson, Kern y Hormozi</p>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Script</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SCRIPT_TYPES.map(t => (
                <Card
                  key={t.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all border",
                    scriptType === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
                  )}
                  onClick={() => setScriptType(t.id)}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  <Badge variant="secondary" className="mt-1.5 text-[10px]">{t.duration}</Badge>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto/Servicio</label>
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ej: Programa de coaching 90 días" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audiencia</label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ej: Emprendedores que quieren escalar" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Beneficio Principal</label>
              <Input value={mainBenefit} onChange={(e) => setMainBenefit(e.target.value)} placeholder="Ej: Pasar de 5K a 50K/mes en 90 días" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: $997" />
            </div>
          </div>

          <ModelSelector value={model} onChange={setModel} />

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">{Math.round(progress)}% · Escribiendo script de venta...</p>
              {streamText && (
                <div className="max-h-32 overflow-y-auto rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                  {streamText.slice(-500)}
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
            {isGenerating ? 'Escribiendo script...' : 'Generar Script de Venta'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold">{SCRIPT_TYPES.find(t => t.id === scriptType)?.name}</h3>
              <p className="text-xs text-muted-foreground">{sections.length} secciones · ~{totalWords.toLocaleString()} palabras</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSections([])} className="text-xs">← Nuevo</Button>
              <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5 text-xs"><Copy className="w-3 h-3" /> Copiar</Button>
              <Button size="sm" onClick={exportScript} className="gap-1.5 text-xs glow-primary"><Download className="w-3 h-3" /> Exportar</Button>
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn("p-4 border-l-4 border-border/30", sectionColors[section.type] || 'border-l-primary')}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px]">{section.type.toUpperCase()}</Badge>
                    <h4 className="text-sm font-semibold text-foreground">{section.name}</h4>
                    <span className="text-[10px] text-muted-foreground ml-auto">{section.duration}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(section.content); toast.success('Sección copiada'); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:text-foreground prose-code:text-primary text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
