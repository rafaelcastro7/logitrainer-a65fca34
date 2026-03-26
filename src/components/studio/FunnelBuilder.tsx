import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Plus, Trash2, Wand2, Loader2, Copy, Download, DollarSign, Users, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';

interface FunnelStep {
  id: string;
  type: 'lead_magnet' | 'tripwire' | 'core_offer' | 'profit_maximizer' | 'custom';
  name: string;
  description: string;
  price: string;
  conversionGoal: string;
  copyHook: string;
}

const FUNNEL_TEMPLATES = [
  {
    id: 'value_ladder',
    name: 'Value Ladder (Brunson)',
    desc: 'Lead Magnet → Tripwire → Core → Backend',
    icon: '📈',
    steps: [
      { type: 'lead_magnet' as const, name: 'Lead Magnet', price: 'Gratis', conversionGoal: 'Captura email' },
      { type: 'tripwire' as const, name: 'Oferta Tripwire', price: '$7-$47', conversionGoal: 'Primera compra' },
      { type: 'core_offer' as const, name: 'Oferta Principal', price: '$97-$497', conversionGoal: 'Producto core' },
      { type: 'profit_maximizer' as const, name: 'Profit Maximizer', price: '$997-$5,000+', conversionGoal: 'High-ticket' },
    ],
  },
  {
    id: 'webinar',
    name: 'Webinar Funnel (Brunson)',
    desc: 'Registro → Webinar → Oferta → Upsell',
    icon: '🎓',
    steps: [
      { type: 'lead_magnet' as const, name: 'Página de Registro', price: 'Gratis', conversionGoal: 'Registro webinar' },
      { type: 'core_offer' as const, name: 'Webinar + Oferta', price: '$497-$1,997', conversionGoal: 'Venta principal' },
      { type: 'profit_maximizer' as const, name: 'Upsell / Coaching', price: '$2,000-$10,000', conversionGoal: 'High-ticket' },
    ],
  },
  {
    id: 'challenge',
    name: 'Challenge Funnel',
    desc: 'Reto gratuito → Oferta → Upsell',
    icon: '🏆',
    steps: [
      { type: 'lead_magnet' as const, name: 'Challenge 5 días', price: 'Gratis', conversionGoal: 'Participación' },
      { type: 'tripwire' as const, name: 'Kit Premium', price: '$27', conversionGoal: 'Upgrade' },
      { type: 'core_offer' as const, name: 'Programa Completo', price: '$297-$997', conversionGoal: 'Conversión' },
    ],
  },
  {
    id: 'cash_machine',
    name: '4-Day Cash Machine (Kern)',
    desc: 'Urgencia + Escasez en 4 días',
    icon: '💰',
    steps: [
      { type: 'lead_magnet' as const, name: 'Día 1: Historia + Valor', price: 'Email', conversionGoal: 'Engagement' },
      { type: 'tripwire' as const, name: 'Día 2: Prueba Social', price: 'Email', conversionGoal: 'Anticipación' },
      { type: 'core_offer' as const, name: 'Día 3: Oferta + Urgencia', price: 'Variable', conversionGoal: 'Venta' },
      { type: 'profit_maximizer' as const, name: 'Día 4: Último Aviso', price: 'Variable', conversionGoal: 'Cierre' },
    ],
  },
];

const STEP_COLORS: Record<string, string> = {
  lead_magnet: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  tripwire: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  core_offer: 'from-primary/20 to-primary/5 border-primary/30',
  profit_maximizer: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  custom: 'from-muted to-muted/50 border-border/50',
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  lead_magnet: <Users className="w-4 h-4 text-emerald-500" />,
  tripwire: <Zap className="w-4 h-4 text-blue-500" />,
  core_offer: <Target className="w-4 h-4 text-primary" />,
  profit_maximizer: <DollarSign className="w-4 h-4 text-amber-500" />,
  custom: <Plus className="w-4 h-4 text-muted-foreground" />,
};

