import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, Wand2, ArrowRight, Zap, Image, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import heroImage from '@/assets/hero-studio.jpg';

interface WelcomeScreenProps {
  onStart: (topic: string) => void;
  isGenerating: boolean;
}

const features = [
  { icon: Wand2, title: 'Guión con IA', desc: 'Genera guiones educativos automáticamente' },
  { icon: Image, title: 'Imágenes IA', desc: 'Crea visuales únicos para cada escena' },
  { icon: Mic, title: 'Narración TTS', desc: 'Voces profesionales en múltiples idiomas' },
  { icon: Video, title: 'Export Video', desc: 'Renderiza y descarga en un clic' },
];

export default function WelcomeScreen({ onStart, isGenerating }: WelcomeScreenProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onStart(topic.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl w-full text-center space-y-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 glow-primary">
            <Film className="w-7 h-7 text-primary" />
          </div>
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-gradient-primary">LogiTrainer</span>{' '}
            <span className="text-foreground">Studio</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Crea videos educativos profesionales con IA. Escribe un tema y deja que la magia suceda.
          </p>
        </div>

        {/* Main CTA */}
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
              placeholder="¿Sobre qué quieres crear un video?"
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
                Creando...
              </>
            ) : (
              <>
                Crear Video
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6"
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

        {/* Quick Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
        >
          <span className="text-xs text-muted-foreground">Prueba con:</span>
          {['Revolución Industrial', 'Sistema Solar', 'Inteligencia Artificial', 'Fotosíntesis'].map(example => (
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
