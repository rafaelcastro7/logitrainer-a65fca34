import { useState } from 'react';
import { Wand2, Settings2, Mic, Palette, Clock, Sparkles } from 'lucide-react';
import { ProjectMeta } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface DashboardViewProps {
  meta: ProjectMeta;
  onUpdateMeta: (updates: Partial<ProjectMeta>) => void;
  onGenerate: (topic: string) => void;
  isGenerating: boolean;
}

const voices = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Aoede', 'Leda'];
const emotions = ['professional', 'happy', 'calm', 'energetic', 'dramatic'];
const languages = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'pt', label: 'Português' },
];

export default function DashboardView({ meta, onUpdateMeta, onGenerate, isGenerating }: DashboardViewProps) {
  const [topic, setTopic] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Magic Generator */}
      <section className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
            <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Generador Mágico</h2>
            <p className="text-sm text-muted-foreground">Ingresa un tema y la IA creará todo el guión</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Ej: Historia de la Revolución Industrial..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="flex-1 bg-muted/50 border-border/50"
          />
          <Button
            onClick={() => topic.trim() && onGenerate(topic.trim())}
            disabled={!topic.trim() || isGenerating}
            className="gap-2 glow-primary"
          >
            <Wand2 className="w-4 h-4" />
            {isGenerating ? 'Generando...' : 'Generar'}
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Settings */}
        <section className="glass-panel rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Configuración</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Proyecto</Label>
              <Input value={meta.name} onChange={e => onUpdateMeta({ name: e.target.value })} className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Autor</Label>
              <Input value={meta.author} onChange={e => onUpdateMeta({ author: e.target.value })} className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={meta.language} onValueChange={v => onUpdateMeta({ language: v })}>
                <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select value={meta.modelTier} onValueChange={v => onUpdateMeta({ modelTier: v as 'prototyping' | 'production' })}>
                <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prototyping">Prototipo (Rápido)</SelectItem>
                  <SelectItem value="production">Producción (Alta Calidad)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Timing & Voice */}
        <section className="glass-panel rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Tiempo y Voz</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duración Objetivo: {meta.durationTarget}s</Label>
              <Slider
                value={[meta.durationTarget]}
                onValueChange={([v]) => onUpdateMeta({ durationTarget: v })}
                min={30} max={600} step={10}
                className="py-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Segundos por Escena: {meta.secondsPerScene}s</Label>
              <Slider
                value={[meta.secondsPerScene]}
                onValueChange={([v]) => onUpdateMeta({ secondsPerScene: v })}
                min={3} max={30} step={1}
                className="py-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Voz</Label>
              <Select value={meta.voiceName} onValueChange={v => onUpdateMeta({ voiceName: v })}>
                <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {voices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emoción</Label>
              <Select value={meta.defaultEmotion} onValueChange={v => onUpdateMeta({ defaultEmotion: v })}>
                <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {emotions.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Optimización de Frames</Label>
              <Switch checked={meta.frameOptimization} onCheckedChange={v => onUpdateMeta({ frameOptimization: v })} />
            </div>
          </div>
        </section>
      </div>

      {/* Visual Style */}
      <section className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Estilo Visual</h2>
        </div>
        <Textarea
          value={meta.visualStyle}
          onChange={e => onUpdateMeta({ visualStyle: e.target.value })}
          rows={3}
          placeholder="Describe el estilo visual global..."
          className="bg-muted/50 border-border/50 resize-none"
        />
      </section>
    </div>
  );
}
