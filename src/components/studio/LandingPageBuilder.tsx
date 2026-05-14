import { useState } from 'react';
import { Layout, Sparkles, Download, Eye, Loader2, Wand2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';

const LANDING_TEMPLATES = [
  { id: 'vsl', name: 'VSL / Webinar', desc: 'Video de venta con countdown y CTA', icon: '🎬' },
  { id: 'ebook', name: 'Lead Magnet', desc: 'Captura emails con ebook gratis', icon: '📚' },
  { id: 'curso', name: 'Lanzamiento de Curso', desc: 'Módulos, testimonios y garantía', icon: '🎓' },
  { id: 'producto', name: 'Producto Digital', desc: 'Features, pricing y social proof', icon: '🚀' },
  { id: 'consultoria', name: 'Consultoría / Servicio', desc: 'Agenda una llamada, casos de éxito', icon: '📞' },
  { id: 'evento', name: 'Evento / Masterclass', desc: 'Registro con countdown', icon: '🎤' },
];

export default function LandingPageBuilder() {
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [template, setTemplate] = useState('curso');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleGenerate = async () => {
    if (!productName.trim()) { toast.error('Ingresa el nombre del producto'); return; }
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'landing',
          productName,
          productDesc,
          targetAudience,
          template,
        },
      });

      if (error) throw error;
      setGeneratedHTML(data.html);
      setPreviewMode(true);
      toast.success('🎯 Landing page generada');
    } catch (err) {
      console.error('Landing generation error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generando landing');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-landing.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Landing exportada como HTML');
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(generatedHTML);
    toast.success('📋 HTML copiado al portapapeles');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
          <Layout className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Landing Page Builder</h2>
          <p className="text-xs text-muted-foreground">Crea landing pages de alta conversión con IA</p>
        </div>
      </div>

      {!previewMode ? (
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Landing</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANDING_TEMPLATES.map(t => (
                <Card
                  key={t.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all border",
                    template === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/30 hover:border-border/60"
                  )}
                  onClick={() => setTemplate(t.id)}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Producto</label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ej: Curso Maestro de Instagram" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audiencia Objetivo</label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ej: Emprendedores digitales 25-45 años" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción del Producto</label>
            <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Describe tu producto, beneficios principales y qué problema resuelve..." className="min-h-[100px]" />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full glow-primary gap-2" size="lg">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isGenerating ? 'Generando landing...' : 'Generar Landing Page'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Preview</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)} className="text-xs">← Editar</Button>
              <Button variant="outline" size="sm" onClick={handleCopyHTML} className="gap-1.5 text-xs"><Copy className="w-3 h-3" /> Copiar HTML</Button>
              <Button size="sm" onClick={handleExport} className="gap-1.5 text-xs glow-primary"><Download className="w-3 h-3" /> Exportar</Button>
            </div>
          </div>

          <Card className="border-border/30 overflow-hidden">
            <iframe
              srcDoc={generatedHTML}
              className="w-full h-[600px] bg-white"
              title="Landing Preview"
              sandbox="allow-scripts"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
