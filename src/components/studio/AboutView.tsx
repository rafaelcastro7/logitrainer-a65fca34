import { motion } from 'framer-motion';
import {
  Film, Wand2, Image, Mic, Video, Zap, Globe, Shield,
  Layers, Cpu, Sparkles, ArrowRight, CheckCircle2, Star,
  BarChart3, Users, Clock, Code2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';

const fadeUp = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" as const },
  }),
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" as const },
  }),
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

interface AboutViewProps {
  onNavigate: (tab: string) => void;
}

export default function AboutView({ onNavigate }: AboutViewProps) {
  const { t } = useTranslation();

  const pillars = [
    { icon: Wand2, title: t.aboutPillarScript, desc: t.aboutPillarScriptDesc, color: 'from-primary to-accent' },
    { icon: Image, title: t.aboutPillarImage, desc: t.aboutPillarImageDesc, color: 'from-[hsl(280,80%,65%)] to-primary' },
    { icon: Mic, title: t.aboutPillarTTS, desc: t.aboutPillarTTSDesc, color: 'from-success to-[hsl(170,70%,45%)]' },
    { icon: Video, title: t.aboutPillarRender, desc: t.aboutPillarRenderDesc, color: 'from-warning to-[hsl(20,90%,55%)]' },
  ];

  const stats = [
    { value: '15+', label: t.aboutStatModels, icon: Cpu },
    { value: '3', label: t.aboutStatLanguages, icon: Globe },
    { value: '5', label: t.aboutStatProviders, icon: Layers },
    { value: '∞', label: t.aboutStatProjects, icon: Film },
  ];

  const workflow = [
    { step: '01', title: t.aboutStep1Title, desc: t.aboutStep1Desc, icon: Sparkles },
    { step: '02', title: t.aboutStep2Title, desc: t.aboutStep2Desc, icon: Wand2 },
    { step: '03', title: t.aboutStep3Title, desc: t.aboutStep3Desc, icon: Image },
    { step: '04', title: t.aboutStep4Title, desc: t.aboutStep4Desc, icon: Mic },
    { step: '05', title: t.aboutStep5Title, desc: t.aboutStep5Desc, icon: Video },
  ];

  const techStack = [
    { name: 'Gemini 3 Pro', category: t.aboutTechScript },
    { name: 'Gemini Flash Image', category: t.aboutTechImage },
    { name: 'GPT-5', category: t.aboutTechReasoning },
    { name: 'ElevenLabs', category: t.aboutTechVoice },
    { name: 'Ken Burns Engine', category: t.aboutTechAnimation },
    { name: 'WebM Renderer', category: t.aboutTechExport },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-24 overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="text-center space-y-6"
      >
        <motion.div variants={fadeUp} custom={0}>
          <Badge variant="outline" className="text-xs px-3 py-1 mb-4 border-primary/30 text-primary">
            <Zap className="w-3 h-3 mr-1" /> {t.aboutBadge}
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]"
        >
          <span className="text-gradient-primary">{t.aboutHeroLine1}</span>
          <br />
          <span className="text-foreground">{t.aboutHeroLine2}</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          {t.aboutHeroDesc}
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4 pt-4">
          <Button size="lg" className="gap-2 glow-primary h-12 px-8" onClick={() => onNavigate('dashboard')}>
            {t.aboutCTA}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="gap-2 h-12 px-8" onClick={() => onNavigate('apis')}>
            <Code2 className="w-4 h-4" />
            {t.aboutCTAApis}
          </Button>
        </motion.div>
      </motion.section>

      {/* ===== STATS BAR ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={scaleUp}
              custom={i}
              className="glass-panel rounded-2xl p-6 text-center group hover:border-primary/30 transition-colors"
            >
              <Icon className="w-5 h-5 mx-auto mb-3 text-primary/60 group-hover:text-primary transition-colors" />
              <p className="text-3xl font-bold text-gradient-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* ===== FOUR PILLARS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="space-y-8"
      >
        <motion.div variants={fadeUp} custom={0} className="text-center space-y-3">
          <h2 className="text-3xl font-bold">{t.aboutPillarsTitle}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t.aboutPillarsDesc}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                variants={i % 2 === 0 ? slideInLeft : slideInRight}
                custom={i + 1}
                className="glass-panel rounded-2xl p-6 group hover:border-primary/30 transition-all relative overflow-hidden"
              >
                {/* Gradient accent line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ===== WORKFLOW ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="space-y-8"
      >
        <motion.div variants={fadeUp} custom={0} className="text-center space-y-3">
          <h2 className="text-3xl font-bold">{t.aboutWorkflowTitle}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t.aboutWorkflowDesc}</p>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[27px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-transparent hidden md:block" />

          <div className="space-y-4">
            {workflow.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex items-start gap-5 group"
                >
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-card border border-border/50 flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:glow-primary transition-all">
                    <span className="text-xs font-bold text-primary font-mono">{step.step}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-5 flex-1 group-hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ===== TECH STACK ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="space-y-8"
      >
        <motion.div variants={fadeUp} custom={0} className="text-center space-y-3">
          <h2 className="text-3xl font-bold">{t.aboutTechTitle}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t.aboutTechDesc}</p>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="glass-panel rounded-xl px-5 py-4 flex items-center gap-3 hover:border-primary/30 transition-colors group"
            >
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold">{tech.name}</p>
                <p className="text-[11px] text-muted-foreground">{tech.category}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ===== BOTTOM CTA ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="text-center space-y-6 pb-12"
      >
        <motion.div variants={fadeUp} custom={0}>
          <div className="glass-panel rounded-3xl p-10 md:p-16 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(280,80%,65%)]/5 pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <Star className="w-8 h-8 mx-auto text-primary animate-pulse-glow" />
              <h2 className="text-2xl md:text-3xl font-bold">{t.aboutBottomTitle}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">{t.aboutBottomDesc}</p>
              <Button size="lg" className="gap-2 glow-primary h-12 px-10" onClick={() => onNavigate('dashboard')}>
                {t.aboutBottomCTA}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