export default function FunnelBuilder() {
  const [niche, setNiche] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState('google/gemini-3-flash-preview');

  const applyTemplate = (templateId: string) => {
    const tpl = FUNNEL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    setSteps(tpl.steps.map((s, i) => ({
      id: crypto.randomUUID(),
      type: s.type,
      name: s.name,
      description: '',
      price: s.price,
      conversionGoal: s.conversionGoal,
      copyHook: '',
    })));
  };

  const handleGenerateCopy = async () => {
    if (!niche.trim()) { toast.error('Ingresa tu nicho primero'); return; }
    if (steps.length === 0) { toast.error('Selecciona una plantilla de funnel'); return; }
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'chat',
          model,
          prompt: `Genera copy de marketing para cada paso de mi funnel. Nicho: "${niche}". 
Pasos del funnel:
${steps.map((s, i) => `${i + 1}. ${s.name} (${s.type}) - Precio: ${s.price} - Meta: ${s.conversionGoal}`).join('\n')}

Para CADA paso genera:
- Hook (una frase gancho)
- Descripción de la oferta (2-3 líneas)
- CTA sugerido

Responde en formato JSON: { "steps": [{ "hook": "...", "description": "...", "cta": "..." }] }`,
        },
      });

      if (error) throw error;

      try {
        const content = data?.content || '';
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[1] || jsonMatch?.[0] || content);
        
        if (parsed.steps) {
          setSteps(prev => prev.map((step, i) => ({
            ...step,
            copyHook: parsed.steps[i]?.hook || step.copyHook,
            description: parsed.steps[i]?.description || step.description,
            conversionGoal: parsed.steps[i]?.cta || step.conversionGoal,
          })));
          toast.success('✨ Copy generado para todos los pasos del funnel');
        }
      } catch {
        toast.info('Copy generado como texto libre');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generando copy');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStep = (id: string, updates: Partial<FunnelStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const addStep = () => {
    setSteps(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'custom',
      name: 'Nuevo Paso',
      description: '',
      price: '',
      conversionGoal: '',
      copyHook: '',
    }]);
  };

  const exportFunnel = () => {
    const md = `# Funnel: ${niche}\n\n${steps.map((s, i) => 
      `## Paso ${i + 1}: ${s.name}\n- **Tipo:** ${s.type}\n- **Precio:** ${s.price}\n- **Hook:** ${s.copyHook}\n- **Descripción:** ${s.description}\n- **Meta:** ${s.conversionGoal}`
    ).join('\n\n---\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `funnel-${niche.replace(/\s+/g, '-')}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Funnel exportado');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Funnel Builder</h2>
          <p className="text-xs text-muted-foreground">Diseña funnels de venta con los frameworks de Brunson, Kern y Hormozi</p>
        </div>
      </div>

      {/* Niche + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tu Nicho / Producto</label>
          <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ej: Coaching de fitness para mujeres 30-45" />
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      {/* Templates */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Plantilla de Funnel</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FUNNEL_TEMPLATES.map(t => (
            <Card
              key={t.id}
              className={cn(
                "p-3 cursor-pointer transition-all border",
                selectedTemplate === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
              )}
              onClick={() => applyTemplate(t.id)}
            >
              <span className="text-xl">{t.icon}</span>
              <p className="text-sm font-semibold text-foreground mt-1">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Visual Funnel */}
      {steps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tu Funnel ({steps.length} pasos)</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5 text-xs">
                <Plus className="w-3 h-3" /> Paso
              </Button>
              <Button variant="outline" size="sm" onClick={exportFunnel} className="gap-1.5 text-xs">
                <Download className="w-3 h-3" /> Exportar
              </Button>
              <Button size="sm" onClick={handleGenerateCopy} disabled={isGenerating} className="gap-1.5 text-xs glow-primary">
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                Generar Copy IA
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn("p-4 border bg-gradient-to-r transition-all", STEP_COLORS[step.type] || STEP_COLORS.custom)}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center border border-border/50">
                        {STEP_ICONS[step.type]}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          className="h-7 text-sm font-semibold bg-background/60 border-border/30 max-w-[200px]"
                        />
                        <Badge variant="secondary" className="text-[10px]">{step.price}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive ml-auto" onClick={() => removeStep(step.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {step.copyHook && (
                        <p className="text-xs font-medium text-foreground">🪝 {step.copyHook}</p>
                      )}

                      <Input
                        value={step.description}
                        onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        placeholder="Descripción de la oferta..."
                        className="h-7 text-xs bg-background/40 border-border/20"
                      />

                      <div className="flex gap-2">
                        <Input
                          value={step.price}
                          onChange={(e) => updateStep(step.id, { price: e.target.value })}
                          placeholder="Precio"
                          className="h-7 text-xs bg-background/40 border-border/20 w-28"
                        />
                        <Input
                          value={step.conversionGoal}
                          onChange={(e) => updateStep(step.id, { conversionGoal: e.target.value })}
                          placeholder="Meta de conversión / CTA"
                          className="h-7 text-xs bg-background/40 border-border/20 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
