import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Film, Wand2, ArrowRight, Zap, Image, Mic, Video, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/LanguageContext';
import { VIDEO_TEMPLATES, VideoTemplate, ProjectMeta } from '@/types/project';
import heroImage from '@/assets/hero-studio.jpg';
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
    { icon: Wand2, title: t.featureScript, desc: t.featureScriptDesc },
    { icon: Image, title: t.featureImages, desc: t.featureImagesDesc },
    { icon: Mic, title: t.featureTTS, desc: t.featureTTSDesc },
    { icon: Video, title: t.featureExport, desc: t.featureExportDesc },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      if (selectedTemplate && onApplyTemplate) {
        onApplyTemplate(selectedTemplate);
      }
      onStart(topic.trim());
    }
  };

  const handleSelectTemplate = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    if (onApplyTemplate) onApplyTemplate(template);
    setShowTemplates(false);
    // Pre-fill a sample topic
    if (template.sampleTopics.length > 0 && !topic.trim()) {
      setTopic(template.sampleTopics[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl w-full text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 glow-primary">
            <Film className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-gradient-primary">{t.welcomeTitle}</span>{' '}
            <span className="text-foreground">{t.welcomeSubtitle}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {t.welcomeDesc}
          </p>
        </div>

        {/* Template Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all mb-4"
          >
            <Layers className="w-4 h-4 text-primary" />
            {selectedTemplate ? (
              <span>{selectedTemplate.icon} {selectedTemplate.name}</span>
            ) : (
              <span>{'chooseTemplate' in t ? (t as any).chooseTemplate : 'Start from a template'}</span>
            )}
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showTemplates && "rotate-90")} />
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {VIDEO_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        "glass-panel rounded-xl p-4 text-left transition-all hover:border-primary/30 group relative overflow-hidden",
                        selectedTemplate?.id === template.id && "ring-2 ring-primary border-primary/50"
                      )}
                    >
                      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity", template.color)} />
                      <span className="text-2xl mb-2 block">{template.icon}</span>
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                          {template.meta.aspectRatio || '16:9'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                          {template.meta.durationTarget}s
                        </span>
                      </div>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-3 max-w-xl mx-auto"
        >
          <div className="flex-1 relative">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <Input
              placeholder={t.welcomeInput}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="pl-10 h-12 bg-card/80 border-border/50 text-base backdrop-blur-sm"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!topic.trim() || isGenerating}
            className="h-12 gap-2 glow-primary px-6"
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                {t.creating}
              </>
            ) : (
              <>
                {t.createVideo}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="glass-panel rounded-xl p-4 text-center hover:border-primary/30 transition-colors"
              >
                <Icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Topics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
        >
          <span className="text-xs text-muted-foreground">{t.tryWith}</span>
          {(selectedTemplate?.sampleTopics || [t.topicIndustrialRev, t.topicSolarSystem, t.topicAI, t.topicPhotosynthesis]).map(example => (
            <button
              key={example}
              onClick={() => setTopic(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {example}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
