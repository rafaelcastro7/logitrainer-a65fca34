import { useState } from 'react';
import { Film, LayoutDashboard, Clapperboard, Play, Images, Server, Clock, CheckCircle2, AlertCircle, Globe, Info, Save, FolderOpen, User, LogOut, Undo2, Redo2, FilePlus2, Keyboard } from 'lucide-react';
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
}

export default function StudioLayout({ activeTab, onTabChange, children, scenes, hasProject, user, onSave, onOpenProjects, onOpenAuth, onSignOut, onNewProject, onUndo, onRedo, canUndo, canRedo }: StudioLayoutProps) {
  const { t, locale, setLocale } = useTranslation();

  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'editor', label: t.editor, icon: Clapperboard },
    { id: 'preview', label: t.preview, icon: Play },
    { id: 'assets', label: t.assets, icon: Images },
    { id: 'apis', label: t.apis, icon: Server },
    { id: 'about', label: t.about, icon: Info },
  ];

  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalAssets = totalScenes * 2;
  const completedAssets = completedImages + completedAudios;
  const progressVal = totalAssets > 0 ? (completedAssets / totalAssets) * 100 : 0;
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const hasErrors = scenes.some(s => s.image.status === 'error' || s.audio.status === 'error');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="shrink-0 border-b border-border/50 glass-panel">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gradient-primary">LogiTrainer</span>
              <span className="text-muted-foreground font-medium ml-1">{t.studio}</span>
            </h1>
          </div>

          <nav className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const badge = tab.id === 'editor' ? (totalScenes || null) :
                           tab.id === 'assets' ? (completedImages || null) : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md glow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
                      activeTab === tab.id ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            {/* Undo/Redo */}
            {hasProject && (
              <div className="flex items-center gap-0.5 mr-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onUndo} disabled={!canUndo}>
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Undo (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRedo} disabled={!canRedo}>
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* New Project */}
            {hasProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onNewProject}>
                    <FilePlus2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.newProject || 'New Project'} (⌘⇧N)</TooltipContent>
              </Tooltip>
            )}

            {/* Save */}
            {user && hasProject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={onSave}>
                    <Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.save}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.save} (⌘S)</TooltipContent>
              </Tooltip>
            )}

            {/* Projects */}
            {user && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={onOpenProjects}>
                <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.myProjects}</span>
              </Button>
            )}

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(LOCALE_LABELS) as Locale[]).map(l => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l)}
                    className={cn("text-sm", l === locale && "font-bold")}
                  >
                    {LOCALE_LABELS[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-primary/20">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> {t.authLogout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={onOpenAuth}>
                <User className="w-3.5 h-3.5" /> {t.authLogin}
              </Button>
            )}

            {hasProject && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
                </span>
                {hasErrors ? (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                ) : progressVal === 100 ? (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : totalScenes > 0 ? (
                  <span>{Math.round(progressVal)}%</span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {hasProject && totalScenes > 0 && progressVal < 100 && (
          <div className="px-6 pb-1">
            <Progress value={progressVal} className="h-1" />
          </div>
        )}
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
