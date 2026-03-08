import { useState } from 'react';
import { Music, Volume2, VolumeX, Loader2, Sparkles, RotateCw, Upload, Trash2 } from 'lucide-react';
import { BackgroundMusic } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface BackgroundMusicPanelProps {
  music: BackgroundMusic;
  onUpdate: (updates: Partial<BackgroundMusic>) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const PRESET_MOODS = [
  { id: 'cinematic', emoji: '🎬', prompt: 'cinematic orchestral background music, epic, inspiring, documentary style' },
  { id: 'calm', emoji: '🌿', prompt: 'calm ambient background music, soft piano, peaceful, meditation style' },
  { id: 'upbeat', emoji: '⚡', prompt: 'upbeat energetic background music, modern pop, motivational, corporate style' },
  { id: 'dramatic', emoji: '🔥', prompt: 'dramatic intense background music, suspenseful, tension building, cinematic strings' },
  { id: 'educational', emoji: '📚', prompt: 'light educational background music, curious, playful, science documentary style' },
  { id: 'lofi', emoji: '🎧', prompt: 'lo-fi hip hop beats, chill, relaxing, study music, warm vinyl texture' },
];

export default function BackgroundMusicPanel({ music, onUpdate, onGenerate, isGenerating }: BackgroundMusicPanelProps) {
  const { t } = useTranslation();
  const [customPrompt, setCustomPrompt] = useState(music.prompt || '');
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const handlePreview = () => {
    if (!music.url) return;

    if (isPreviewPlaying && previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setIsPreviewPlaying(false);
      return;
    }

    const audio = new Audio(music.url);
    audio.volume = music.volume;
    audio.loop = music.loop;
    audio.onended = () => setIsPreviewPlaying(false);
    audio.play().catch(() => {});
    setPreviewAudio(audio);
    setIsPreviewPlaying(true);
  };

  const handleRemove = () => {
    if (previewAudio) { previewAudio.pause(); setIsPreviewPlaying(false); }
    onUpdate({ url: null, name: '', status: 'none', prompt: '' });
  };

  const handleGeneratePreset = (preset: typeof PRESET_MOODS[0]) => {
    setCustomPrompt(preset.prompt);
    onGenerate(preset.prompt);
  };

  return (
    <section className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" /> {t.backgroundMusic}
        </h3>
        {music.status === 'ready' && music.url && (
          <Badge variant="outline" className="text-[10px] bg-success/20 text-success gap-1">
            <Volume2 className="w-2.5 h-2.5" /> {t.ready}
          </Badge>
        )}
      </div>

      {/* Mood Presets */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t.musicMoods}</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_MOODS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleGeneratePreset(preset)}
              disabled={isGenerating}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                "bg-secondary/30 border-border/50 text-muted-foreground",
                "hover:bg-primary/10 hover:border-primary/30 hover:text-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {preset.emoji} {t[`mood_${preset.id}` as keyof typeof t] as string || preset.id}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div className="flex gap-2">
        <Input
          placeholder={t.musicPromptPlaceholder}
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && customPrompt.trim() && onGenerate(customPrompt.trim())}
          className="flex-1 bg-muted/50 border-border/50 h-9 text-sm"
          disabled={isGenerating}
        />
        <Button
          size="sm"
          className="gap-1.5 h-9"
          disabled={!customPrompt.trim() || isGenerating}
          onClick={() => onGenerate(customPrompt.trim())}
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isGenerating ? t.generating : t.generateMusic}
        </Button>
      </div>

      {/* Player & Controls */}
      {music.url && music.status === 'ready' && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 shrink-0"
              onClick={handlePreview}
            >
              {isPreviewPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{music.name || t.generatedTrack}</p>
              {music.prompt && (
                <p className="text-[10px] text-muted-foreground truncate">{music.prompt}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => onGenerate(music.prompt || customPrompt)}>
              <RotateCw className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive" onClick={handleRemove}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Volume */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t.musicVolume} ({Math.round(music.volume * 100)}%)</Label>
            <Slider
              value={[music.volume]}
              onValueChange={([v]) => {
                onUpdate({ volume: v });
                if (previewAudio) previewAudio.volume = v;
              }}
              min={0} max={1} step={0.05}
            />
          </div>

          {/* Fade In/Out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t.fadeIn} ({music.fadeIn}s)</Label>
              <Slider value={[music.fadeIn]} onValueChange={([v]) => onUpdate({ fadeIn: v })} min={0} max={10} step={0.5} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t.fadeOut} ({music.fadeOut}s)</Label>
              <Slider value={[music.fadeOut]} onValueChange={([v]) => onUpdate({ fadeOut: v })} min={0} max={10} step={0.5} />
            </div>
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t.loopMusic}</Label>
            <Switch checked={music.loop} onCheckedChange={v => onUpdate({ loop: v })} />
          </div>
        </div>
      )}

      {music.status === 'generating' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">{t.generatingMusic}</span>
        </div>
      )}

      {music.status === 'error' && (
        <div className="text-xs text-destructive p-2 rounded bg-destructive/10">
          {t.musicError}
        </div>
      )}
    </section>
  );
}
