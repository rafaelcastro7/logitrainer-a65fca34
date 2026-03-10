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

const ITEMS = [...TECH_PARTNERS, ...TECH_PARTNERS];

export default function LogoCarousel() {
  return (
    <div className="w-full overflow-hidden py-4 relative">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-4 items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ x: { duration: 45, repeat: Infinity, ease: 'linear' } }}
        style={{ width: 'max-content' }}
      >
        {ITEMS.map((partner, i) => {
          const Icon = partner.icon;
          return (
            <div
              key={`${partner.name}-${i}`}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border/15 bg-card/20 backdrop-blur-sm hover:border-primary/25 hover:bg-card/40 transition-all duration-300 group shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary/80 transition-colors" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground/60 group-hover:text-foreground/80 transition-colors whitespace-nowrap">
                  {partner.name}
                </p>
                <p className="text-[9px] text-muted-foreground/50 whitespace-nowrap">
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
