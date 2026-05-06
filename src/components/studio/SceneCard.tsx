import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Image, Mic, RotateCw, Trash2, ChevronDown, ChevronUp,
  Clock, GripVertical, Copy, ArrowUp, ArrowDown, FileText, Type,
  Shuffle, AlignLeft, Wand2, Scissors, Loader2, Sparkles,
  ArrowDownToLine, ArrowUpFromLine, Pen, Drama, MessageCircle
} from 'lucide-react';
import { Scene, AnimationSettings, TransitionType, TextOverlay } from '@/types/project';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { enhanceScript, type EnhanceAction } from '@/services/scriptEnhancer';
import { toast } from 'sonner';

const VOICES = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Aoede', 'Leda'];

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
  onSplit?: (sceneId: string, splitTime: number) => void;
  dragHandleProps?: Record<string, any>;
  projectLanguage?: string;
}

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getReadingTime(text: string): number {
  return Math.ceil((getWordCount(text) / 150) * 60);
}

const TRANSITION_OPTIONS: { value: TransitionType; label: string; icon: string }[] = [
  { value: 'fade', label: 'Fade', icon: '🌓' },
  { value: 'wipe_left', label: 'Wipe Left', icon: '◀️' },
  { value: 'wipe_right', label: 'Wipe Right', icon: '▶️' },
  { value: 'dissolve', label: 'Dissolve', icon: '✨' },
  { value: 'slide_up', label: 'Slide Up', icon: '⬆️' },
  { value: 'none', label: 'None', icon: '⏹️' },
];

const ENHANCE_ACTIONS: { value: EnhanceAction; label: string; icon: typeof Wand2 }[] = [
  { value: 'improve', label: 'Mejorar', icon: Wand2 },
  { value: 'shorten', label: 'Acortar', icon: ArrowDownToLine },
  { value: 'expand', label: 'Expandir', icon: ArrowUpFromLine },
  { value: 'rewrite', label: 'Reescribir', icon: Pen },
  { value: 'dramatic', label: 'Dramático', icon: Drama },
  { value: 'casual', label: 'Casual', icon: MessageCircle },
];

