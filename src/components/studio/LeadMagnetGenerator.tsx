import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Magnet, FileText, Calculator, CheckSquare, Video, BookOpen,
  Sparkles, Loader2, Download, Copy, Lightbulb, Target, Zap, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ModelSelector from './ModelSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';

type MagnetType = 'checklist' | 'calculator' | 'mini-course' | 'template' | 'cheatsheet' | 'quiz';

const MAGNET_TYPES: { id: MagnetType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'checklist', label: 'Checklist', icon: CheckSquare, desc: 'Lista paso a paso descargable' },
  { id: 'calculator', label: 'Calculadora', icon: Calculator, desc: 'Herramienta interactiva de cálculo' },
  { id: 'mini-course', label: 'Mini-Curso', icon: Video, desc: 'Curso de 3-5 lecciones por email' },
  { id: 'template', label: 'Template', icon: FileText, desc: 'Plantilla lista para usar' },
  { id: 'cheatsheet', label: 'Cheat Sheet', icon: BookOpen, desc: 'Guía rápida de referencia' },
  { id: 'quiz', label: 'Quiz/Assessment', icon: Lightbulb, desc: 'Evaluación interactiva' },
];

export default function LeadMagnetGenerator() {
  const [magnetType, setMagnetType] = useState<MagnetType>('checklist');
  const [niche, setNiche] = useState('');
  const [audience, setAudience] = useState('');
  const [problem, setProblem] = useState('');
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const [result, setResult] = useState<any>(null);
  const { generate, stop, isGenerating, streamText, progress } = useStreamingGeneration();

  const handleGenerate = async () => {
    if (!niche.trim()) return toast.error('Define tu nicho');
    setResult(null);
    try {
      await generate(
        { type: 'lead_magnet', magnetType, niche, audience, problem, model },
        {
          onComplete: (data) => {
            setResult(data);
            toast.success('🧲 Lead magnet profesional generado');
          },
          onError: (msg) => toast.error(msg),
        }
      );
    } catch (e: any) {
      toast.error(e.message || 'Error generando lead magnet');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handleExport = () => {
    if (!result) return;
    const md = `# ${result.title}\n\n> ${result.hook}\n\n${result.description}\n\n---\n\n${(result.sections || []).map((s: any) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n')}\n\n---\n\n## Landing Page Copy\n\n${result.landingCopy || ''}\n\n**CTA:** ${result.cta || ''}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lead-magnet-${magnetType}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Lead magnet exportado');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
          <Magnet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Lead Magnet Generator</h2>
          <p className="text-xs text-muted-foreground">Crea lead magnets irresistibles que conviertan visitantes en suscriptores</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MAGNET_TYPES.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setMagnetType(type.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                magnetType === type.id
                  ? "bg-primary/10 border-primary/30 text-primary shadow-md"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{type.label}</span>
              <span className="text-[10px] text-muted-foreground">{type.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nicho / Industria *</Label>
            <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Marketing digital, fitness, finanzas..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Audiencia objetivo</Label>
            <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Emprendedores, coaches, freelancers..." className="bg-muted/50 border-border/50 h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Problema principal que resuelve</Label>
          <Textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="¿Qué dolor o frustración tiene tu audiencia?" className="bg-muted/50 border-border/50 text-sm min-h-[60px]" />
        </div>
        <ModelSelector value={model} onChange={setModel} />

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-center">{Math.round(progress)}% · Generando lead magnet en streaming...</p>
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

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2 glow-primary" size="lg">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Generando...' : 'Generar Lead Magnet Profesional'}
        </Button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {result.title || 'Lead Magnet'}
                </h3>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleCopy(JSON.stringify(result, null, 2))}>
                    <Copy className="w-3 h-3" /> Copiar
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1 glow-primary" onClick={handleExport}>
                    <Download className="w-3 h-3" /> Exportar
                  </Button>
                </div>
              </div>
              {result.hook && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-semibold text-primary mb-1">Hook / Headline</p>
                  <p className="text-sm font-medium">{result.hook}</p>
                </div>
              )}
              {result.description && (
                <p className="text-sm text-muted-foreground">{result.description}</p>
              )}
              {result.sections && result.sections.map((section: any, i: number) => (
                <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/20 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary" /> {section.title}
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {result.cta && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs font-semibold text-accent-foreground mb-1">Call to Action</p>
                  <p className="text-sm font-medium">{result.cta}</p>
                </div>
              )}
              {result.landingCopy && (
                <div className="p-4 rounded-lg bg-muted/20 border border-border/20">
                  <p className="text-xs font-semibold mb-2">📄 Copy para Landing Page</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.landingCopy}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
