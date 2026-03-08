import { useState } from 'react';
import { Plus, Clapperboard, Clock, Wand2, Image, Mic } from 'lucide-react';
import { Scene } from '@/types/project';
import { Button } from '@/components/ui/button';
import SceneCard from './SceneCard';
import MiniTimeline from './MiniTimeline';
import { AnimatePresence } from 'framer-motion';

interface EditorViewProps {
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onRemoveScene: (id: string) => void;
  onAddScene: (scene: Scene) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicateScene: (scene: Scene) => void;
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

export default function EditorView({ scenes, onUpdateScene, onRemoveScene, onAddScene, onReorder, onDuplicateScene }: EditorViewProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(scenes[0]?.id);
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const totalWords = scenes.reduce((sum, s) => sum + s.script.trim().split(/\s+/).filter(Boolean).length, 0);
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;

  const handleMoveUp = (index: number) => {
    if (index > 0) onReorder(index, index - 1);
  };
  const handleMoveDown = (index: number) => {
    if (index < scenes.length - 1) onReorder(index, index + 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Línea de Tiempo</h2>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => onAddScene(createEmptyScene(scenes.length))}>
          <Plus className="w-4 h-4" /> Agregar Escena
        </Button>
      </div>

      {/* Stats Strip */}
      {scenes.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground glass-panel rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-1.5">
            <Clapperboard className="w-3.5 h-3.5" /> {scenes.length} escenas
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
          </span>
          <span className="flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> {totalWords} palabras
          </span>
          <div className="flex-1" />
          <span className="flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" /> {completedImages}/{scenes.length}
          </span>
          <span className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" /> {completedAudios}/{scenes.length}
          </span>
        </div>
      )}

      {/* Mini Timeline */}
      <MiniTimeline scenes={scenes} activeSceneId={activeSceneId} onSceneClick={setActiveSceneId} />

      {/* Scene List */}
      {scenes.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Clapperboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium">No hay escenas aún</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Usa el Generador Mágico en el Dashboard o agrega escenas manualmente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {scenes.map((scene, i) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={i}
                total={scenes.length}
                isActive={scene.id === activeSceneId}
                onUpdate={onUpdateScene}
                onRemove={onRemoveScene}
                onDuplicate={onDuplicateScene}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onSelect={setActiveSceneId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
