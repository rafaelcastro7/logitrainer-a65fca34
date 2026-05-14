import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MonitorPlay, Sparkles, Loader2, Copy, Clock, Users, MessageSquare,
  BarChart3, Zap, Target, Gift, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ModelSelector from './ModelSelector';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';

type WebinarType = 'perfect_webinar' | 'challenge' | 'masterclass' | 'demo';

const WEBINAR_TYPES: { id: WebinarType; label: string; desc: string; duration: string }[] = [
  { id: 'perfect_webinar', label: 'Perfect Webinar (Brunson)', desc: 'Estructura probada de Russell Brunson', duration: '60-90 min' },
  { id: 'challenge', label: '5-Day Challenge', desc: 'Desafío de 5 días con venta al final', duration: '5 x 30 min' },
  { id: 'masterclass', label: 'Masterclass', desc: 'Clase magistral con oferta premium', duration: '45-60 min' },
  { id: 'demo', label: 'Product Demo', desc: 'Demostración de producto + cierre', duration: '30-45 min' },
];

export default function WebinarSimulator() {
  const [webinarType, setWebinarType] = useState<WebinarType>('perfect_webinar');
  const [topic, setTopic] = useState('');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [audience, setAudience] = useState('');
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const webinarStore = useGeneratedContent('webinar');

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Define el tema del webinar');
    setIsGenerating(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'webinar',
          webinarType,
          topic,
          product,
          price,
          audience,
          model,
        },
      });
      if (error) throw error;
      setResult(data);
      setActiveSlide(0);
      toast.success('Script de webinar generado');
    } catch (e: any) {
      toast.error(e.message || 'Error generando webinar');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
          <MonitorPlay className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Webinar Simulator</h2>
          <p className="text-xs text-muted-foreground">Genera scripts completos de webinar con las metodologías de los líderes</p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {WEBINAR_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setWebinarType(type.id)}
            className={cn(
              "flex flex-col gap-1 p-4 rounded-xl border transition-all text-left",
              webinarType === type.id
                ? "bg-primary/10 border-primary/30 shadow-md"
                : "bg-muted/20 border-border/30 hover:bg-muted/40"
            )}
          >
            <span className="text-xs font-semibold">{type.label}</span>
            <span className="text-[10px] text-muted-foreground">{type.desc}</span>
            <Badge variant="outline" className="text-[9px] w-fit mt-1">{type.duration}</Badge>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Tema del webinar *</Label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Cómo escalar tu negocio a 6 cifras..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Producto/Oferta</Label>
            <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="Curso, mentoría, software..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Precio</Label>
            <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="$997, $2,497..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Audiencia</Label>
            <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Coaches, emprendedores..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <ModelSelector value={model} onChange={setModel} />
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2 glow-primary">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generar Script
          </Button>
        </div>
      </div>

      {/* Result - Slide View */}
      <AnimatePresence>
        {result?.slides && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Slide navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {result.slides.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeSlide === i
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Active slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2">
                      Slide {activeSlide + 1} / {result.slides.length}
                    </Badge>
                    <h3 className="text-base font-bold">{result.slides[activeSlide]?.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCopy(result.slides[activeSlide]?.script || '')}>
                      <Copy className="w-3 h-3" /> Script
                    </Button>
                  </div>
                </div>

                {result.slides[activeSlide]?.talking_points && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Puntos clave:</p>
                    <ul className="space-y-1">
                      {result.slides[activeSlide].talking_points.map((p: string, j: number) => (
                        <li key={j} className="text-xs flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.slides[activeSlide]?.script && (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                    <p className="text-xs font-semibold mb-1">Script:</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.slides[activeSlide].script}</p>
                  </div>
                )}

                {result.slides[activeSlide]?.notes && (
                  <p className="text-[10px] text-muted-foreground italic">💡 {result.slides[activeSlide].notes}</p>
                )}

                {/* Nav buttons */}
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" disabled={activeSlide === 0} onClick={() => setActiveSlide(a => a - 1)} className="text-xs">
                    ← Anterior
                  </Button>
                  <Button variant="ghost" size="sm" disabled={activeSlide === result.slides.length - 1} onClick={() => setActiveSlide(a => a + 1)} className="text-xs">
                    Siguiente →
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Summary */}
            {result.summary && (
              <div className="glass-panel rounded-xl p-4">
                <p className="text-xs font-semibold mb-1">Resumen de la estructura:</p>
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
