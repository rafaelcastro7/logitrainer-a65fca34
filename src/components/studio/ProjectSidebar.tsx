import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Scene, TransitionType, AnimationSettings } from '@/types/project';
import {
  LayoutDashboard, Clapperboard, Play, Images, Activity,
  Server, Info, ChevronLeft, ChevronRight, Film, Layers,
  Image as ImageIcon, Mic, FileText, Settings, FolderTree,
  ChevronDown, ChevronUp, Clock, Sparkles, GripVertical, Shuffle,
  RefreshCw, Copy, Trash2, Shield, Download,
  BookOpen, Layout, Megaphone, Presentation, Calendar, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/i18n/LanguageContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  scenes: Scene[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedSceneId?: string | null;
  onSelectScene?: (id: string) => void;
  onReorder?: (scenes: Scene[]) => void;
  onUpdateScene?: (id: string, updates: Partial<Scene>) => void;
  onRegenerateImage?: (sceneId: string) => void;
  onRegenerateAudio?: (sceneId: string) => void;
  onDuplicateScene?: (scene: Scene) => void;
  onRemoveScene?: (sceneId: string) => void;
  isAdmin?: boolean;
}

// Mini progress dot component
function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      "w-1.5 h-1.5 rounded-full shrink-0",
      status === 'completed' ? 'bg-success' :
      status === 'generating' ? 'bg-warning animate-pulse' :
      status === 'error' ? 'bg-destructive' :
      'bg-muted-foreground/30'
    )} />
  );
}

