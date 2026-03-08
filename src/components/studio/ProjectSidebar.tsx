import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
import {
  LayoutDashboard, Clapperboard, Play, Images, Activity,
  Server, Info, ChevronLeft, ChevronRight, Film, Layers,
  Image as ImageIcon, Mic, FileText, Settings, FolderTree,
  ChevronDown, ChevronUp, Clock, Sparkles
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/i18n/LanguageContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  scenes: Scene[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedSceneId?: string | null;
  onSelectScene?: (id: string) => void;
}

export default function ProjectSidebar({
  activeTab, onTabChange, scenes, collapsed,
  onToggleCollapse, selectedSceneId, onSelectScene,
}: ProjectSidebarProps) {
  const { t } = useTranslation();
  const [treeOpen, setTreeOpen] = useState(true);
  const [propsOpen, setPropsOpen] = useState(true);

  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'editor', label: t.editor, icon: Clapperboard },
    { id: 'preview', label: t.preview, icon: Play },
    { id: 'assets', label: t.assets, icon: Images },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'apis', label: t.apis, icon: Server },
    { id: 'about', label: t.about, icon: Info },
  ];

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border/30 bg-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-12" : "w-60"
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
          {!collapsed && (
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">Navigation</p>
          )}
          {tabs.map(tab => {
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
              {scenes.map((scene, i) => {
                const isSelected = scene.id === selectedSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => {
                      onSelectScene?.(scene.id);
                      onTabChange('editor');
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all group",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[9px] font-mono font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate flex-1 text-left">{scene.name}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {scene.image.status === 'completed' && <ImageIcon className="w-2.5 h-2.5 text-success" />}
                      {scene.audio.status === 'completed' && <Mic className="w-2.5 h-2.5 text-success" />}
                    </div>
                  </button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Contextual Properties Panel */}
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
              <div className="glass-panel rounded-lg p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold truncate">{selectedScene.name}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Duration</span>
                    <span className="font-mono text-foreground">{selectedScene.duration}s</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5" /> Image</span>
                    <span className={cn("font-medium capitalize",
                      selectedScene.image.status === 'completed' ? 'text-success' :
                      selectedScene.image.status === 'error' ? 'text-destructive' :
                      selectedScene.image.status === 'generating' ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {selectedScene.image.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><Mic className="w-2.5 h-2.5" /> Audio</span>
                    <span className={cn("font-medium capitalize",
                      selectedScene.audio.status === 'completed' ? 'text-success' :
                      selectedScene.audio.status === 'error' ? 'text-destructive' :
                      selectedScene.audio.status === 'generating' ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {selectedScene.audio.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Animation</span>
                    <span className="font-mono text-foreground">{selectedScene.animation.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> Words</span>
                    <span className="font-mono text-foreground">{selectedScene.script.split(/\s+/).filter(Boolean).length}</span>
                  </div>
                </div>

                {selectedScene.script && (
                  <div className="pt-1.5 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">{selectedScene.script}</p>
                  </div>
                )}
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
