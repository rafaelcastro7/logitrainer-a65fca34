import { motion } from 'framer-motion';
import { Plus, Sparkles, Play, Flag, MessageSquare, Layers, Megaphone, BookOpen } from 'lucide-react';
import { Scene } from '@/types/project';
import { cn } from '@/lib/utils';

interface SceneTemplatesProps {
  onAddScene: (scene: Scene) => void;
  currentCount: number;
}

interface SceneTemplate {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  scene: Omit<Scene, 'id'>;
}

const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    id: 'intro',
    label: 'Intro',
    icon: Play,
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    scene: {
      name: 'Intro',
      script: '',
      image_prompt: 'Cinematic title card, bold typography, dark gradient background, professional intro, 8k',
      duration: 5,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'zoom_in', intensity: 0.4 },
      notes: 'Opening hook — grab attention in the first 3 seconds',
      transition: 'fade',
    },
  },
  {
    id: 'chapter',
    label: 'Chapter Title',
    icon: BookOpen,
    color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
    scene: {
      name: 'Chapter Title',
      script: '',
      image_prompt: 'Clean chapter title card, minimal design, centered text area, subtle gradient, elegant typography space',
      duration: 4,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'static', intensity: 0.2 },
      notes: 'Section divider — add chapter name',
      transition: 'dissolve',
    },
  },
  {
    id: 'content',
    label: 'Content',
    icon: Layers,
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    scene: {
      name: 'Content',
      script: '',
      image_prompt: '',
      duration: 8,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'zoom_in', intensity: 0.3 },
      notes: '',
      transition: 'fade',
    },
  },
  {
    id: 'cta',
    label: 'Call to Action',
    icon: Megaphone,
    color: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400',
    scene: {
      name: 'Call to Action',
      script: '',
      image_prompt: 'Bold call to action design, vibrant colors, arrow graphics, subscribe button visual, energetic, motivational',
      duration: 6,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'zoom_out', intensity: 0.5 },
      notes: 'CTA — like, subscribe, visit website, etc.',
      transition: 'wipe_left',
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: MessageSquare,
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
    scene: {
      name: 'Quote',
      script: '',
      image_prompt: 'Elegant quote card, serif typography, dark moody background, cinematic, inspirational atmosphere',
      duration: 6,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'pan_left', intensity: 0.2 },
      notes: 'Add an impactful quote',
      transition: 'dissolve',
    },
  },
  {
    id: 'outro',
    label: 'Outro',
    icon: Flag,
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400',
    scene: {
      name: 'Outro',
      script: '',
      image_prompt: 'Professional outro card, thank you message, social media icons, dark gradient, end screen layout, 8k',
      duration: 5,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'zoom_out', intensity: 0.3 },
      notes: 'Closing — thank viewers, credits, social links',
      transition: 'fade',
    },
  },
];

export default function SceneTemplates({ onAddScene, currentCount }: SceneTemplatesProps) {
  const handleAdd = (template: SceneTemplate) => {
    const scene: Scene = {
      ...template.scene,
      id: crypto.randomUUID(),
      name: `${template.scene.name} ${currentCount + 1}`,
    };
    onAddScene(scene);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" /> Quick Add Scene
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {SCENE_TEMPLATES.map(template => {
          const Icon = template.icon;
          return (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAdd(template)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all bg-gradient-to-r",
                template.color
              )}
            >
              <Icon className="w-3 h-3" />
              {template.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}