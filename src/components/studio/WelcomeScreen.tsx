import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Film, ArrowRight, Zap, Image, Mic, Video, ChevronRight, Layers, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/LanguageContext';
import { VIDEO_TEMPLATES, VideoTemplate } from '@/types/project';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  onStart: (topic: string) => void;
  isGenerating: boolean;
  onApplyTemplate?: (template: VideoTemplate) => void;
}

export default function WelcomeScreen({ onStart, isGenerating, onApplyTemplate }: WelcomeScreenProps) {
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { t } = useTranslation();

  const features = [
    { icon: Sparkles, title: t.featureScript, desc: t.featureScriptDesc, gradient: 'from-primary/8 to-accent/5' },
    { icon: Image, title: t.featureImages, desc: t.featureImagesDesc, gradient: 'from-accent/8 to-primary/5' },
    { icon: Mic, title: t.featureTTS, desc: t.featureTTSDesc, gradient: 'from-success/8 to-primary/5' },
    { icon: Video, title: t.featureExport, desc: t.featureExportDesc, gradient: 'from-primary/8 to-success/5' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      if (selectedTemplate && onApplyTemplate) onApplyTemplate(selectedTemplate);
      onStart(topic.trim());
    }
  };

  const handleSelectTemplate = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    if (onApplyTemplate) onApplyTemplate(template);
    setShowTemplates(false);
    if (template.sampleTopics.length > 0 && !topic.trim()) setTopic(template.sampleTopics[0]);
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Ambient light */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[400px] bg-accent/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-3xl w-full text-center space-y-10 pt-24 px-6"
      >
        {/* Mark */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-2xl scale-[2] animate-pulse-glow" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15 flex items-center justify-center">
              <Film className="w-7 h-7 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
            <span className="text-gradient-primary">{t.welcomeTitle}</span>{' '}
            <span className="text-foreground">{t.welcomeSubtitle}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t.welcomeDesc}
          </p>
        </div>

        {/* Template toggle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-primary/70" />
            {selectedTemplate ? (
              <span>{selectedTemplate.icon} {selectedTemplate.name}</span>
            ) : (
              <span>{'chooseTemplate' in t ? (t as any).chooseTemplate : 'Start from a template'}</span>
            )}
            <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", showTemplates && "rotate-90")} />
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
                  {VIDEO_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        "rounded-lg border border-border/40 bg-card/50 p-3.5 text-left transition-all hover:border-primary/25 group",
                        selectedTemplate?.id === template.id && "ring-1 ring-primary/40 border-primary/30"
                      )}
                    >
                      <span className="text-xl mb-1.5 block">{template.icon}</span>
                      <p className="text-xs font-semibold text-foreground">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-2.5 max-w-xl mx-auto"
        >
          <div className="flex-1 relative group">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t.welcomeInput}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="pl-10 h-12 bg-card/60 border-border/40 text-sm rounded-xl focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!topic.trim() || isGenerating}
            className="h-12 gap-2 px-6 rounded-xl text-sm font-semibold glow-primary"
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">{t.creating}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">{t.createVideo}</span>
              </>
            )}
          </Button>
        </motion.form>

        {/* Quick topics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          <span className="text-[11px] text-muted-foreground/50 mr-1">{t.tryWith}</span>
          {(selectedTemplate?.sampleTopics || [t.topicIndustrialRev, t.topicSolarSystem, t.topicAI]).map(example => (
            <button
              key={example}
              onClick={() => setTopic(example)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-secondary/40 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/70 border border-transparent hover:border-border/40 transition-all"
            >
              {example}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative z-10 max-w-3xl w-full px-6 mt-20 mb-20 grid grid-cols-2 md:grid-cols-4 gap-2.5"
      >
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.06 }}
              className="rounded-xl border border-border/30 bg-card/40 p-4 text-center group hover:border-primary/15 transition-all duration-300"
            >
              <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-2.5", f.gradient)}>
                <Icon className="w-4 h-4 text-primary/80" />
              </div>
              <p className="text-xs font-semibold text-foreground">{f.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
