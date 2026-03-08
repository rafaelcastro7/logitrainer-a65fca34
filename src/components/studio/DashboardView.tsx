import { useState } from 'react';
import { Wand2, Settings2, Palette, Clock, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectMeta } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
  meta: ProjectMeta;
  onUpdateMeta: (updates: Partial<ProjectMeta>) => void;
  onGenerate: (topic: string) => void;
  isGenerating: boolean;
  scenesCount: number;
}

const voices = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Aoede', 'Leda'];
const emotions = ['professional', 'happy', 'calm', 'energetic', 'dramatic'];
const languages = [
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'pt', label: '🇧🇷 Português' },
];

export default function DashboardView({ meta, onUpdateMeta, onGenerate, isGenerating, scenesCount }: DashboardViewProps) {
  const [topic, setTopic] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Magic Generator */}
      <section className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
            <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Generador Mágico</h2>
            <p className="text-sm text-muted-foreground">
              {scenesCount > 0
                ? `Tienes ${scenesCount} escenas. Genera nuevas para reemplazarlas.`
                : 'Ingresa un tema y la IA creará el guión completo'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Ej: Historia de la Revolución Industrial..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && topic.trim() && onGenerate(topic.trim())}
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

        {/* Quick topics */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Ideas:</span>
          {['Revolución Industrial', 'Sistema Solar', 'Inteligencia Artificial', 'Fotosíntesis', 'Segunda Guerra Mundial'].map(t => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Collapsible Settings */}
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {settingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Settings2 className="w-4 h-4" />
        Configuración del Proyecto
      </button>

      {settingsOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> General
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre</Label>
                <Input value={meta.name} onChange={e => onUpdateMeta({ name: e.target.value })} className="bg-muted/50 border-border/50 h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Autor</Label>
                <Input value={meta.author} onChange={e => onUpdateMeta({ author: e.target.value })} className="bg-muted/50 border-border/50 h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Idioma</Label>
                  <Select value={meta.language} onValueChange={v => onUpdateMeta({ language: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Calidad IA</Label>
                  <Select value={meta.modelTier} onValueChange={v => onUpdateMeta({ modelTier: v as 'prototyping' | 'production' })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prototyping">⚡ Prototipo</SelectItem>
                      <SelectItem value="production">💎 Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Tiempo y Voz
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Duración Objetivo: {meta.durationTarget}s ({Math.floor(meta.durationTarget/60)}:{String(meta.durationTarget%60).padStart(2,'0')})</Label>
                <Slider value={[meta.durationTarget]} onValueChange={([v]) => onUpdateMeta({ durationTarget: v })} min={30} max={600} step={10} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Seg/Escena: {meta.secondsPerScene}s</Label>
                <Slider value={[meta.secondsPerScene]} onValueChange={([v]) => onUpdateMeta({ secondsPerScene: v })} min={3} max={30} step={1} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Voz</Label>
                  <Select value={meta.voiceName} onValueChange={v => onUpdateMeta({ voiceName: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {voices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Emoción</Label>
                  <Select value={meta.defaultEmotion} onValueChange={v => onUpdateMeta({ defaultEmotion: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {emotions.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs">Optimización de Frames</Label>
                <Switch checked={meta.frameOptimization} onCheckedChange={v => onUpdateMeta({ frameOptimization: v })} />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Visual Style */}
      {settingsOpen && (
        <section className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" /> Estilo Visual Global
          </h3>
          <Textarea
            value={meta.visualStyle}
            onChange={e => onUpdateMeta({ visualStyle: e.target.value })}
            rows={2}
            placeholder="Describe el estilo visual global..."
            className="bg-muted/50 border-border/50 resize-none text-sm"
          />
        </section>
      )}
    </div>
  );
}
