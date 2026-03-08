import { Plus, Clapperboard, Clock } from 'lucide-react';
import { Scene } from '@/types/project';
import { Button } from '@/components/ui/button';
import SceneCard from './SceneCard';
import { AnimatePresence } from 'framer-motion';

interface EditorViewProps {
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onRemoveScene: (id: string) => void;
  onAddScene: (scene: Scene) => void;
}

function createEmptyScene(index: number): Scene {
  return {
    id: crypto.randomUUID(),
    name: `Escena ${index + 1}`,
    script: '',
    image_prompt: '',
    duration: 8,
    audio: { status: 'pending', url: null },
    image: { status: 'pending', url: null },
    animation: { type: 'zoom_in', intensity: 0.3 },
    notes: '',
  };
}

export default function EditorView({ scenes, onUpdateScene, onRemoveScene, onAddScene }: EditorViewProps) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Línea de Tiempo</h2>
          <span className="text-sm text-muted-foreground">
            {scenes.length} escena{scenes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" /> {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
          </span>
          <Button size="sm" className="gap-1.5" onClick={() => onAddScene(createEmptyScene(scenes.length))}>
            <Plus className="w-4 h-4" /> Agregar Escena
          </Button>
        </div>
      </div>

      {/* Scene List */}
      {scenes.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Clapperboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No hay escenas aún.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Usa el Generador Mágico o agrega escenas manualmente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {scenes.map((scene, i) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={i}
                onUpdate={onUpdateScene}
                onRemove={onRemoveScene}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
