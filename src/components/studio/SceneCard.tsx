import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Image, Mic, Play, RotateCw, Trash2, ChevronDown, ChevronUp, 
  Clock, ZoomIn, ZoomOut, MoveHorizontal, Minus, GripVertical
} from 'lucide-react';
import { Scene, AnimationSettings } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SceneCardProps {
  scene: Scene;
  index: number;
  onUpdate: (id: string, updates: Partial<Scene>) => void;
  onRemove: (id: string) => void;
  onRegenerateImage?: (id: string) => void;
  onRegenerateAudio?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  generating: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  error: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  generating: 'Generando...',
  completed: 'Listo',
  error: 'Error',
};

const animationIcons: Record<string, React.ElementType> = {
  static: Minus,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,
  pan_left: MoveHorizontal,
  pan_right: MoveHorizontal,
};

export default function SceneCard({ scene, index, onUpdate, onRemove, onRegenerateImage, onRegenerateAudio }: SceneCardProps) {
  const [expanded, setExpanded] = useState(false);

  const AnimIcon = animationIcons[scene.animation.type] || Minus;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="glass-panel rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        <span className="text-xs font-mono text-muted-foreground w-8">#{index + 1}</span>
        <span className="font-medium text-sm truncate flex-1">{scene.name}</span>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={cn("text-xs gap-1", statusColors[scene.image.status])}>
            <Image className="w-3 h-3" /> {statusLabels[scene.image.status]}
          </Badge>
          <Badge variant="outline" className={cn("text-xs gap-1", statusColors[scene.audio.status])}>
            <Mic className="w-3 h-3" /> {statusLabels[scene.audio.status]}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="w-3 h-3" /> {scene.duration}s
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4 space-y-4 border-t border-border/30"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
            {/* Left: Script & Prompt */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Guión (Narración)</Label>
                <Textarea
                  value={scene.script}
                  onChange={e => onUpdate(scene.id, { script: e.target.value })}
                  rows={4}
                  className="bg-muted/50 border-border/50 resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prompt de Imagen</Label>
                <Textarea
                  value={scene.image_prompt}
                  onChange={e => onUpdate(scene.id, { image_prompt: e.target.value })}
                  rows={3}
                  className="bg-muted/50 border-border/50 resize-none text-sm font-mono"
                />
              </div>
            </div>

            {/* Right: Settings & Preview */}
            <div className="space-y-3">
              {/* Image preview */}
              <div className="aspect-video rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center overflow-hidden">
                {scene.image.url ? (
                  <img src={scene.image.url} alt={scene.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground/50">
                    <Image className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">Sin imagen</p>
                  </div>
                )}
              </div>

              {/* Animation */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Animación</Label>
                  <Select
                    value={scene.animation.type}
                    onValueChange={v => onUpdate(scene.id, { animation: { ...scene.animation, type: v as AnimationSettings['type'] } })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Estático</SelectItem>
                      <SelectItem value="zoom_in">Zoom In</SelectItem>
                      <SelectItem value="zoom_out">Zoom Out</SelectItem>
                      <SelectItem value="pan_left">Pan Izquierda</SelectItem>
                      <SelectItem value="pan_right">Pan Derecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Intensidad: {scene.animation.intensity.toFixed(1)}</Label>
                  <Slider
                    value={[scene.animation.intensity]}
                    onValueChange={([v]) => onUpdate(scene.id, { animation: { ...scene.animation, intensity: v } })}
                    min={0.1} max={1} step={0.1}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs">Duración: {scene.duration}s</Label>
                <Slider
                  value={[scene.duration]}
                  onValueChange={([v]) => onUpdate(scene.id, { duration: v })}
                  min={2} max={30} step={1}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/20">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onRegenerateImage?.(scene.id)}>
              <RotateCw className="w-3 h-3" /> Regenerar Imagen
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onRegenerateAudio?.(scene.id)}>
              <RotateCw className="w-3 h-3" /> Regenerar Audio
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => onRemove(scene.id)}>
              <Trash2 className="w-3 h-3" /> Eliminar
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
