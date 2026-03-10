import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Film, Wand2, ArrowRight, Zap, Image, Mic, Video, ChevronRight, Layers, Play, Star, Cpu, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/LanguageContext';
import { VIDEO_TEMPLATES, VideoTemplate } from '@/types/project';
import { cn } from '@/lib/utils';
import LogoCarousel from './LogoCarousel';

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
    { icon: Wand2, title: t.featureScript, desc: t.featureScriptDesc, stat: '15+ Models', gradient: 'from-primary/20 to-accent/20' },
    { icon: Image, title: t.featureImages, desc: t.featureImagesDesc, stat: '8K Quality', gradient: 'from-accent/20 to-primary/20' },
    { icon: Mic, title: t.featureTTS, desc: t.featureTTSDesc, stat: '6 Voices', gradient: 'from-success/20 to-primary/20' },
    { icon: Video, title: t.featureExport, desc: t.featureExportDesc, stat: '4K Export', gradient: 'from-warning/20 to-accent/20' },
  ];

  const trustMetrics = [
    { value: '10K+', label: 'Videos Created', icon: Film },
    { value: '99.9%', label: 'Uptime SLA', icon: Shield },
    { value: '4 Lang', label: 'Supported', icon: Globe },
    { value: '50K+', label: 'Creators', icon: Cpu },
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
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-4xl w-full text-center space-y-8 pt-20 px-6"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] border border-primary/15 text-primary text-xs font-medium backdrop-blur-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Powered by 15+ AI Models</span>
          <span className="text-primary/40">•</span>
          <span>Smart QoS Router</span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl scale-150 animate-pulse-glow" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 via-card to-accent/10 border border-primary/15 shadow-2xl shadow-primary/10">
              <Film className="w-10 h-10 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="text-gradient-primary">{t.welcomeTitle}</span>{' '}
            <span className="text-foreground">{t.welcomeSubtitle}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.welcomeDesc}
          </p>
        </div>

        {/* Template Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted/30 border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/50 transition-all mb-4 backdrop-blur-sm"
          >
            <Layers className="w-4 h-4 text-primary" />
            {selectedTemplate ? (
              <span>{selectedTemplate.icon} {selectedTemplate.name}</span>
            ) : (
              <span>{'chooseTemplate' in t ? (t as any).chooseTemplate : 'Start from a template'}</span>
            )}
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", showTemplates && "rotate-90")} />
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
                        "glass-panel rounded-xl p-4 text-left transition-all hover:border-primary/25 group relative overflow-hidden",
                        selectedTemplate?.id === template.id && "ring-2 ring-primary/50 border-primary/30"
                      )}
                    >
                      <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity", template.color)} />
                      <span className="text-2xl mb-2 block">{template.icon}</span>
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{template.meta.aspectRatio || '16:9'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{template.meta.durationTarget}s</span>
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
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex gap-3 max-w-2xl mx-auto"
        >
          <div className="flex-1 relative group">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t.welcomeInput}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="pl-12 h-14 bg-card/60 border-border/30 text-base backdrop-blur-xl rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!topic.trim() || isGenerating}
            className="h-14 gap-2.5 px-8 rounded-xl text-base font-semibold glow-primary relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 transition-opacity animate-gradient" />
            {isGenerating ? (
              <>
                <Zap className="w-5 h-5 animate-spin" />
                {t.creating}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {t.createVideo}
              </>
            )}
          </Button>
        </motion.form>

        {/* Quick Topics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground/60">{t.tryWith}</span>
          {(selectedTemplate?.sampleTopics || [t.topicIndustrialRev, t.topicSolarSystem, t.topicAI, t.topicPhotosynthesis]).map(example => (
            <button
              key={example}
              onClick={() => setTopic(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted/20 text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 border border-transparent hover:border-border/30 transition-all"
            >
              {example}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Logo Carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.8 }}
        className="relative z-10 w-full mt-16"
      >
        <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 font-medium">
          Powered by Industry-Leading AI
        </p>
        <LogoCarousel />
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.6 }}
        className="relative z-10 max-w-4xl w-full px-6 mt-10 grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="glass-panel rounded-2xl p-5 text-center hover:border-primary/20 transition-all group relative overflow-hidden noise-overlay"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500", f.gradient)} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-bold">{f.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                <p className="text-[10px] text-primary/60 font-semibold mt-2">{f.stat}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Trust Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.5 }}
        className="relative z-10 max-w-3xl w-full px-6 mt-12 mb-20"
      >
        <div className="flex items-center justify-center gap-8 md:gap-14 py-6 border-t border-b border-border/10">
          {trustMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="text-center group">
                <Icon className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                <p className="text-lg md:text-xl font-bold text-gradient-primary">{metric.value}</p>
                <p className="text-[10px] text-muted-foreground/50">{metric.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
