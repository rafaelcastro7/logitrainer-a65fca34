import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, TrendingUp, FileText, Sparkles, Loader2,
  ExternalLink, Copy, BarChart3, Target, Lightbulb, Zap
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

type ResearchType = 'competitor' | 'trend' | 'audience' | 'keywords' | 'strategy';

const RESEARCH_TYPES: { id: ResearchType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'competitor', label: 'Competencia', icon: Target, desc: 'Analiza competidores y sus estrategias' },
  { id: 'trend', label: 'Tendencias', icon: TrendingUp, desc: 'Descubre tendencias del mercado' },
  { id: 'audience', label: 'Audiencia', icon: Search, desc: 'Perfila tu audiencia ideal' },
  { id: 'keywords', label: 'Keywords', icon: Zap, desc: 'Investiga palabras clave y SEO' },
  { id: 'strategy', label: 'Estrategia', icon: Lightbulb, desc: 'Plan estratégico completo' },
];

export default function ResearchAIPanel() {
  const [researchType, setResearchType] = useState<ResearchType>('competitor');
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('');
  const [model, setModel] = useState('google/gemini-2.5-pro');
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleResearch = async () => {
    if (!query.trim()) return toast.error('Define tu consulta de investigación');
    setIsResearching(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'research',
          researchType,
          query,
          niche,
          model,
        },
      });
      if (error) throw error;
      setResult(data);
      toast.success('Investigación completada');
    } catch (e: any) {
      toast.error(e.message || 'Error en la investigación');
    } finally {
      setIsResearching(false);
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
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Research AI</h2>
          <p className="text-xs text-muted-foreground">Inteligencia de mercado impulsada por IA para decisiones estratégicas</p>
        </div>
      </div>

      {/* Research Type */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {RESEARCH_TYPES.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setResearchType(type.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                researchType === type.id
                  ? "bg-primary/10 border-primary/30 text-primary shadow-md"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">
              {researchType === 'competitor' ? '¿Qué competidores o industria quieres analizar?' :
               researchType === 'trend' ? '¿Qué mercado o tendencia investigar?' :
               researchType === 'audience' ? '¿Qué producto o servicio ofreces?' :
               researchType === 'keywords' ? '¿Tema o nicho para buscar keywords?' :
               '¿Qué negocio o proyecto necesita estrategia?'}
            </Label>
            <Textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                researchType === 'competitor' ? 'Ej: Principales competidores de cursos online de marketing digital en LATAM...' :
                researchType === 'trend' ? 'Ej: Tendencias en generación de contenido con IA para 2025...' :
                researchType === 'audience' ? 'Ej: Curso de marketing digital para emprendedores...' :
                researchType === 'keywords' ? 'Ej: Marketing digital, inbound marketing, funnels de venta...' :
                'Ej: Lanzar un SaaS de automatización de marketing...'
              }
              className="bg-muted/50 border-border/50 text-sm min-h-[70px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nicho / Industria (opcional)</Label>
            <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Marketing digital, fitness, fintech..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="flex items-end">
            <ModelSelector value={model} onChange={setModel} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleResearch} disabled={isResearching} className="gap-2 glow-primary">
            {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Investigar
          </Button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary */}
            {result.summary && (
              <div className="glass-panel rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Resumen Ejecutivo
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCopy(result.summary)}>
                    <Copy className="w-3 h-3" /> Copiar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
              </div>
            )}

            {/* Key Findings */}
            {result.findings && result.findings.length > 0 && (
              <div className="glass-panel rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" /> Hallazgos Clave
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.findings.map((finding: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/20 space-y-1">
                      <p className="text-xs font-semibold">{finding.title}</p>
                      <p className="text-[11px] text-muted-foreground">{finding.detail}</p>
                      {finding.impact && (
                        <Badge variant="outline" className="text-[9px]">{finding.impact}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="glass-panel rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Recomendaciones
                </h3>
                <div className="space-y-2">
                  {result.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                      <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                      <p className="text-xs">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            {result.actionPlan && (
              <div className="glass-panel rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Plan de Acción
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCopy(result.actionPlan)}>
                    <Copy className="w-3 h-3" /> Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.actionPlan}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
