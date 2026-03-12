import { useState, useMemo, useCallback } from 'react';
import { Plus, Clapperboard, Clock, Wand2, Image, Mic, Zap, Download, Upload } from 'lucide-react';
import { Scene, Project, TransitionType, AnimationSettings } from '@/types/project';
import { Button } from '@/components/ui/button';
import SceneCard from './SceneCard';
import InteractiveTimeline from './InteractiveTimeline';
import MultiTrackTimeline from './MultiTrackTimeline';
import SceneSuggestionPanel from './SceneSuggestionPanel';
import SceneTemplates from './SceneTemplates';
import BatchOperations from './BatchOperations';
import { useTranslation } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableSceneCard from './SortableSceneCard';

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
  projectLanguage?: string;
  project?: Project;
  onLoadProject?: (project: Project) => void;
}

export default function EditorView({
  scenes, onUpdateScene, onRemoveScene, onAddScene, onReorder,
  onDuplicateScene, onRegenerateImage, onRegenerateAudio, onGenerateAllImages, onGenerateAllAudios,
  projectLanguage, project, onLoadProject,
}: EditorViewProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(scenes[0]?.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const totalWords = scenes.reduce((sum, s) => sum + s.script.trim().split(/\s+/).filter(Boolean).length, 0);
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const pendingImages = scenes.filter(s => s.image.status !== 'completed').length;
  const pendingAudios = scenes.filter(s => s.audio.status !== 'completed' && s.script.trim()).length;
  const generatingAny = scenes.some(s => s.image.status === 'generating' || s.audio.status === 'generating');

  const sceneIds = useMemo(() => scenes.map(s => s.id), [scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Batch operations
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === scenes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scenes.map(s => s.id)));
    }
  }, [scenes, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const batchDelete = useCallback((ids: string[]) => {
    ids.forEach(id => onRemoveScene(id));
    setSelectedIds(new Set());
  }, [onRemoveScene]);

  const batchUpdateTransition = useCallback((ids: string[], transition: TransitionType) => {
    ids.forEach(id => onUpdateScene(id, { transition }));
    toast.success(`✅ Transition updated for ${ids.length} scenes`);
  }, [onUpdateScene]);

  const batchUpdateAnimation = useCallback((ids: string[], animation: Partial<AnimationSettings>) => {
    ids.forEach(id => {
      const scene = scenes.find(s => s.id === id);
      if (scene) onUpdateScene(id, { animation: { ...scene.animation, ...animation } });
    });
    toast.success(`✅ Animation updated for ${ids.length} scenes`);
  }, [scenes, onUpdateScene]);

  const batchGenerateImages = useCallback((ids: string[]) => {
    ids.forEach(id => onRegenerateImage?.(id));
  }, [onRegenerateImage]);

  const batchGenerateAudios = useCallback((ids: string[]) => {
    ids.forEach(id => onRegenerateAudio?.(id));
  }, [onRegenerateAudio]);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) onReorder(oldIndex, newIndex);
  };

  const handleMoveUp = (index: number) => { if (index > 0) onReorder(index, index - 1); };
  const handleMoveDown = (index: number) => { if (index < scenes.length - 1) onReorder(index, index + 1); };

  const handleSplitScene = useCallback((sceneId: string, splitTime: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    const words = scene.script.split(' ');
    const splitRatio = splitTime / scene.duration;
    const splitWordIndex = Math.floor(words.length * splitRatio);
    onUpdateScene(sceneId, {
      duration: Math.round(splitTime),
      script: words.slice(0, splitWordIndex).join(' '),
    });
    const newScene: Scene = {
      id: crypto.randomUUID(),
      name: `${scene.name} (B)`,
      script: words.slice(splitWordIndex).join(' '),
      image_prompt: scene.image_prompt,
      duration: Math.round(scene.duration - splitTime),
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      animation: { ...scene.animation },
      notes: '',
      transition: scene.transition || 'fade',
      voiceName: scene.voiceName,
    };
    onAddScene(newScene);
    toast.success('✂️ Scene split');
  }, [scenes, onUpdateScene, onAddScene]);

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
      transition: 'fade',
    };
  }

  const handleExportProject = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.meta.name.replace(/\s+/g, '_')}.logitrainer.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📦 Project exported');
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text) as Project;
        if (!imported.meta || !imported.scenes) throw new Error('Invalid project file');
        onLoadProject?.(imported);
        toast.success('📂 Project imported');
      } catch {
        toast.error('Invalid project file');
      }
    };
    input.click();
  };

  const draggingScene = draggingId ? scenes.find(s => s.id === draggingId) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t.timeline}</h2>
        </div>
        <div className="flex items-center gap-2">
          {project && (
            <>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7" onClick={handleExportProject}>
                <Download className="w-3 h-3" /> Export
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7" onClick={handleImportProject}>
                <Upload className="w-3 h-3" /> Import
              </Button>
            </>
          )}
          {pendingAudios > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onGenerateAllAudios} disabled={generatingAny}>
              <Mic className="w-3.5 h-3.5" />
              {generatingAny ? t.generating : t.generateNAudios(pendingAudios)}
            </Button>
          )}
          {pendingImages > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onGenerateAllImages} disabled={generatingAny}>
              <Zap className="w-3.5 h-3.5" />
              {generatingAny ? t.generating : t.generateNImages(pendingImages)}
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => onAddScene(createEmptyScene(scenes.length))}>
            <Plus className="w-4 h-4" /> {t.add}
          </Button>
        </div>
      </div>

      {/* Scene Templates - Quick Add */}
      <SceneTemplates onAddScene={onAddScene} currentCount={scenes.length} />

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

      {/* Batch Operations Bar */}
      <BatchOperations
        scenes={scenes}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBatchDelete={batchDelete}
        onBatchUpdateTransition={batchUpdateTransition}
        onBatchUpdateAnimation={batchUpdateAnimation}
        onBatchGenerateImages={batchGenerateImages}
        onBatchGenerateAudios={batchGenerateAudios}
      />

      {/* Multi-Track Pro Timeline */}
      <MultiTrackTimeline
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSceneClick={(id) => setActiveSceneId(id)}
        onSplitScene={handleSplitScene}
        hasBgMusic={false}
      />

      {/* AI Smart Suggestions */}
      <SceneSuggestionPanel
        scenes={scenes}
        onApplySuggestion={(id, updates) => onUpdateScene(id, updates)}
      />

      {scenes.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Clapperboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium">{t.noScenesYet}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">{t.noScenesHint}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {scenes.map((scene, i) => (
                <div key={scene.id} className="flex items-start gap-1">
                  {/* Selection checkbox */}
                  <button
                    onClick={() => toggleSelect(scene.id)}
                    className="mt-4 p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
                  >
                    {selectedIds.has(scene.id) ? (
                      <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-border/60" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <SortableSceneCard
                      scene={scene}
                      index={i}
                      total={scenes.length}
                      isActive={scene.id === activeSceneId}
                      isDragging={scene.id === draggingId}
                      onUpdate={onUpdateScene}
                      onRemove={onRemoveScene}
                      onDuplicate={onDuplicateScene}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onRegenerateImage={onRegenerateImage}
                      onRegenerateAudio={onRegenerateAudio}
                      onSelect={setActiveSceneId}
                      onSplit={handleSplitScene}
                      projectLanguage={projectLanguage}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {draggingScene && (
              <div className="glass-panel rounded-xl overflow-hidden opacity-90 shadow-2xl ring-2 ring-primary/50 rotate-1">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-12 h-8 rounded bg-muted/30 shrink-0 overflow-hidden">
                    {draggingScene.image.url ? (
                      <img src={draggingScene.image.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] font-mono text-muted-foreground/40">
                          {scenes.findIndex(s => s.id === draggingScene.id) + 1}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-sm truncate">{draggingScene.name}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}