export default function SceneCard({
  scene, index, total, isActive, onUpdate, onRemove, onDuplicate,
  onMoveUp, onMoveDown, onRegenerateImage, onRegenerateAudio, onSelect,
  onSplit, dragHandleProps, projectLanguage,
}: SceneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const { t } = useTranslation();
  const wordCount = getWordCount(scene.script);
  const estimatedTime = getReadingTime(scene.script);

  const statusLabels: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-muted text-muted-foreground', label: t.pending },
    generating: { color: 'bg-warning/20 text-warning', label: t.generatingStatus },
    completed: { color: 'bg-success/20 text-success', label: t.ready },
    error: { color: 'bg-destructive/20 text-destructive', label: t.error },
  };

  const imgStatus = statusLabels[scene.image.status];
  const audStatus = statusLabels[scene.audio.status];

  const handleToggle = () => {
    setExpanded(!expanded);
    onSelect(scene.id);
  };

  const handleEnhance = async (action: EnhanceAction) => {
    if (!scene.script.trim()) {
      toast.error('Escribe un guión primero');
      return;
    }
    setEnhancing(true);
    try {
      const result = await enhanceScript({
        script: scene.script,
        action,
        language: projectLanguage || 'es',
        context: scene.name,
      });
      onUpdate(scene.id, { script: result.enhanced });
      toast.success(`✨ Script ${action === 'improve' ? 'mejorado' : action === 'shorten' ? 'acortado' : action === 'expand' ? 'expandido' : action === 'rewrite' ? 'reescrito' : action === 'dramatic' ? 'dramatizado' : 'casualizado'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enhancement failed');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSplit = () => {
    const midpoint = scene.duration / 2;
    onSplit?.(scene.id, midpoint);
  };

  const overlay = scene.textOverlay || { enabled: false, text: '', position: 'bottom' as const, style: 'subtitle' as const };

  return (
    <div
      className={cn(
        "glass-panel rounded-xl overflow-hidden transition-all",
        isActive && "ring-1 ring-primary/40"
      )}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={handleToggle}
      >
        <div
          className="touch-none cursor-grab active:cursor-grabbing p-0.5 -ml-1"
          {...dragHandleProps}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 hover:text-muted-foreground transition-colors" />
        </div>

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
            {t.wordsCount(wordCount)} · {t.readingTime(estimatedTime)}
            {scene.voiceName && <span className="ml-1 text-primary/60">🎙 {scene.voiceName}</span>}
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

          <div className="flex items-center ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => { e.stopPropagation(); onMoveUp(index); }} disabled={index === 0} className="p-1 rounded hover:bg-secondary/50 disabled:opacity-20 transition-colors">
                  <ArrowUp className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{t.moveUp}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => { e.stopPropagation(); onMoveDown(index); }} disabled={index === total - 1} className="p-1 rounded hover:bg-secondary/50 disabled:opacity-20 transition-colors">
                  <ArrowDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{t.moveDown}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => { e.stopPropagation(); onDuplicate(scene); }} className="p-1 rounded hover:bg-secondary/50 transition-colors">
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{t.duplicate}</TooltipContent>
            </Tooltip>
          </div>

          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> {t.script}</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {t.wordsCount(wordCount)} · {t.readingTime(estimatedTime)}
                  </span>
                </div>
                <Textarea
                  value={scene.script}
                  onChange={e => onUpdate(scene.id, { script: e.target.value })}
                  rows={4}
                  className="bg-muted/50 border-border/50 resize-none text-sm"
                />
                
                {/* AI Enhancement buttons */}
                <div className="flex flex-wrap gap-1">
                  {ENHANCE_ACTIONS.map(action => {
                    const Icon = action.icon;
                    return (
                      <Tooltip key={action.value}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] gap-1 px-2"
                            disabled={enhancing || !scene.script.trim()}
                            onClick={() => handleEnhance(action.value)}
                          >
                            {enhancing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Icon className="w-2.5 h-2.5" />}
                            {action.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {action.label} con IA
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Type className="w-3 h-3" /> {t.imagePrompt}</Label>
                <Textarea
                  value={scene.image_prompt}
                  onChange={e => onUpdate(scene.id, { image_prompt: e.target.value })}
                  rows={3}
                  className="bg-muted/50 border-border/50 resize-none text-sm font-mono"
                />
              </div>

              {/* Per-scene voice selector */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Mic className="w-3 h-3" /> Voz de escena</Label>
                <Select
                  value={scene.voiceName || '__project__'}
                  onValueChange={v => onUpdate(scene.id, { voiceName: v === '__project__' ? undefined : v })}
                >
                  <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs">
                    <SelectValue placeholder="Usar voz del proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__project__">Voz del proyecto</SelectItem>
                    {VOICES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Overlay */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" /> Text Overlay
                  </Label>
                  <Switch
                    checked={overlay.enabled}
                    onCheckedChange={v => onUpdate(scene.id, { textOverlay: { ...overlay, enabled: v } })}
                  />
                </div>
                {overlay.enabled && (
                  <div className="space-y-2">
                    <Input
                      value={overlay.text}
                      onChange={e => onUpdate(scene.id, { textOverlay: { ...overlay, text: e.target.value } })}
                      placeholder="Title or caption text..."
                      className="bg-muted/50 border-border/50 h-8 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={overlay.position} onValueChange={v => onUpdate(scene.id, { textOverlay: { ...overlay, position: v as TextOverlay['position'] } })}>
                        <SelectTrigger className="bg-muted/50 border-border/50 h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={overlay.style} onValueChange={v => onUpdate(scene.id, { textOverlay: { ...overlay, style: v as TextOverlay['style'] } })}>
                        <SelectTrigger className="bg-muted/50 border-border/50 h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="subtitle">Subtitle</SelectItem>
                          <SelectItem value="lower_third">Lower Third</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="aspect-video rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center overflow-hidden">
                {scene.image.url ? (
                  <img src={scene.image.url} alt={scene.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground/40">
                    <Image className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">{t.noImageGenerated}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{t.kenBurnsAnimation}</Label>
                  <Select
                    value={scene.animation.type}
                    onValueChange={v => onUpdate(scene.id, { animation: { ...scene.animation, type: v as AnimationSettings['type'] } })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">{t.static}</SelectItem>
                      <SelectItem value="zoom_in">{t.zoomIn}</SelectItem>
                      <SelectItem value="zoom_out">{t.zoomOut}</SelectItem>
                      <SelectItem value="pan_left">{t.panLeft}</SelectItem>
                      <SelectItem value="pan_right">{t.panRight}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{t.intensity(scene.animation.intensity.toFixed(1))}</Label>
                  <Slider
                    value={[scene.animation.intensity]}
                    onValueChange={([v]) => onUpdate(scene.id, { animation: { ...scene.animation, intensity: v } })}
                    min={0.1} max={1} step={0.1}
                  />
                </div>
              </div>

              {/* Transition selector */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Shuffle className="w-3 h-3" /> Transition
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {TRANSITION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onUpdate(scene.id, { transition: opt.value })}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md border transition-all",
                        (scene.transition || 'fade') === opt.value
                          ? "bg-primary/20 border-primary/40 text-primary font-medium"
                          : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t.duration(scene.duration)}</Label>
                <Slider
                  value={[scene.duration]}
                  onValueChange={([v]) => onUpdate(scene.id, { duration: v })}
                  min={2} max={30} step={1}
                />
              </div>

              {/* Scene Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</Label>
                <Textarea
                  value={scene.notes}
                  onChange={e => onUpdate(scene.id, { notes: e.target.value })}
                  rows={2}
                  placeholder="Director notes, ideas, references..."
                  className="bg-muted/50 border-border/50 resize-none text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/20">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onRegenerateImage?.(scene.id)}>
              <RotateCw className="w-3 h-3" /> {t.regenerateImage}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onRegenerateAudio?.(scene.id)}>
              <RotateCw className="w-3 h-3" /> {t.regenerateAudio}
            </Button>
            {onSplit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSplit}>
                    <Scissors className="w-3 h-3" /> Split
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Dividir escena en dos</TooltipContent>
              </Tooltip>
            )}
            <div className="flex-1" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" /> {t.delete}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete scene?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{scene.name}" and all its generated assets. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(scene.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
