import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gem, Wand2, Loader2, Copy, Download, Plus, Trash2, DollarSign, Shield, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';

interface OfferComponent {
  id: string;
  type: 'main' | 'bonus' | 'guarantee' | 'urgency';
  name: string;
  value: string;
  description: string;
}

export default function OfferBuilder() {
  const [dreamOutcome, setDreamOutcome] = useState('');
  const [audience, setAudience] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [components, setComponents] = useState<OfferComponent[]>([
    { id: crypto.randomUUID(), type: 'main', name: '', value: '', description: '' },
    { id: crypto.randomUUID(), type: 'bonus', name: '', value: '', description: '' },
    { id: crypto.randomUUID(), type: 'bonus', name: '', value: '', description: '' },
    { id: crypto.randomUUID(), type: 'guarantee', name: '', value: '', description: '' },
    { id: crypto.randomUUID(), type: 'urgency', name: '', value: '', description: '' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState('google/gemini-2.5-pro');

  const handleGenerate = async () => {
    if (!dreamOutcome.trim()) { toast.error('Describe el resultado soñado del cliente'); return; }
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'chat',
          model,
          prompt: `Eres Alex Hormozi. Usando tu framework de "$100M Offers" y la ecuación del valor (Resultado Soñado × Probabilidad Percibida / Tiempo × Esfuerzo), crea una oferta GRAND SLAM irresistible.

Contexto:
- Resultado soñado del cliente: ${dreamOutcome}
- Audiencia: ${audience}
- Precio actual/deseado: ${currentPrice}

Genera:
1. PRODUCTO PRINCIPAL: La solución central
2. BONUS 1: Resuelve el "siguiente problema" que tendrá el cliente
3. BONUS 2: Herramienta/recurso que acelera resultados
4. BONUS 3: Acceso a comunidad o soporte
5. GARANTÍA: Garantía inversa que elimine todo riesgo
6. URGENCIA: Escasez real (no falsa)
7. NOMBRE DE LA OFERTA: Un nombre irresistible y memorable
8. HEADLINE: Frase principal de venta
9. STACK DE VALOR: Lista de todo lo incluido con valores individuales y valor total vs precio

Responde en JSON: { "offerName": "...", "headline": "...", "components": [{ "type": "main|bonus|guarantee|urgency", "name": "...", "value": "...", "description": "..." }], "totalValue": "...", "price": "...", "valueEquation": { "dreamOutcome": "...", "perceivedLikelihood": "...", "timeDelay": "...", "effortSacrifice": "..." } }`,
        },
      });

      if (error) throw error;

      const content = data?.content || '';
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content.match(/\{[\s\S]*\}/)?.[0]];
        const parsed = JSON.parse(jsonMatch[1] || content);
        
        if (parsed.components) {
          setComponents(parsed.components.map((c: any) => ({
            id: crypto.randomUUID(),
            type: c.type || 'bonus',
            name: c.name || '',
            value: c.value || '',
            description: c.description || '',
          })));
          toast.success(`💎 Oferta "${parsed.offerName || 'Grand Slam'}" generada`);
        }
      } catch {
        toast.info('Oferta generada como texto');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generando oferta');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateComponent = (id: string, updates: Partial<OfferComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addComponent = (type: OfferComponent['type']) => {
    setComponents(prev => [...prev, { id: crypto.randomUUID(), type, name: '', value: '', description: '' }]);
  };

  const removeComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const totalValue = components.reduce((sum, c) => {
    const num = parseInt(c.value.replace(/[^0-9]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const typeIcons: Record<string, React.ReactNode> = {
    main: <Gem className="w-4 h-4 text-primary" />,
    bonus: <Gift className="w-4 h-4 text-amber-500" />,
    guarantee: <Shield className="w-4 h-4 text-emerald-500" />,
    urgency: <Clock className="w-4 h-4 text-red-500" />,
  };

  const typeLabels: Record<string, string> = {
    main: 'Producto Principal',
    bonus: 'Bonus',
    guarantee: 'Garantía',
    urgency: 'Urgencia/Escasez',
  };

  const typeColors: Record<string, string> = {
    main: 'border-l-primary',
    bonus: 'border-l-amber-500',
    guarantee: 'border-l-emerald-500',
    urgency: 'border-l-red-500',
  };

  const exportOffer = () => {
    const md = `# Oferta Grand Slam\n\n**Resultado Soñado:** ${dreamOutcome}\n**Audiencia:** ${audience}\n**Precio:** ${currentPrice}\n**Valor Total:** $${totalValue.toLocaleString()}\n\n${components.map(c => `## ${typeLabels[c.type]}: ${c.name}\n- **Valor:** ${c.value}\n- ${c.description}`).join('\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'grand-slam-offer.md'; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Oferta exportada');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/10 flex items-center justify-center">
          <Gem className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Offer Builder</h2>
          <p className="text-xs text-muted-foreground">Crea ofertas irresistibles con el framework $100M de Hormozi</p>
        </div>
      </div>

      {/* Value Equation Visual */}
      <Card className="p-4 border-border/30 bg-gradient-to-r from-amber-500/5 to-primary/5">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ecuación del Valor (Hormozi)</p>
        <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 font-medium text-xs">Resultado Soñado</span>
          <span className="text-muted-foreground">×</span>
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 font-medium text-xs">Probabilidad</span>
          <span className="text-muted-foreground">/</span>
          <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 font-medium text-xs">(Tiempo × Esfuerzo)</span>
          <span className="text-muted-foreground">=</span>
          <span className="px-2 py-1 rounded bg-primary/10 text-primary font-bold text-xs">VALOR</span>
        </div>
      </Card>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Resultado Soñado del Cliente</label>
          <Textarea value={dreamOutcome} onChange={(e) => setDreamOutcome(e.target.value)} placeholder="Ej: Pasar de empleado a dueño de negocio de 6 cifras..." className="min-h-[60px] text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Audiencia</label>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ej: Coaches y consultores" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio de la Oferta</label>
          <Input value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="Ej: $997" />
        </div>
      </div>

      <ModelSelector value={model} onChange={setModel} />

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full glow-primary gap-2" size="lg">
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        {isGenerating ? 'Creando oferta Grand Slam...' : 'Generar Oferta con IA (Hormozi Framework)'}
      </Button>

      {/* Offer Components */}
      {components.some(c => c.name) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Componentes de tu Oferta</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addComponent('bonus')} className="gap-1 text-xs"><Gift className="w-3 h-3" /> Bonus</Button>
              <Button variant="outline" size="sm" onClick={exportOffer} className="gap-1 text-xs"><Download className="w-3 h-3" /> Exportar</Button>
            </div>
          </div>

          <div className="space-y-2">
            {components.map((comp, i) => (
              <motion.div key={comp.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className={cn("p-3 border-l-4 border-border/30", typeColors[comp.type])}>
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">{typeIcons[comp.type]}</div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px]">{typeLabels[comp.type]}</Badge>
                        <Input value={comp.name} onChange={(e) => updateComponent(comp.id, { name: e.target.value })} placeholder="Nombre..." className="h-7 text-xs font-semibold bg-transparent border-border/20 flex-1" />
                        <Input value={comp.value} onChange={(e) => updateComponent(comp.id, { value: e.target.value })} placeholder="Valor $" className="h-7 text-xs w-24 bg-transparent border-border/20" />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeComponent(comp.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                      <Input value={comp.description} onChange={(e) => updateComponent(comp.id, { description: e.target.value })} placeholder="Descripción breve..." className="h-7 text-xs bg-transparent border-border/20" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Value Stack */}
          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Valor Total Apilado</p>
                <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Tu Precio</p>
                <p className="text-2xl font-bold text-primary">{currentPrice || '$---'}</p>
              </div>
            </div>
            {currentPrice && totalValue > 0 && (
              <p className="text-xs text-emerald-500 mt-2 font-medium">
                ✨ El cliente recibe {Math.round(totalValue / parseInt(currentPrice.replace(/[^0-9]/g, '') || '1'))}x el valor de lo que paga
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
