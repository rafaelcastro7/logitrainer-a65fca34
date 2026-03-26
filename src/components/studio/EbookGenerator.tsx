import { useState } from 'react';
import { BookOpen, Sparkles, Download, FileText, Loader2, ChevronRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';

const NICHES = [
  { id: 'fitness', label: '💪 Fitness & Salud', color: 'bg-success/10 text-success' },
  { id: 'finanzas', label: '💰 Finanzas Personales', color: 'bg-warning/10 text-warning' },
  { id: 'desarrollo', label: '🧠 Desarrollo Personal', color: 'bg-primary/10 text-primary' },
  { id: 'marketing', label: '📈 Marketing Digital', color: 'bg-accent/10 text-accent' },
  { id: 'negocios', label: '🏢 Negocios & Emprendimiento', color: 'bg-destructive/10 text-destructive' },
  { id: 'cocina', label: '🍳 Cocina & Recetas', color: 'bg-warning/10 text-warning' },
  { id: 'tecnologia', label: '💻 Tecnología', color: 'bg-primary/10 text-primary' },
  { id: 'custom', label: '✨ Personalizado', color: 'bg-muted text-muted-foreground' },
];

const TEMPLATES = [
  { id: 'guia', name: 'Guía Práctica', desc: 'Paso a paso con ejercicios y tips', chapters: 8 },
  { id: 'curso', name: 'Curso Completo', desc: 'Estructura de curso con módulos', chapters: 12 },
  { id: 'checklist', name: 'Checklist Accionable', desc: 'Listas y frameworks rápidos', chapters: 6 },
  { id: 'storytelling', name: 'Historia + Enseñanza', desc: 'Narrativa con lecciones', chapters: 10 },
];

interface Chapter {
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'done';
}

export default function EbookGenerator() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('marketing');
  const [template, setTemplate] = useState('guia');
  const [chaptersCount, setChaptersCount] = useState(8);
  const [language, setLanguage] = useState('es');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ebookTitle, setEbookTitle] = useState('');
  const [currentStep, setCurrentStep] = useState<'config' | 'generating' | 'review'>('config');
  const [model, setModel] = useState('google/gemini-2.5-pro');

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Ingresa un tema para el ebook'); return; }
    setIsGenerating(true);
    setCurrentStep('generating');
    setChapters([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'ebook',
          topic,
          niche,
          template,
          chaptersCount,
          language,
          model,
        },
      });

      if (error) throw error;

      setEbookTitle(data.title || topic);
      setChapters(data.chapters.map((ch: any) => ({
        title: ch.title,
        content: ch.content,
        status: 'done' as const,
      })));
      setCurrentStep('review');
      toast.success(`📚 Ebook "${data.title}" generado con ${data.chapters.length} capítulos`);
    } catch (err) {
      console.error('Ebook generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generando ebook');
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    const md = `# ${ebookTitle}\n\n${chapters.map((ch, i) => `## Capítulo ${i + 1}: ${ch.title}\n\n${ch.content}`).join('\n\n---\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ebookTitle.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Ebook exportado como Markdown');
  };

  const handleExportHTML = () => {
    const html = `<!DOCTYPE html><html lang="${language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ebookTitle}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia',serif;max-width:720px;margin:0 auto;padding:40px 20px;background:#fefefe;color:#1a1a1a;line-height:1.8}h1{font-size:2.5em;margin-bottom:10px;color:#1a1a1a;border-bottom:3px solid #6c5ce7;padding-bottom:15px}h2{font-size:1.6em;margin:40px 0 15px;color:#2d3436;border-left:4px solid #6c5ce7;padding-left:12px}p{margin-bottom:16px;text-align:justify}hr{border:none;border-top:1px solid #ddd;margin:40px 0}.chapter{page-break-before:always}</style></head><body><h1>${ebookTitle}</h1>${chapters.map((ch, i) => `<div class="chapter"><h2>Capítulo ${i + 1}: ${ch.title}</h2>${ch.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}</div><hr>`).join('')}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ebookTitle.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Ebook exportado como HTML (imprimible a PDF)');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Generador de Ebooks</h2>
          <p className="text-xs text-muted-foreground">Crea libros digitales profesionales con IA en minutos</p>
        </div>
      </div>

      {currentStep === 'config' && (
        <div className="space-y-6">
          {/* Niche Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nicho</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {NICHES.map(n => (
                <button
                  key={n.id}
                  onClick={() => setNiche(n.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    niche === n.id
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "border-border/30 bg-card hover:border-border/60 text-muted-foreground"
                  )}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tema del Ebook</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Cómo crear un negocio online desde cero con $100..."
              className="min-h-[80px] text-sm"
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Plantilla</label>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <Card
                  key={t.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all border",
                    template === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/30 hover:border-border/60"
                  )}
                  onClick={() => { setTemplate(t.id); setChaptersCount(t.chapters); }}
                >
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{t.chapters} capítulos</Badge>
                </Card>
              ))}
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Capítulos</label>
              <span className="text-xs font-mono text-primary">{chaptersCount}</span>
            </div>
            <Slider value={[chaptersCount]} onValueChange={([v]) => setChaptersCount(v)} min={4} max={20} step={1} />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Idioma</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="pt">🇧🇷 Português</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ModelSelector value={model} onChange={setModel} />

          <Button onClick={handleGenerate} className="w-full glow-primary gap-2" size="lg">
            <Wand2 className="w-4 h-4" /> Generar Ebook Completo con IA
          </Button>
        </div>
      )}

      {currentStep === 'generating' && (
        <Card className="p-8 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-foreground">Generando tu ebook...</p>
          <p className="text-xs text-muted-foreground">La IA está escribiendo {chaptersCount} capítulos sobre "{topic}"</p>
        </Card>
      )}

      {currentStep === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">{ebookTitle}</h3>
              <p className="text-xs text-muted-foreground">{chapters.length} capítulos generados</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> Markdown
              </Button>
              <Button size="sm" onClick={handleExportHTML} className="gap-1.5 text-xs glow-primary">
                <Download className="w-3.5 h-3.5" /> HTML/PDF
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {chapters.map((ch, i) => (
              <Card key={i} className="p-4 border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">Cap. {i + 1}</Badge>
                  <h4 className="text-sm font-semibold text-foreground">{ch.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line">{ch.content}</p>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={() => setCurrentStep('config')} className="w-full gap-2">
            <Sparkles className="w-4 h-4" /> Crear otro Ebook
          </Button>
        </div>
      )}
    </div>
  );
}
