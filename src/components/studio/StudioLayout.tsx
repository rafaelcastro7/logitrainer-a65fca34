import { useState } from 'react';
import { Film, Globe, Save, FolderOpen, User, LogOut, Undo2, Redo2, FilePlus2, Command, Shield, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
import ThemeToggle from './ThemeToggle';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import { Locale, LOCALE_LABELS } from '@/i18n/translations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { User as SupaUser } from '@supabase/supabase-js';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import StatusBar from './StatusBar';
import ProjectSidebar from './ProjectSidebar';
import CommandPalette from './CommandPalette';

interface StudioLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  scenes: Scene[];
  hasProject: boolean;
  user: SupaUser | null;
  onSave?: () => void;
  onOpenProjects?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onNewProject?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedSceneId?: string | null;
  onSelectScene?: (id: string) => void;
  onReorderScenes?: (scenes: Scene[]) => void;
  onUpdateScene?: (id: string, updates: Partial<Scene>) => void;
  onRegenerateImage?: (sceneId: string) => void;
  onRegenerateAudio?: (sceneId: string) => void;
  onDuplicateScene?: (scene: Scene) => void;
  onRemoveScene?: (sceneId: string) => void;
  isAdmin?: boolean;
  onGenerateAllImages?: () => void;
  onGenerateAllAudios?: () => void;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export default function StudioLayout({ activeTab, onTabChange, children, scenes, hasProject, user, onSave, onOpenProjects, onOpenAuth, onSignOut, onNewProject, onUndo, onRedo, canUndo, canRedo, selectedSceneId, onSelectScene, onReorderScenes, onUpdateScene, onRegenerateImage, onRegenerateAudio, onDuplicateScene, onRemoveScene, isAdmin, onGenerateAllImages, onGenerateAllAudios, lastSaved, isSaving }: StudioLayoutProps) {
  const { t, locale, setLocale } = useTranslation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalAssets = totalScenes * 2;
  const completedAssets = completedImages + completedAudios;
  const progressVal = totalAssets > 0 ? (completedAssets / totalAssets) * 100 : 0;

  const TAB_LABELS: Record<string, string> = {
    dashboard: 'Dashboard', editor: 'Editor', preview: 'Preview',
    assets: 'Assets', analytics: 'Analytics', apis: 'APIs',
    about: 'About', admin: 'Admin'
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border/20 bg-card/40 backdrop-blur-2xl relative z-30">
        <div className="flex items-center justify-between px-4 sm:px-5 h-12">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 border border-primary/10 shadow-sm">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-gradient-primary">LogiTrainer</h1>
              <span className="text-[10px] text-muted-foreground/60 font-medium hidden sm:inline">Studio</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground/40">
              <span className="text-[10px]">/</span>
              <span className="text-[11px] font-medium text-foreground/70">{TAB_LABELS[activeTab] || activeTab}</span>
            </div>
          </div>

          {/* Center - Command Palette Trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/20 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 hover:border-border/40 transition-all text-xs"
          >
            <Search className="w-3 h-3" />
            <span>Search commands...</span>
            <kbd className="ml-4 px-1.5 py-0.5 rounded bg-muted/50 border border-border/30 text-[10px] font-mono">⌘K</kbd>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            {hasProject && (
              <div className="flex items-center gap-0.5 mr-1 border-r border-border/20 pr-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={onUndo} disabled={!canUndo}>
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Undo (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={onRedo} disabled={!canRedo}>
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
              </div>
            )}

            {hasProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={onNewProject}>
                    <FilePlus2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.newProject || 'New Project'}</TooltipContent>
              </Tooltip>
            )}

            {user && hasProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-7 px-2.5 text-muted-foreground hover:text-foreground" onClick={onSave}>
                    <Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.save}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.save} (⌘S)</TooltipContent>
              </Tooltip>
            )}

            {user && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-7 px-2.5 text-muted-foreground hover:text-foreground" onClick={onOpenProjects}>
                <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.myProjects}</span>
              </Button>
            )}

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(LOCALE_LABELS) as Locale[]).map(l => (
                  <DropdownMenuItem key={l} onClick={() => setLocale(l)} className={cn("text-xs", l === locale && "font-bold")}>
                    {LOCALE_LABELS[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Shortcuts */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShortcutsOpen(true)}>
                  <Command className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Shortcuts</TooltipContent>
            </Tooltip>

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-[11px] text-muted-foreground truncate max-w-[200px]">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive text-xs">
                    <LogOut className="w-3 h-3 mr-2" /> {t.authLogout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="gap-1.5 text-[11px] h-7 px-3 glow-primary" onClick={onOpenAuth}>
                <Sparkles className="w-3 h-3" /> {t.authLogin}
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {hasProject && totalScenes > 0 && progressVal < 100 && (
          <div className="h-[2px] bg-muted/20">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-700"
              style={{ width: `${progressVal}%` }}
            />
          </div>
        )}
      </header>

      {/* Body with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          scenes={scenes}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          selectedSceneId={selectedSceneId}
          onSelectScene={onSelectScene}
          onReorder={onReorderScenes}
          onUpdateScene={onUpdateScene}
          onRegenerateImage={onRegenerateImage}
          onRegenerateAudio={onRegenerateAudio}
          onDuplicateScene={onDuplicateScene}
          onRemoveScene={onRemoveScene}
          isAdmin={isAdmin}
        />
        <main className="flex-1 overflow-auto gradient-mesh">
          {children}
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar scenes={scenes} user={user} hasProject={hasProject} />

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={onTabChange}
        onSave={onSave}
        onNewProject={onNewProject}
        onUndo={onUndo}
        onRedo={onRedo}
        onOpenProjects={onOpenProjects}
        onGenerateAllImages={onGenerateAllImages}
        onGenerateAllAudios={onGenerateAllAudios}
        hasProject={hasProject}
        isAdmin={isAdmin}
      />
    </div>
  );
}
