import { useState } from 'react';
import { BookOpen, Sparkles, Download, FileText, Loader2, ChevronRight, Wand2, Copy, Eye, EyeOff, Code, Lightbulb, CheckCircle2, ChevronDown, ChevronUp, Image as ImageIcon, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';

const NICHES = [
  { id: 'fitness', label: '💪 Fitness & Salud' },
  { id: 'finanzas', label: '💰 Finanzas' },
  { id: 'desarrollo', label: '🧠 Desarrollo Personal' },
  { id: 'marketing', label: '📈 Marketing Digital' },
  { id: 'negocios', label: '🏢 Negocios' },
  { id: 'cocina', label: '🍳 Cocina & Recetas' },
  { id: 'tecnologia', label: '💻 Tecnología' },
  { id: 'programacion', label: '👨‍💻 Programación' },
  { id: 'diseno', label: '🎨 Diseño' },
  { id: 'educacion', label: '📚 Educación' },
  { id: 'custom', label: '✨ Otro' },
];

const TEMPLATES = [
  { id: 'guia', name: '📘 Guía Práctica', desc: 'Paso a paso con ejercicios y tips prácticos', chapters: 8 },
  { id: 'curso', name: '🎓 Curso Completo', desc: 'Estructura educativa con módulos y tareas', chapters: 12 },
  { id: 'tecnico', name: '💻 Guía Técnica', desc: 'Con código, ejemplos, APIs y configuración', chapters: 10 },
  { id: 'playbook', name: '🚀 Playbook Marketing', desc: 'Frameworks, templates y swipe files', chapters: 8 },
  { id: 'workbook', name: '📝 Workbook Interactivo', desc: 'Ejercicios, quizzes y plantillas', chapters: 8 },
  { id: 'checklist', name: '✅ Checklist Accionable', desc: 'Listas y frameworks para ejecución rápida', chapters: 6 },
  { id: 'storytelling', name: '📖 Historia + Enseñanza', desc: 'Narrativa con lecciones y casos reales', chapters: 10 },
];

const DETAIL_LEVELS = [
  { id: 'standard', label: 'Estándar', desc: '300-500 palabras/cap', words: '~4,000' },
  { id: 'detailed', label: 'Detallado', desc: '500-800 palabras/cap', words: '~8,000' },
  { id: 'extensive', label: 'Extenso', desc: '800-1,200 palabras/cap', words: '~12,000' },
];

interface Chapter {
  title: string;
  content: string;
  keyTakeaways?: string[];
  exercises?: string[];
}

export default function EbookGenerator() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('marketing');
  const [template, setTemplate] = useState('guia');
  const [chaptersCount, setChaptersCount] = useState(8);
  const [language, setLanguage] = useState('es');
  const [detailLevel, setDetailLevel] = useState('detailed');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ebookTitle, setEbookTitle] = useState('');
  const [ebookSubtitle, setEbookSubtitle] = useState('');
  const [currentStep, setCurrentStep] = useState<'config' | 'generating' | 'review'>('config');
  const [model, setModel] = useState('google/gemini-2.5-pro');
  const [expandedChapter, setExpandedChapter] = useState<number | null>(0);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const { generate, stop, isGenerating: isStreaming, streamText, progress } = useStreamingGeneration();

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Ingresa un tema para el ebook'); return; }
    setIsGenerating(true);
    setCurrentStep('generating');
    setChapters([]);

    try {
      const result = await generate(
        { type: 'ebook', topic, niche, template, chaptersCount, language, model, detailLevel },
        {
          onComplete: (data) => {
            setEbookTitle(data.title || topic);
            setEbookSubtitle(data.subtitle || '');
            setChapters((data.chapters || []).map((ch: any) => ({
              title: ch.title,
              content: ch.content,
              keyTakeaways: ch.keyTakeaways || [],
              exercises: ch.exercises || [],
            })));
            setExpandedChapter(0);
            setCurrentStep('review');
            toast.success(`📚 "${data.title}" generado — ${data.chapters?.length || 0} capítulos`);
          },
          onError: (msg) => {
            toast.error(msg);
            setCurrentStep('config');
          },
        }
      );
    } catch (err) {
      console.error('Ebook generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generando ebook');
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyChapter = (ch: Chapter, i: number) => {
    navigator.clipboard.writeText(`## Capítulo ${i + 1}: ${ch.title}\n\n${ch.content}`);
    toast.success('Capítulo copiado');
  };

  const handleExportMarkdown = () => {
    const md = `# ${ebookTitle}\n${ebookSubtitle ? `*${ebookSubtitle}*\n` : ''}\n---\n\n` +
      chapters.map((ch, i) => {
        let section = `## Capítulo ${i + 1}: ${ch.title}\n\n${ch.content}`;
        if (ch.keyTakeaways?.length) {
          section += `\n\n### 🎯 Puntos Clave\n${ch.keyTakeaways.map(t => `- ${t}`).join('\n')}`;
        }
        if (ch.exercises?.length) {
          section += `\n\n### 📝 Ejercicios\n${ch.exercises.map((e, j) => `${j + 1}. ${e}`).join('\n')}`;
        }
        return section;
      }).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${ebookTitle.replace(/\s+/g, '_')}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Exportado como Markdown');
  };

  const handleExportHTML = () => {
    const chaptersHtml = chapters.map((ch, i) => {
      const contentHtml = ch.content
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        .split('\n').filter(p => p.trim()).map(p => {
          if (p.startsWith('<')) return p;
          return `<p>${p}</p>`;
        }).join('\n');
      
      let extras = '';
      if (ch.keyTakeaways?.length) {
        extras += `<div class="takeaways"><h4>🎯 Puntos Clave</h4><ul>${ch.keyTakeaways.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
      }
      if (ch.exercises?.length) {
        extras += `<div class="exercises"><h4>📝 Ejercicios</h4><ol>${ch.exercises.map(e => `<li>${e}</li>`).join('')}</ol></div>`;
      }
      return `<div class="chapter"><h2>Capítulo ${i + 1}: ${ch.title}</h2>${contentHtml}${extras}</div>`;
    }).join('<hr>');

    const html = `<!DOCTYPE html><html lang="${language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ebookTitle}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;max-width:760px;margin:0 auto;padding:40px 24px;background:#fefefe;color:#1a1a1a;line-height:1.9;font-size:16px}h1{font-size:2.4em;margin-bottom:8px;color:#1a1a1a;border-bottom:3px solid #6c5ce7;padding-bottom:15px}h1+p{font-size:1.1em;color:#636e72;margin-bottom:30px;font-style:italic}h2{font-size:1.5em;margin:50px 0 20px;color:#2d3436;border-left:4px solid #6c5ce7;padding-left:14px}h3{font-size:1.2em;margin:30px 0 12px;color:#2d3436}h4{font-size:1em;margin:20px 0 8px;color:#6c5ce7}p{margin-bottom:14px;text-align:justify}hr{border:none;border-top:1px solid #dfe6e9;margin:40px 0}.chapter{page-break-before:always}pre.code-block{background:#2d3436;color:#dfe6e9;padding:16px 20px;border-radius:8px;overflow-x:auto;margin:16px 0;font-family:'JetBrains Mono','Fira Code',monospace;font-size:13px;line-height:1.6;border-left:4px solid #6c5ce7}code.inline-code{background:#f1f2f6;color:#e17055;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:0.9em}blockquote{border-left:4px solid #fdcb6e;background:#ffeaa715;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-style:italic;color:#636e72}ul,ol{margin:12px 0 12px 24px}li{margin-bottom:6px}.takeaways{background:#6c5ce710;border:1px solid #6c5ce720;border-radius:10px;padding:16px 20px;margin:20px 0}.takeaways h4{color:#6c5ce7;margin-bottom:10px}.exercises{background:#00b89410;border:1px solid #00b89420;border-radius:10px;padding:16px 20px;margin:20px 0}.exercises h4{color:#00b894;margin-bottom:10px}strong{color:#2d3436}@media print{body{max-width:100%;padding:20px}.chapter{page-break-before:always}pre.code-block{border:1px solid #ccc;background:#f8f9fa;color:#2d3436}}</style></head><body><h1>${ebookTitle}</h1>${ebookSubtitle ? `<p>${ebookSubtitle}</p>` : ''}${chaptersHtml}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${ebookTitle.replace(/\s+/g, '_')}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 HTML exportado — ábrelo y usa Ctrl+P para guardar como PDF');
  };

  const handleCopyAll = () => {
    const full = chapters.map((ch, i) => `## Capítulo ${i + 1}: ${ch.title}\n\n${ch.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(full);
    toast.success('Todo el contenido copiado');
  };

  const wordCount = chapters.reduce((s, c) => s + (c.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Generador de Ebooks Pro</h2>
          <p className="text-xs text-muted-foreground">Libros digitales profesionales con contenido rico, código, ejemplos y ejercicios</p>
        </div>
      </div>

      {currentStep === 'config' && (
        <div className="space-y-6">
          {/* Niche */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nicho</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n.id} onClick={() => setNiche(n.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    niche === n.id ? "border-primary bg-primary/10 text-primary" : "border-border/30 bg-card text-muted-foreground hover:border-border/60"
                  )}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tema del Ebook *</label>
            <Textarea value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Sé específico. Ej: 'Guía completa de React Hooks con ejemplos prácticos para desarrolladores intermedios' o 'Playbook de Facebook Ads para ecommerce con presupuesto bajo'"
              className="min-h-[80px] text-sm" />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de contenido</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t.id); setChaptersCount(t.chapters); }}
                  className={cn("p-3 rounded-xl border text-left transition-all",
                    template === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
                  )}>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                  <Badge variant="secondary" className="mt-1.5 text-[9px]">{t.chapters} caps</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nivel de detalle</label>
            <div className="grid grid-cols-3 gap-3">
              {DETAIL_LEVELS.map(d => (
                <button key={d.id} onClick={() => setDetailLevel(d.id)}
                  className={cn("p-3 rounded-xl border text-center transition-all",
                    detailLevel === d.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
                  )}>
                  <p className="text-xs font-semibold">{d.label}</p>
                  <p className="text-[10px] text-muted-foreground">{d.desc}</p>
                  <Badge variant="outline" className="mt-1 text-[9px]">~{d.words} palabras</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Chapters + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Capítulos</label>
                <span className="text-xs font-mono text-primary">{chaptersCount}</span>
              </div>
              <Slider value={[chaptersCount]} onValueChange={([v]) => setChaptersCount(v)} min={4} max={20} step={1} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Idioma</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="pt">🇧🇷 Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ModelSelector value={model} onChange={setModel} />

          <Button onClick={handleGenerate} className="w-full glow-primary gap-2" size="lg">
            <Wand2 className="w-4 h-4" /> Generar Ebook Profesional
          </Button>
        </div>
      )}

      {currentStep === 'generating' && (
        <Card className="p-10 text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div>
            <p className="text-sm font-semibold">Escribiendo tu ebook en tiempo real...</p>
            <p className="text-xs text-muted-foreground mt-1">Generando {chaptersCount} capítulos con contenido {detailLevel === 'extensive' ? 'extenso' : detailLevel === 'detailed' ? 'detallado' : 'estándar'}</p>
            <div className="mt-3 max-w-xs mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">{Math.round(progress)}% completado · {streamText.length.toLocaleString()} caracteres</p>
            </div>
            {streamText && (
              <div className="mt-4 text-left max-h-40 overflow-y-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                {streamText.slice(-500)}
                <span className="inline-block w-1.5 h-3 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
              </div>
            )}
            <Button variant="destructive" size="sm" className="mt-3 gap-1.5" onClick={stop}>
              <Square className="w-3 h-3" /> Detener
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 'review' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{ebookTitle}</h3>
                {ebookSubtitle && <p className="text-sm text-muted-foreground mt-1">{ebookSubtitle}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-[10px]">{chapters.length} capítulos</Badge>
                  <Badge variant="outline" className="text-[10px]">~{wordCount.toLocaleString()} palabras</Badge>
                  <Badge variant="outline" className="text-[10px]">{TEMPLATES.find(t => t.id === template)?.name}</Badge>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={handleCopyAll} className="h-7 text-xs gap-1">
                  <Copy className="w-3 h-3" /> Todo
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="h-7 text-xs gap-1">
                  <FileText className="w-3 h-3" /> .md
                </Button>
                <Button size="sm" onClick={handleExportHTML} className="h-7 text-xs gap-1 glow-primary">
                  <Download className="w-3 h-3" /> HTML/PDF
                </Button>
              </div>
            </div>
          </div>

          {/* TOC */}
          <div className="glass-panel rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">📋 Tabla de contenidos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {chapters.map((ch, i) => (
                <button key={i} onClick={() => { setExpandedChapter(i); }}
                  className={cn("text-left px-2 py-1 rounded text-[11px] transition-all truncate",
                    expandedChapter === i ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"
                  )}>
                  {i + 1}. {ch.title}
                </button>
              ))}
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            {chapters.map((ch, i) => {
              const isExpanded = expandedChapter === i;
              return (
                <Card key={i} className={cn("border-border/30 overflow-hidden transition-all", isExpanded && "ring-1 ring-primary/20")}>
                  <button onClick={() => setExpandedChapter(isExpanded ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                      <div>
                        <h4 className="text-sm font-semibold">{ch.title}</h4>
                        <span className="text-[10px] text-muted-foreground">{ch.content?.split(/\s+/).length || 0} palabras</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleCopyChapter(ch, i); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Rich content with markdown */}
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        prose-headings:text-foreground prose-headings:font-semibold
                        prose-p:text-muted-foreground prose-p:leading-relaxed
                        prose-strong:text-foreground
                        prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                        prose-pre:bg-card prose-pre:border prose-pre:border-border/30 prose-pre:rounded-lg
                        prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                        prose-li:text-muted-foreground
                        prose-a:text-primary">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{ch.content}</ReactMarkdown>
                      </div>

                      {/* Key Takeaways */}
                      {ch.keyTakeaways && ch.keyTakeaways.length > 0 && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                          <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                            <Lightbulb className="w-3.5 h-3.5" /> Puntos Clave
                          </p>
                          <ul className="space-y-1">
                            {ch.keyTakeaways.map((t, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Exercises */}
                      {ch.exercises && ch.exercises.length > 0 && (
                        <div className="p-3 rounded-lg bg-accent/5 border border-accent/10 space-y-2">
                          <p className="text-xs font-semibold flex items-center gap-1.5 text-accent-foreground">
                            <Code className="w-3.5 h-3.5" /> Ejercicios Prácticos
                          </p>
                          <ol className="space-y-1 list-decimal list-inside">
                            {ch.exercises.map((e, j) => (
                              <li key={j} className="text-xs text-muted-foreground">{e}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <Button variant="outline" onClick={() => { setCurrentStep('config'); setChapters([]); }} className="w-full gap-2">
            <Sparkles className="w-4 h-4" /> Crear otro Ebook
          </Button>
        </div>
      )}
    </div>
  );
}
