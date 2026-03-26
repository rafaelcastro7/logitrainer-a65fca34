import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Wand2, Loader2, Copy, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';

const SCRIPT_TYPES = [
  { id: 'vsl', name: 'VSL (Video Sales Letter)', desc: 'Script de venta en video 5-15 min', icon: '🎬', duration: '5-15 min' },
  { id: 'webinar', name: 'Perfect Webinar (Brunson)', desc: 'Script de 60 min: 3 secretos + oferta', icon: '🎓', duration: '60-90 min' },
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState('google/gemini-2.5-pro');

  const handleGenerate = async () => {
    if (!product.trim()) { toast.error('Ingresa tu producto/servicio'); return; }
    setIsGenerating(true);

    const typeConfig = SCRIPT_TYPES.find(t => t.id === scriptType);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'chat',
          model,
          prompt: `Eres un experto en copywriting de video ventas al nivel de Russell Brunson y Frank Kern.

Genera un script completo de tipo "${typeConfig?.name}" para:
- Producto: ${product}
- Audiencia: ${audience}
- Beneficio principal: ${mainBenefit}
- Precio: ${price}

${scriptType === 'webinar' ? `
Usa la estructura "Perfect Webinar Script" de Russell Brunson:
1. INTRO (15 min): Hook poderoso, tu historia, la gran promesa
2. SECRETO 1 (15 min): Rompe creencia sobre el VEHÍCULO
3. SECRETO 2 (15 min): Rompe creencia sobre CAPACIDAD INTERNA
4. SECRETO 3 (15 min): Rompe creencia sobre OBSTÁCULOS EXTERNOS
5. THE STACK (10 min): Apila valor, revela precio, bonus, garantía
6. CIERRE (5 min): Urgencia, escasez, CTA final
` : scriptType === 'story_sell' ? `
Usa el "Epiphany Bridge Script" de Russell Brunson:
1. BACKSTORY: Tu situación antes (misma que la audiencia)
2. EL MURO: Lo que intentaste y no funcionó
3. LA EPIFANÍA: El momento de revelación
4. EL PLAN: Los pasos que seguiste
5. LA TRANSFORMACIÓN: Resultados obtenidos
6. LA OFERTA: Cómo pueden lograr lo mismo
` : `
Usa esta estructura para VSL:
1. HOOK (30s): Pregunta provocadora o dato impactante
2. PROBLEMA (2 min): Agita el dolor de la audiencia
3. HISTORIA (3 min): Tu historia personal o de un cliente
4. SOLUCIÓN (3 min): Presenta tu producto como la solución
5. PRUEBA SOCIAL (2 min): Testimonios y resultados
6. OFERTA (2 min): Presenta la oferta completa con bonos
7. CIERRE (1 min): Urgencia, garantía, CTA
`}

Responde en JSON: { "sections": [{ "name": "string", "content": "string (el script palabra por palabra)", "duration": "string", "type": "hook|story|content|offer|close" }] }`,
        },
      });

      if (error) throw error;

      const content = data?.content || '';
      let parsed;
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content.match(/\{[\s\S]*\}/)?.[0]];
        parsed = JSON.parse(jsonMatch[1] || content);
      } catch {
        const objMatch = content.match(/\{[\s\S]*\}/);
        parsed = objMatch ? JSON.parse(objMatch[0]) : null;
      }

      if (parsed?.sections) {
        setSections(parsed.sections);
        toast.success(`🎬 Script ${typeConfig?.name} generado con ${parsed.sections.length} secciones`);
      } else {
        setSections([{ name: 'Script Completo', content, duration: typeConfig?.duration || '', type: 'content' }]);
        toast.success('📝 Script generado');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generando script');
    } finally {
      setIsGenerating(false);
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
              <p className="text-xs text-muted-foreground">{sections.length} secciones</p>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px]">{section.type.toUpperCase()}</Badge>
                    <h4 className="text-sm font-semibold text-foreground">{section.name}</h4>
                    <span className="text-[10px] text-muted-foreground ml-auto">{section.duration}</span>
                  </div>
                  <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed">{section.content}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
