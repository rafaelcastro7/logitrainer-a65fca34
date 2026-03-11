import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, Film, Wand2, Image, Mic, Monitor, Palette, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to LogiTrainer Studio',
    description: 'The most advanced AI video creation platform. Let me show you how to create professional videos in minutes.',
    gradient: 'from-primary/20 to-accent/20',
  },
  {
    icon: Wand2,
    title: 'AI Script Generation',
    description: 'Enter any topic and our AI generates a complete video script with scene-by-scene breakdown, image prompts, and narration text.',
    gradient: 'from-accent/20 to-primary/20',
  },
  {
    icon: Image,
    title: 'Stunning Visuals',
    description: 'Each scene gets AI-generated images in 8K quality. Customize image prompts, animations (Ken Burns), and transitions between scenes.',
    gradient: 'from-success/20 to-primary/20',
  },
  {
    icon: Mic,
    title: 'Natural Voice Narration',
    description: 'Choose from 6 professional AI voices with emotion control. Each scene can have its own voice and tone for maximum impact.',
    gradient: 'from-warning/20 to-accent/20',
  },
  {
    icon: Palette,
    title: 'Brand Kit & Subtitles',
    description: 'Apply your brand colors, logo, and watermark. Enable auto-subtitles with 6 animation styles like CapCut\'s karaoke mode.',
    gradient: 'from-primary/20 to-success/20',
  },
  {
    icon: Monitor,
    title: 'Preview & Export',
    description: 'Preview your video with background music, then export in 720p, 1080p, or 4K. Support for 16:9, 9:16, and 1:1 formats.',
    gradient: 'from-accent/20 to-warning/20',
  },
];

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg w-full mx-4"
        >
          <div className="glass-panel-elevated rounded-2xl p-8 space-y-6 relative overflow-hidden noise-overlay">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${current.gradient} opacity-30`} />

            {/* Skip button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/15 flex items-center justify-center shadow-lg">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <h2 className="text-xl font-bold">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {current.description}
              </p>
            </div>

            {/* Actions */}
            <div className="relative z-10 flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground/50">
                {step + 1} of {STEPS.length}
              </span>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(step - 1)}
                    className="text-xs"
                  >
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  className="gap-1.5 glow-primary"
                  onClick={() => isLast ? onComplete() : setStep(step + 1)}
                >
                  {isLast ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
