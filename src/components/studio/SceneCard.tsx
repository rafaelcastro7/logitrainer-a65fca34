import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Image, Mic, RotateCw, Trash2, ChevronDown, ChevronUp,
  Clock, ZoomIn, ZoomOut, MoveHorizontal, Minus, GripVertical,
  Copy, ArrowUp, ArrowDown, FileText, Type
} from 'lucide-react';
import { Scene, AnimationSettings } from '@/types/project';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SceneCardProps {
  scene: Scene;
  index: number;
  total: number;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<Scene>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (scene: Scene) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRegenerateImage?: (id: string) => void;
  onRegenerateAudio?: (id: string) => void;
  onSelect: (id: string) => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-muted text-muted-foreground', label: 'Pendiente' },
  generating: { color: 'bg-warning/20 text-warning', label: 'Generando...' },
  completed: { color: 'bg-success/20 text-success', label: '✓ Listo' },
  error: { color: 'bg-destructive/20 text-destructive', label: '✗ Error' },
};

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getReadingTime(text: string): number {
  // Average speaking rate: ~150 words per minute
  return Math.ceil((getWordCount(text) / 150) * 60);
}

export default function SceneCard({
  scene, index, total, isActive, onUpdate, onRemove, onDuplicate,
  onMoveUp, onMoveDown, onRegenerateImage, onRegenerateAudio, onSelect
}: SceneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const wordCount = getWordCount(scene.script);
  const estimatedTime = getReadingTime(scene.script);
  const imgStatus = statusConfig[scene.image.status];
  const audStatus = statusConfig[scene.audio.status];

  const handleToggle = () => {
    setExpanded(!expanded);
    onSelect(scene.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "glass-panel rounded-xl overflow-hidden transition-all",
        isActive && "ring-1 ring-primary/40"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={handleToggle}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

        {/* Thumbnail */}
        <div className="w-12 h-8 rounded bg-muted/30 shrink-0 overflow-hidden">
          {scene.image.url ? (
            <img src={scene.image.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-mono text-muted-foreground/40">{index + 1}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm truncate block">{scene.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {wordCount} palabras · ~{estimatedTime}s lectura
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={cn("text-[10px] gap-0.5 h-5 px-1.5", imgStatus.color)}>
            <Image className="w-2.5 h-2.5" /> {imgStatus.label}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px] gap-0.5 h-5 px-1.5", audStatus.color)}>
            <Mic className="w-2.5 h-2.5" /> {audStatus.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-0.5 h-5 px-1.5">
            <Clock className="w-2.5 h-2.5" /> {scene.duration}s
          </Badge>

          {/* Quick actions */}
          <div className="flex items-center ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.stopPropagation(); onMoveUp(index); }}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-secondary/50 disabled:opacity-20 transition-colors"
                >
                  <ArrowUp className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Mover arriba</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.stopPropagation(); onMoveDown(index); }}
                  disabled={index === total - 1}
                  className="p-1 rounded hover:bg-secondary/50 disabled:opacity-20 transition-colors"
                >
                  <ArrowDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Mover abajo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.stopPropagation(); onDuplicate(scene); }}
                  className="p-1 rounded hover:bg-secondary/50 transition-colors"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Duplicar</TooltipContent>
            </Tooltip>
          </div>

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
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Guión (Narración)</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {wordCount} palabras · ~{estimatedTime}s
                  </span>
                </div>
                <Textarea
                  value={scene.script}
                  onChange={e => onUpdate(scene.id, { script: e.target.value })}
                  rows={4}
                  className="bg-muted/50 border-border/50 resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Type className="w-3 h-3" /> Prompt de Imagen</Label>
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
              <div className="aspect-video rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center overflow-hidden">
                {scene.image.url ? (
                  <img src={scene.image.url} alt={scene.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground/40">
                    <Image className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">Sin imagen generada</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Animación Ken Burns</Label>
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
