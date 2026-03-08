import { motion } from 'framer-motion';
import { Sparkles, Cpu, Zap, Globe, Layers, Brain, Eye, Music, Mic, Video, ImagePlus, Code2, Shield, Server, Wand2, Film } from 'lucide-react';

const TECH_PARTNERS = [
  { name: 'Gemini Pro', icon: Sparkles, category: 'Script AI' },
  { name: 'GPT-5', icon: Brain, category: 'Reasoning' },
  { name: 'ElevenLabs', icon: Mic, category: 'Voice AI' },
  { name: 'DALL·E', icon: ImagePlus, category: 'Image AI' },
  { name: 'Stable Diffusion', icon: Eye, category: 'Visual AI' },
  { name: 'Suno AI', icon: Music, category: 'Music AI' },
  { name: 'Ken Burns', icon: Film, category: 'Animation' },
  { name: 'WebM Codec', icon: Video, category: 'Rendering' },
  { name: 'Anthropic', icon: Code2, category: 'Analysis' },
  { name: 'Perplexity', icon: Globe, category: 'Research' },
  { name: 'Replicate', icon: Cpu, category: 'Inference' },
  { name: 'Smart Router', icon: Zap, category: 'QoS Engine' },
  { name: 'Multi-Cloud', icon: Layers, category: 'Infrastructure' },
  { name: 'Enterprise', icon: Shield, category: 'Security' },
  { name: 'Edge CDN', icon: Server, category: 'Delivery' },
  { name: 'AI Pipeline', icon: Wand2, category: 'Orchestration' },
];

// Duplicate for seamless infinite scroll
const ITEMS = [...TECH_PARTNERS, ...TECH_PARTNERS];

export default function LogoCarousel() {
  return (
    <div className="w-full overflow-hidden py-6 relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-6 items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          x: {
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{ width: 'max-content' }}
      >
        {ITEMS.map((partner, i) => {
          const Icon = partner.icon;
          return (
            <div
              key={`${partner.name}-${i}`}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/70 transition-all duration-300 group shrink-0 min-w-[180px]"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-4.5 h-4.5 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors whitespace-nowrap">
                  {partner.name}
                </p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {partner.category}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
