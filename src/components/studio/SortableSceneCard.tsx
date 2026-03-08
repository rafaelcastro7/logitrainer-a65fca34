import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SceneCard from './SceneCard';
import { Scene } from '@/types/project';
import { cn } from '@/lib/utils';

interface SortableSceneCardProps {
  scene: Scene;
  index: number;
  total: number;
  isActive: boolean;
  isDragging: boolean;
  onUpdate: (id: string, updates: Partial<Scene>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (scene: Scene) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRegenerateImage?: (id: string) => void;
  onRegenerateAudio?: (id: string) => void;
  onSelect: (id: string) => void;
  onSplit?: (sceneId: string, splitTime: number) => void;
  projectLanguage?: string;
}

export default function SortableSceneCard({ scene, isDragging, ...props }: SortableSceneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isSorting,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-40',
        isSorting && 'transition-transform'
      )}
    >
      <SceneCard
        scene={scene}
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
