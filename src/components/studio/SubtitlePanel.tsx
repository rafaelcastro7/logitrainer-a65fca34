import { Captions, Type, Palette, Move, Sparkles } from 'lucide-react';
import { SubtitleSettings, SubtitleStyle } from '@/types/project';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SubtitlePanelProps {
  subtitles: SubtitleSettings;
  onUpdate: (updates: Partial<SubtitleSettings>) => void;
}

const SUBTITLE_STYLES: { value: SubtitleStyle; label: string; desc: string; preview: string }[] = [
  { value: 'classic', label: 'Classic', desc: 'Standard centered captions', preview: 'Aa' },
  { value: 'karaoke', label: 'Karaoke', desc: 'Word-by-word highlight', preview: '🎤' },
  { value: 'fade_word', label: 'Fade Word', desc: 'Words fade in sequentially', preview: '✨' },
  { value: 'typewriter', label: 'Typewriter', desc: 'Character by character', preview: '⌨️' },
  { value: 'bounce', label: 'Bounce', desc: 'Animated bounce entrance', preview: '🔵' },
  { value: 'glow', label: 'Neon Glow', desc: 'Glowing text effect', preview: '💡' },
];

const POSITION_OPTIONS = [
  { value: 'top', label: '⬆ Top' },
  { value: 'center', label: '⬛ Center' },
  { value: 'bottom', label: '⬇ Bottom' },
];

export default function SubtitlePanel({ subtitles, onUpdate }: SubtitlePanelProps) {
  return (
    <section className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Captions className="w-4 h-4 text-primary" /> Auto-Subtitles
        </h3>
        <Switch
          checked={subtitles.enabled}
          onCheckedChange={v => onUpdate({ enabled: v })}
        />
      </div>

      {subtitles.enabled && (
        <div className="space-y-4">
          {/* Style Selector */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Caption Style
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {SUBTITLE_STYLES.map(style => (
                <button
                  key={style.value}
                  onClick={() => onUpdate({ style: style.value })}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all group",
                    subtitles.style === style.value
                      ? "bg-primary/15 border-primary/40 ring-1 ring-primary/20"
                      : "bg-muted/20 border-border/30 hover:border-primary/20"
                  )}
                >
                  <span className="text-xl block mb-1">{style.preview}</span>
                  <p className="text-[11px] font-semibold">{style.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Type className="w-3 h-3" /> Font Size ({subtitles.fontSize}px)
            </Label>
            <Slider
              value={[subtitles.fontSize]}
              onValueChange={([v]) => onUpdate({ fontSize: v })}
              min={14} max={48} step={2}
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Palette className="w-3 h-3" /> Text Color
              </Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={subtitles.color}
                  onChange={e => onUpdate({ color: e.target.value })}
                  className="w-7 h-7 rounded-md border border-border/30 cursor-pointer"
                />
                <Input
                  value={subtitles.color}
                  onChange={e => onUpdate({ color: e.target.value })}
                  className="bg-muted/50 border-border/50 h-7 text-[10px] font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">BG Color</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={subtitles.backgroundColor}
                  onChange={e => onUpdate({ backgroundColor: e.target.value })}
                  className="w-7 h-7 rounded-md border border-border/30 cursor-pointer"
                />
                <Input
                  value={subtitles.backgroundColor}
                  onChange={e => onUpdate({ backgroundColor: e.target.value })}
                  className="bg-muted/50 border-border/50 h-7 text-[10px] font-mono"
                />
              </div>
            </div>
          </div>

          {/* BG Opacity */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Background Opacity ({Math.round(subtitles.backgroundOpacity * 100)}%)
            </Label>
            <Slider
              value={[subtitles.backgroundOpacity]}
              onValueChange={([v]) => onUpdate({ backgroundOpacity: v })}
              min={0} max={1} step={0.05}
            />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Move className="w-3 h-3" /> Position
            </Label>
            <div className="flex gap-2">
              {POSITION_OPTIONS.map(pos => (
                <button
                  key={pos.value}
                  onClick={() => onUpdate({ position: pos.value as SubtitleSettings['position'] })}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-xs transition-all",
                    subtitles.position === pos.value
                      ? "bg-primary/15 border-primary/40 text-primary font-medium"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Animation */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Animated Transitions</Label>
            <Switch
              checked={subtitles.animation}
              onCheckedChange={v => onUpdate({ animation: v })}
            />
          </div>

          {/* Live Preview */}
          <div className="aspect-video rounded-lg bg-muted/20 border border-border/20 flex items-end justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
            <div
              className={cn(
                "relative px-4 py-2 rounded-lg text-center max-w-[80%] transition-all",
                subtitles.position === 'top' && "absolute top-4",
                subtitles.position === 'center' && "absolute top-1/2 -translate-y-1/2",
              )}
              style={{
                color: subtitles.color,
                backgroundColor: `${subtitles.backgroundColor}${Math.round(subtitles.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
                fontSize: `${Math.min(subtitles.fontSize * 0.6, 20)}px`,
                textShadow: subtitles.style === 'glow' ? `0 0 10px ${subtitles.color}, 0 0 20px ${subtitles.color}50` : undefined,
              }}
            >
              <span className="font-semibold">Sample subtitle text preview</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
