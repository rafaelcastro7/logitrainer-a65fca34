import { useState } from 'react';
import { Presentation, Download, Loader2, Wand2, ChevronLeft, ChevronRight, Square, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';

const PRESENTATION_TYPES = [
  { id: 'pitch', name: 'Pitch Deck', desc: 'Inversores y stakeholders', icon: '🚀' },
  { id: 'webinar', name: 'Webinar', desc: 'Educativo con venta al final', icon: '🎓' },
  { id: 'masterclass', name: 'Masterclass', desc: 'Contenido premium y autoridad', icon: '🏆' },
  { id: 'lanzamiento', name: 'Lanzamiento', desc: 'Producto nuevo al mercado', icon: '🎯' },
  { id: 'reporte', name: 'Reporte', desc: 'Datos y resultados', icon: '📊' },
];

interface Slide {
  title: string;
  content: string;
  notes: string;
  layout: string;
}

export default function PresentationGenerator() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('webinar');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const { generate, stop, isGenerating, streamText, progress } = useStreamingGeneration();

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Ingresa el tema de la presentación'); return; }

    try {
      await generate(
        { type: 'presentation', topic, presentationType: type, slidesCount: 12, model },
        {
          onComplete: (data) => {
            setSlides(data.slides || []);
            setCurrentSlide(0);
            toast.success(`🎤 Presentación generada con ${(data.slides || []).length} slides`);
          },
          onError: (msg) => toast.error(msg),
        }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generando presentación');
    }
  };

  const handleExport = () => {
    const md = slides.map((s, i) => `---\n\n# Slide ${i + 1}: ${s.title}\n\n${s.content}\n\n> Speaker notes: ${s.notes}`).join('\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentacion-${topic.slice(0, 30).replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Presentación exportada');
  };

  const copySlide = (slide: Slide) => {
    navigator.clipboard.writeText(`# ${slide.title}\n\n${slide.content}\n\nNotas: ${slide.notes}`);
    toast.success('Slide copiado');
  };

  const currentSlideData = slides[currentSlide];

  const layoutIcons: Record<string, string> = {
    title: '🏷️', content: '📋', quote: '💬', stats: '📊', comparison: '⚖️', timeline: '📅', cta: '🎯', image_placeholder: '🖼️',
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-accent/10 flex items-center justify-center">
          <Presentation className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Generador de Presentaciones</h2>
          <p className="text-xs text-muted-foreground">Crea slides profesionales con contenido rico y notas de orador</p>
        </div>
      </div>

      {slides.length === 0 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Presentación</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESENTATION_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all",
                    type === t.id ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-border/60"
                  )}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tema</label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: Cómo escalar un negocio de coaching a 6 cifras con funnels automatizados..." className="min-h-[80px]" />
          </div>

          <ModelSelector value={model} onChange={setModel} />

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">{Math.round(progress)}% · Creando slides profesionales...</p>
              {streamText && (
                <div className="max-h-28 overflow-y-auto rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                  {streamText.slice(-400)}
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
            {isGenerating ? 'Generando slides...' : 'Generar Presentación Completa'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Slide {currentSlide + 1} / {slides.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSlides([])} className="text-xs">← Nuevo</Button>
              <Button variant="outline" size="sm" onClick={() => copySlide(currentSlideData)} className="gap-1.5 text-xs"><Copy className="w-3 h-3" /> Copiar</Button>
              <Button size="sm" onClick={handleExport} className="gap-1.5 text-xs glow-primary"><Download className="w-3 h-3" /> Exportar</Button>
            </div>
          </div>

          {/* Slide Preview */}
          <Card className="aspect-video bg-gradient-to-br from-card to-secondary p-6 sm:p-8 flex flex-col justify-center border-border/30 relative overflow-hidden">
            <Badge variant="secondary" className="absolute top-3 right-3 text-[10px] gap-1">
              {layoutIcons[currentSlideData?.layout] || '📋'} {currentSlideData?.layout}
            </Badge>
            <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-4">{currentSlideData?.title}</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentSlideData?.content || ''}</ReactMarkdown>
            </div>
          </Card>

          {/* Speaker Notes */}
          {currentSlideData?.notes && (
            <Card className="p-4 border-border/30 bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase mb-1.5 font-semibold">🎙️ Notas del Orador</p>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{currentSlideData.notes}</p>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentSlide ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Slide Thumbnails */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  i === currentSlide ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
                )}
              >
                <p className="text-[9px] font-bold text-foreground truncate">{i + 1}. {s.title}</p>
                <p className="text-[8px] text-muted-foreground truncate">{s.layout}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
