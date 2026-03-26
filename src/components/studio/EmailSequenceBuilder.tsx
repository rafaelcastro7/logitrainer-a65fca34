import { useState } from 'react';
import { Mail, Sparkles, Copy, Download, Loader2, Wand2, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const SEQUENCE_TYPES = [
  { id: 'welcome', name: 'Welcome Series', desc: '5 emails de bienvenida y nurturing', icon: '👋', emails: 5 },
  { id: 'launch', name: 'Lanzamiento', desc: '7 emails de pre-launch a cart close', icon: '🚀', emails: 7 },
  { id: 'cash_machine', name: '4-Day Cash Machine (Kern)', desc: '4 emails: historia → prueba → oferta → cierre', icon: '💰', emails: 4 },
  { id: 'nurture', name: 'Nurture', desc: '5 emails de valor y autoridad', icon: '🌱', emails: 5 },
  { id: 'cart', name: 'Abandoned Cart', desc: '3 emails de recuperación', icon: '🛒', emails: 3 },
  { id: 'webinar', name: 'Post-Webinar', desc: '4 emails de seguimiento', icon: '🎓', emails: 4 },
  { id: 'reengagement', name: 'Re-engagement', desc: '3 emails para suscriptores inactivos', icon: '💌', emails: 3 },
  { id: 'tripwire', name: 'Tripwire Sequence', desc: '3 emails: valor → oferta baja → upsell', icon: '⚡', emails: 3 },
];

interface EmailItem {
  subject: string;
  preview: string;
  body: string;
  cta: string;
  day: number;
  notes: string;
}

export default function EmailSequenceBuilder() {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [sequenceType, setSequenceType] = useState('welcome');
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHTML, setPreviewHTML] = useState(false);

  const handleGenerate = async () => {
    if (!product.trim()) { toast.error('Ingresa tu producto/servicio'); return; }
    setIsGenerating(true);

    try {
      const seqConfig = SEQUENCE_TYPES.find(s => s.id === sequenceType);
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'email_sequence',
          product,
          audience,
          sequenceType,
          emailsCount: seqConfig?.emails || 5,
        },
      });

      if (error) throw error;
      setEmails(data.emails || []);
      setSelectedEmail(0);
      toast.success(`📧 Secuencia de ${data.emails.length} emails generada`);
    } catch (err) {
      console.error('Email sequence error:', err);
      toast.error(err instanceof Error ? err.message : 'Error generando secuencia');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyEmail = (email: EmailItem) => {
    const text = `Subject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}\n\nCTA: ${email.cta}`;
    navigator.clipboard.writeText(text);
    toast.success('📋 Email copiado');
  };

  const exportAll = () => {
    const md = emails.map((e, i) => `## Email ${i + 1} (Day ${e.day})\n\n**Subject:** ${e.subject}\n**Preview:** ${e.preview}\n\n${e.body}\n\n**CTA:** ${e.cta}\n\n---`).join('\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-sequence-${sequenceType}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Secuencia exportada');
  };

  const currentEmail = emails[selectedEmail];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-success/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Email Marketing Sequences</h2>
          <p className="text-xs text-muted-foreground">Genera secuencias de email de alta conversión con IA</p>
        </div>
      </div>

      {emails.length === 0 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Secuencia</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SEQUENCE_TYPES.map(s => (
                <Card
                  key={s.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all border",
                    sequenceType === s.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/30 hover:border-border/60"
                  )}
                  onClick={() => setSequenceType(s.id)}
                >
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                  <Badge variant="secondary" className="mt-1.5 text-[10px]">{s.emails} emails</Badge>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto/Servicio</label>
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ej: Curso de copywriting" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audiencia</label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ej: Freelancers y coaches" />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full glow-primary gap-2" size="lg">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isGenerating ? 'Generando secuencia...' : 'Generar Secuencia de Emails'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {SEQUENCE_TYPES.find(s => s.id === sequenceType)?.name} · {emails.length} emails
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEmails([])} className="text-xs">← Nuevo</Button>
              <Button size="sm" onClick={exportAll} className="gap-1.5 text-xs glow-primary"><Download className="w-3 h-3" /> Exportar Todo</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
            {/* Email list */}
            <div className="space-y-1.5">
              {emails.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEmail(i)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg border transition-all text-xs",
                    i === selectedEmail ? "border-primary bg-primary/5" : "border-border/30 hover:border-border/60"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[9px] shrink-0">D{e.day}</Badge>
                    <span className="truncate font-medium text-foreground">{e.subject}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Email preview */}
            {currentEmail && (
              <Card className="p-5 border-border/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Subject Line</p>
                    <p className="text-sm font-bold text-foreground">{currentEmail.subject}</p>
                    <p className="text-xs text-muted-foreground italic mt-0.5">{currentEmail.preview}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyEmail(currentEmail)} className="gap-1 text-xs shrink-0">
                    <Copy className="w-3 h-3" /> Copiar
                  </Button>
                </div>

                <div className="border-t border-border/20 pt-4">
                  <div className="prose prose-sm max-w-none text-foreground text-sm whitespace-pre-line leading-relaxed">
                    {currentEmail.body}
                  </div>
                </div>

                <div className="border-t border-border/20 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">CTA</p>
                    <p className="text-xs font-semibold text-primary">{currentEmail.cta}</p>
                  </div>
                  {currentEmail.notes && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Nota</p>
                      <p className="text-[11px] text-muted-foreground">{currentEmail.notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
