import { useState } from 'react';
import { Wand2, Settings2, Palette, Clock, Sparkles, ChevronDown, ChevronRight, Monitor, Smartphone, Square } from 'lucide-react';
import { ProjectMeta, BackgroundMusic, AspectRatio, BrandKit, SubtitleSettings } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import BackgroundMusicPanel from './BackgroundMusicPanel';
import BrandKitPanel from './BrandKitPanel';
import SubtitlePanel from './SubtitlePanel';

interface DashboardViewProps {
  meta: ProjectMeta;
  onUpdateMeta: (updates: Partial<ProjectMeta>) => void;
  onGenerate: (topic: string) => void;
  isGenerating: boolean;
  scenesCount: number;
  backgroundMusic: BackgroundMusic;
  onUpdateMusic: (updates: Partial<BackgroundMusic>) => void;
  onGenerateMusic: (prompt: string) => void;
  isMusicGenerating: boolean;
}

const voices = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Aoede', 'Leda'];

const contentLanguages = [
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'pt', label: '🇧🇷 Português' },
];

export default function DashboardView({ meta, onUpdateMeta, onGenerate, isGenerating, scenesCount, backgroundMusic, onUpdateMusic, onGenerateMusic, isMusicGenerating }: DashboardViewProps) {
  const [topic, setTopic] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const { t } = useTranslation();

  const emotions: { value: string; label: string }[] = [
    { value: 'professional', label: t.professional },
    { value: 'happy', label: t.happy },
    { value: 'calm', label: t.calm },
    { value: 'energetic', label: t.energetic },
    { value: 'dramatic', label: t.dramatic },
  ];

  const quickTopics = [
    t.topicIndustrialRev,
    t.topicSolarSystem,
    t.topicAI,
    t.topicPhotosynthesis,
    t.topicWWII,
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Magic Generator */}
      <section className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
            <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t.magicGenerator}</h2>
            <p className="text-sm text-muted-foreground">
              {scenesCount > 0
                ? t.magicGeneratorDescExisting(scenesCount)
                : t.magicGeneratorDescNew
              }
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder={t.topicPlaceholder}
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
            {isGenerating ? t.generating : t.generate}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">{t.ideas}</span>
          {quickTopics.map(topic => (
            <button
              key={topic}
              onClick={() => setTopic(topic)}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {topic}
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
        {t.projectSettings}
      </button>

      {settingsOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> {t.general}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t.name}</Label>
                <Input value={meta.name} onChange={e => onUpdateMeta({ name: e.target.value })} className="bg-muted/50 border-border/50 h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t.author}</Label>
                <Input value={meta.author} onChange={e => onUpdateMeta({ author: e.target.value })} className="bg-muted/50 border-border/50 h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.language}</Label>
                  <Select value={meta.language} onValueChange={v => onUpdateMeta({ language: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {contentLanguages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.aiQuality}</Label>
                  <Select value={meta.modelTier} onValueChange={v => onUpdateMeta({ modelTier: v as 'prototyping' | 'production' })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prototyping">{t.prototype}</SelectItem>
                      <SelectItem value="production">{t.production}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <Label className="text-xs">Aspect Ratio</Label>
                <div className="flex gap-2">
                  {([
                    { value: '16:9' as AspectRatio, icon: Monitor, label: '16:9 YouTube' },
                    { value: '9:16' as AspectRatio, icon: Smartphone, label: '9:16 Shorts' },
                    { value: '1:1' as AspectRatio, icon: Square, label: '1:1 Social' },
                  ]).map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onUpdateMeta({ aspectRatio: opt.value })}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-all",
                          meta.aspectRatio === opt.value
                            ? "bg-primary/15 border-primary/40 text-primary font-medium"
                            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> {t.timeAndVoice}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t.targetDuration(meta.durationTarget)}</Label>
                <Slider value={[meta.durationTarget]} onValueChange={([v]) => onUpdateMeta({ durationTarget: v })} min={30} max={600} step={10} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t.secPerScene(meta.secondsPerScene)}</Label>
                <Slider value={[meta.secondsPerScene]} onValueChange={([v]) => onUpdateMeta({ secondsPerScene: v })} min={3} max={30} step={1} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.voice}</Label>
                  <Select value={meta.voiceName} onValueChange={v => onUpdateMeta({ voiceName: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {voices.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.emotion}</Label>
                  <Select value={meta.defaultEmotion} onValueChange={v => onUpdateMeta({ defaultEmotion: v })}>
                    <SelectTrigger className="bg-muted/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {emotions.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs">{t.frameOptimization}</Label>
                <Switch checked={meta.frameOptimization} onCheckedChange={v => onUpdateMeta({ frameOptimization: v })} />
              </div>
            </div>
          </section>
        </div>
      )}

      {settingsOpen && (
        <>
          <section className="glass-panel rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> {t.globalVisualStyle}
            </h3>
            <Textarea
              value={meta.visualStyle}
              onChange={e => onUpdateMeta({ visualStyle: e.target.value })}
              rows={2}
              placeholder={t.visualStylePlaceholder}
              className="bg-muted/50 border-border/50 resize-none text-sm"
            />
          </section>

          <BackgroundMusicPanel
            music={backgroundMusic}
            onUpdate={onUpdateMusic}
            onGenerate={onGenerateMusic}
            isGenerating={isMusicGenerating}
          />

          <BrandKitPanel
            brandKit={meta.brandKit}
            onUpdate={(updates) => onUpdateMeta({ brandKit: { ...meta.brandKit, ...updates } })}
          />

          <SubtitlePanel
            subtitles={meta.subtitles}
            onUpdate={(updates) => onUpdateMeta({ subtitles: { ...meta.subtitles, ...updates } })}
          />
        </>
      )}
    </div>
  );
}
