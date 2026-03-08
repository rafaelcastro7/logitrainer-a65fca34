import { useState } from 'react';
import { Film, Globe, Save, FolderOpen, User, LogOut, Undo2, Redo2, FilePlus2, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
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
}

export default function StudioLayout({ activeTab, onTabChange, children, scenes, hasProject, user, onSave, onOpenProjects, onOpenAuth, onSignOut, onNewProject, onUndo, onRedo, canUndo, canRedo }: StudioLayoutProps) {
  const { t, locale, setLocale } = useTranslation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'editor', label: t.editor, icon: Clapperboard },
    { id: 'preview', label: t.preview, icon: Play },
    { id: 'assets', label: t.assets, icon: Images },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'apis', label: t.apis, icon: Server },
    { id: 'about', label: t.about, icon: Info },
  ];

  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalAssets = totalScenes * 2;
  const completedAssets = completedImages + completedAudios;
  const progressVal = totalAssets > 0 ? (completedAssets / totalAssets) * 100 : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border/30 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-12">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10">
              <Film className="w-3.5 h-3.5 text-primary" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">
              <span className="text-gradient-primary">LogiTrainer</span>
              <span className="text-muted-foreground font-medium ml-1 text-xs">{t.studio}</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const badge = tab.id === 'editor' ? (totalScenes || null) :
                           tab.id === 'assets' ? (completedImages || null) : null;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 relative",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">{tab.label}</span>
                      {badge !== null && badge > 0 && (
                        <span className={cn(
                          "text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full",
                          activeTab === tab.id ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"
                        )}>
                          {badge}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs lg:hidden">{tab.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            {hasProject && (
              <div className="flex items-center gap-0.5 mr-1 border-r border-border/30 pr-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onUndo} disabled={!canUndo}>
                      <Undo2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Undo (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRedo} disabled={!canRedo}>
                      <Redo2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
              </div>
            )}

            {hasProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onNewProject}>
                    <FilePlus2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.newProject || 'New Project'}</TooltipContent>
              </Tooltip>
            )}

            {user && hasProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2" onClick={onSave}>
                    <Save className="w-3 h-3" /> <span className="hidden sm:inline">{t.save}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.save} (⌘S)</TooltipContent>
              </Tooltip>
            )}

            {user && (
              <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2" onClick={onOpenProjects}>
                <FolderOpen className="w-3 h-3" /> <span className="hidden sm:inline">{t.myProjects}</span>
              </Button>
            )}

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2">
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(LOCALE_LABELS) as Locale[]).map(l => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l)}
                    className={cn("text-xs", l === locale && "font-bold")}
                  >
                    {LOCALE_LABELS[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Shortcuts */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShortcutsOpen(true)}>
                  <Command className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Shortcuts</TooltipContent>
            </Tooltip>

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full bg-primary/10">
                    <User className="w-3 h-3 text-primary" />
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
              <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7 px-3" onClick={onOpenAuth}>
                <User className="w-3 h-3" /> {t.authLogin}
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {hasProject && totalScenes > 0 && progressVal < 100 && (
          <Progress value={progressVal} className="h-0.5 rounded-none" />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Status Bar */}
      <StatusBar scenes={scenes} user={user} hasProject={hasProject} />

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