function SortableSceneItem({ scene, index, isSelected, onSelect, onNavigate }: {
  scene: Scene; index: number; isSelected: boolean;
  onSelect?: (id: string) => void; onNavigate: (tab: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const imgProgress = scene.image.status === 'completed' ? 100 : scene.image.status === 'generating' ? 50 : 0;
  const audProgress = scene.audio.status === 'completed' ? 100 : scene.audio.status === 'generating' ? 50 : 0;
  const totalProgress = (imgProgress + audProgress) / 2;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        onClick={() => { onSelect?.(scene.id); onNavigate('editor'); }}
        className={cn(
          "w-full flex flex-col gap-1 px-1.5 py-1.5 rounded-md text-[11px] transition-all group",
          isSelected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="flex items-center gap-1.5 w-full">
          <span
            {...attributes} {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/50 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3 text-muted-foreground/50" />
          </span>
          {/* Thumbnail */}
          {scene.image.url ? (
            <div className="w-8 h-5 rounded-sm overflow-hidden shrink-0 border border-border/30">
              <img src={scene.image.url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <span className="w-8 h-5 rounded-sm bg-muted flex items-center justify-center shrink-0 border border-border/30">
              <ImageIcon className="w-3 h-3 text-muted-foreground/40" />
            </span>
          )}
          <span className="truncate flex-1 text-left">{scene.name}</span>
          <div className="flex items-center gap-1">
            <StatusDot status={scene.image.status} />
            <StatusDot status={scene.audio.status} />
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="w-full h-[3px] rounded-full bg-muted/50 overflow-hidden ml-[38px] mr-1" style={{ width: 'calc(100% - 42px)' }}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              totalProgress === 100 ? "bg-success" :
              totalProgress > 0 ? "bg-primary" : "bg-transparent"
            )}
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </button>
    </div>
  );
}

const ANIMATION_TYPES: AnimationSettings['type'][] = ['static', 'zoom_in', 'zoom_out', 'pan_left', 'pan_right'];
const TRANSITION_TYPES: TransitionType[] = ['fade', 'wipe_left', 'wipe_right', 'dissolve', 'slide_up', 'none'];

export default function ProjectSidebar({
  activeTab, onTabChange, scenes, collapsed,
  onToggleCollapse, selectedSceneId, onSelectScene, onReorder, onUpdateScene,
  onRegenerateImage, onRegenerateAudio, onDuplicateScene, onRemoveScene, isAdmin,
}: ProjectSidebarProps) {
  const { t } = useTranslation();
  const [treeOpen, setTreeOpen] = useState(true);
  const [propsOpen, setPropsOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startRename = () => {
    if (!selectedScene) return;
    setNameValue(selectedScene.name);
    setEditingName(true);
  };

  const commitRename = () => {
    if (selectedScene && nameValue.trim()) {
      onUpdateScene?.(selectedScene.id, { name: nameValue.trim() });
    }
    setEditingName(false);
  };

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const videoTabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'editor', label: t.editor, icon: Clapperboard },
    { id: 'preview', label: t.preview, icon: Play },
    { id: 'assets', label: t.assets, icon: Images },
    { id: 'export', label: 'Export', icon: Download },
  ];

  const marketingTabs = [
    { id: 'ebooks', label: 'Ebooks', icon: BookOpen },
    { id: 'landing', label: 'Landings', icon: Layout },
    { id: 'ads', label: 'Anuncios', icon: Megaphone },
    { id: 'presentations', label: 'Slides', icon: Presentation },
    { id: 'content-calendar', label: 'Calendar', icon: Calendar },
    { id: 'email-sequences', label: 'Emails', icon: Mail },
  ];

  const systemTabs = [
    { id: 'agents', label: 'AI Crew', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'apis', label: t.apis, icon: Server },
    { id: 'about', label: t.about, icon: Info },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
  ];

  const allTabSections = [
    { label: 'Video Studio', tabs: videoTabs },
    { label: 'Marketing Tools', tabs: marketingTabs },
    { label: 'System', tabs: systemTabs },
  ];

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border/30 bg-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-12" : "w-64"
      )}
    >
      {/* Collapse toggle */}
      <div className={cn("shrink-0 h-12 flex items-center border-b border-border/20", collapsed ? "justify-center" : "justify-between px-3")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FolderTree className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-sidebar-foreground tracking-wide uppercase">Navigator</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      <ScrollArea className="flex-1">
        {/* Navigation */}
        <div className={cn("py-1", collapsed ? "px-1" : "px-2")}>
          {allTabSections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">{section.label}</p>
              )}
              {section.tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Tooltip key={tab.id} delayDuration={collapsed ? 0 : 700}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-md text-xs font-medium transition-all duration-150",
                          collapsed ? "justify-center p-2 my-0.5" : "px-2.5 py-1.5 my-px",
                          isActive
                            ? "bg-primary/15 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {!collapsed && <span>{tab.label}</span>}
                      </button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="text-xs">{tab.label}</TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Project Tree */}
        {!collapsed && scenes.length > 0 && (
          <Collapsible open={treeOpen} onOpenChange={setTreeOpen} className="px-2 mt-2">
            <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                Scenes ({scenes.length})
              </span>
              {treeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-px mt-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    const oldIndex = scenes.findIndex(s => s.id === active.id);
                    const newIndex = scenes.findIndex(s => s.id === over.id);
                    onReorder?.(arrayMove(scenes, oldIndex, newIndex));
                  }
                }}
              >
                <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {scenes.map((scene, i) => (
                    <SortableSceneItem
                      key={scene.id}
                      scene={scene}
                      index={i}
                      isSelected={scene.id === selectedSceneId}
                      onSelect={onSelectScene}
                      onNavigate={onTabChange}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Global progress summary */}
              <div className="flex items-center gap-2 px-2 py-2 mt-1 border-t border-border/20">
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <ImageIcon className="w-2.5 h-2.5" />
                  <span>{completedImages}/{scenes.length}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Mic className="w-2.5 h-2.5" />
                  <span>{completedAudios}/{scenes.length}</span>
                </div>
                <div className="flex-1 h-[3px] rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${scenes.length > 0 ? ((completedImages + completedAudios) / (scenes.length * 2)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Editable Properties Panel */}
        {!collapsed && selectedScene && (
          <Collapsible open={propsOpen} onOpenChange={setPropsOpen} className="px-2 mt-3">
            <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors">
              <span className="flex items-center gap-1.5">
                <Settings className="w-3 h-3" />
                Properties
              </span>
              {propsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-2 px-1">
              <div className="glass-panel rounded-lg p-3 space-y-3">
                {/* Scene name - double click to rename */}
                <div className="flex items-center gap-2" onDoubleClick={startRename}>
                  <Film className="w-3.5 h-3.5 text-primary shrink-0" />
                  {editingName ? (
                    <input
                      ref={nameInputRef}
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      className="text-xs font-semibold bg-muted/50 border border-border/50 rounded px-1.5 py-0.5 w-full outline-none focus:border-primary/50"
                    />
                  ) : (
                    <span className="text-xs font-semibold truncate cursor-text" title="Double-click to rename">
                      {selectedScene.name}
                    </span>
                  )}
                </div>

                {/* Status indicators */}
                <div className="flex gap-2">
                  <div className={cn("flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-medium border",
                    selectedScene.image.status === 'completed' ? 'border-success/30 bg-success/10 text-success' :
                    selectedScene.image.status === 'generating' ? 'border-warning/30 bg-warning/10 text-warning' :
                    selectedScene.image.status === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' :
                    'border-border/30 bg-muted/30 text-muted-foreground'
                  )}>
                    <ImageIcon className="w-3 h-3 mx-auto mb-0.5" />
                    {selectedScene.image.status}
                  </div>
                  <div className={cn("flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-medium border",
                    selectedScene.audio.status === 'completed' ? 'border-success/30 bg-success/10 text-success' :
                    selectedScene.audio.status === 'generating' ? 'border-warning/30 bg-warning/10 text-warning' :
                    selectedScene.audio.status === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' :
                    'border-border/30 bg-muted/30 text-muted-foreground'
                  )}>
                    <Mic className="w-3 h-3 mx-auto mb-0.5" />
                    {selectedScene.audio.status}
                  </div>
                </div>

                {/* Duration slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Duration</span>
                    <span className="font-mono text-foreground font-medium">{selectedScene.duration}s</span>
                  </div>
                  <Slider
                    value={[selectedScene.duration]}
                    onValueChange={([val]) => onUpdateScene?.(selectedScene.id, { duration: val })}
                    min={2}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Animation type */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Animation</span>
                  <Select
                    value={selectedScene.animation.type}
                    onValueChange={(val) => onUpdateScene?.(selectedScene.id, {
                      animation: { ...selectedScene.animation, type: val as AnimationSettings['type'] }
                    })}
                  >
                    <SelectTrigger className="h-7 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMATION_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="text-xs">{type.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Animation intensity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Intensity</span>
                    <span className="font-mono text-foreground">{Math.round(selectedScene.animation.intensity * 100)}%</span>
                  </div>
                  <Slider
                    value={[selectedScene.animation.intensity * 100]}
                    onValueChange={([val]) => onUpdateScene?.(selectedScene.id, {
                      animation: { ...selectedScene.animation, intensity: val / 100 }
                    })}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Transition type */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Shuffle className="w-2.5 h-2.5" /> Transition</span>
                  <Select
                    value={selectedScene.transition}
                    onValueChange={(val) => onUpdateScene?.(selectedScene.id, { transition: val as TransitionType })}
                  >
                    <SelectTrigger className="h-7 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSITION_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="text-xs">{type.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Word count */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/30">
                  <span className="text-muted-foreground flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> Words</span>
                  <span className="font-mono text-foreground">{selectedScene.script.split(/\s+/).filter(Boolean).length}</span>
                </div>

                {selectedScene.script && (
                  <div className="pt-1.5 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">{selectedScene.script}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-2 border-t border-border/30 space-y-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Quick Actions</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => onRegenerateImage?.(selectedScene.id)}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => onRegenerateAudio?.(selectedScene.id)}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Audio
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => onDuplicateScene?.(selectedScene)}
                    >
                      <Copy className="w-2.5 h-2.5" />
                      Duplicate
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-[10px] gap-1"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete scene?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{selectedScene.name}" and all its generated assets. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRemoveScene?.(selectedScene.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Summary when collapsed */}
        {collapsed && scenes.length > 0 && (
          <div className="flex flex-col items-center gap-1 py-2 border-t border-border/20 mx-1 mt-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <div className="text-[9px] font-mono font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center">
                  {scenes.length}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{scenes.length} scenes</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <div className="flex items-center justify-center w-6 h-6">
                  <ImageIcon className={cn("w-3 h-3", completedImages === scenes.length && scenes.length > 0 ? "text-success" : "text-muted-foreground")} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{completedImages}/{scenes.length} images</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <div className="flex items-center justify-center w-6 h-6">
                  <Mic className={cn("w-3 h-3", completedAudios === scenes.length && scenes.length > 0 ? "text-success" : "text-muted-foreground")} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{completedAudios}/{scenes.length} audios</TooltipContent>
            </Tooltip>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
