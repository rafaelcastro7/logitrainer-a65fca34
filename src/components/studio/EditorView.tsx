import { useState } from 'react';
import { Plus, Clapperboard, Clock, Wand2, Image, Mic, Zap } from 'lucide-react';
import { Scene } from '@/types/project';
import { Button } from '@/components/ui/button';
import SceneCard from './SceneCard';
import MiniTimeline from './MiniTimeline';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/LanguageContext';

interface EditorViewProps {
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onRemoveScene: (id: string) => void;
  onAddScene: (scene: Scene) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicateScene: (scene: Scene) => void;
  onRegenerateImage?: (id: string) => void;
  onRegenerateAudio?: (id: string) => void;
  onGenerateAllImages?: () => void;
  onGenerateAllAudios?: () => void;
}

export default function EditorView({
  scenes, onUpdateScene, onRemoveScene, onAddScene, onReorder,
  onDuplicateScene, onRegenerateImage, onRegenerateAudio, onGenerateAllImages, onGenerateAllAudios,
}: EditorViewProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(scenes[0]?.id);
  const { t } = useTranslation();
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const totalWords = scenes.reduce((sum, s) => sum + s.script.trim().split(/\s+/).filter(Boolean).length, 0);
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const pendingImages = scenes.filter(s => s.image.status !== 'completed').length;
  const pendingAudios = scenes.filter(s => s.audio.status !== 'completed' && s.script.trim()).length;
  const generatingAny = scenes.some(s => s.image.status === 'generating' || s.audio.status === 'generating');

  const handleMoveUp = (index: number) => { if (index > 0) onReorder(index, index - 1); };
  const handleMoveDown = (index: number) => { if (index < scenes.length - 1) onReorder(index, index + 1); };

  function createEmptyScene(index: number): Scene {
    return {
      id: crypto.randomUUID(),
      name: t.newScene(index + 1),
      script: '',
      image_prompt: '',
      duration: 8,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { type: 'zoom_in', intensity: 0.3 },
      notes: '',
    };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t.timeline}</h2>
        </div>
        <div className="flex items-center gap-2">
          {pendingAudios > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={onGenerateAllAudios}
              disabled={generatingAny}
            >
              <Mic className="w-3.5 h-3.5" />
              {generatingAny ? t.generating : (t.generateNAudios?.(pendingAudios) || `Generate ${pendingAudios} Audios`)}
            </Button>
          )}
          {pendingImages > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={onGenerateAllImages}
              disabled={generatingAny}
            >
              <Zap className="w-3.5 h-3.5" />
              {generatingAny ? t.generating : t.generateNImages(pendingImages)}
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => onAddScene(createEmptyScene(scenes.length))}>
            <Plus className="w-4 h-4" /> {t.add}
          </Button>
        </div>
      </div>

      {scenes.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground glass-panel rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-1.5">
            <Clapperboard className="w-3.5 h-3.5" /> {scenes.length} {t.scenes}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
          </span>
          <span className="flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> {totalWords} {t.words}
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

      <MiniTimeline scenes={scenes} activeSceneId={activeSceneId} onSceneClick={setActiveSceneId} />

      {scenes.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Clapperboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium">{t.noScenesYet}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">{t.noScenesHint}</p>
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
                onRegenerateImage={onRegenerateImage}
                onRegenerateAudio={onRegenerateAudio}
                onSelect={setActiveSceneId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
