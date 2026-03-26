import { useState } from 'react';
import { Film, Globe, Save, FolderOpen, User, LogOut, Undo2, Redo2, FilePlus2, Command, Shield, Search, Sparkles,
  LayoutDashboard, Clapperboard, Play, Images, Download, BookOpen, Layout, Megaphone, Presentation, Calendar, Mail, Activity, Server, Info, Menu, X, MoreHorizontal, Gift, MessageCircle, Target, Video, Gem, MonitorPlay, Magnet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from '@/i18n/LanguageContext';
import { Locale, LOCALE_LABELS } from '@/i18n/translations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { User as SupaUser } from '@supabase/supabase-js';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import StatusBar from './StatusBar';
import ProjectSidebar from './ProjectSidebar';
import CommandPalette from './CommandPalette';
import { useIsMobile } from '@/hooks/use-mobile';

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

// Bottom nav tabs for mobile - most used ones
const MOBILE_MAIN_TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'editor', icon: Clapperboard, label: 'Editor' },
  { id: 'ebooks', icon: BookOpen, label: 'Ebooks' },
  { id: 'ads', icon: Megaphone, label: 'Ads' },
];

const ALL_TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'Video' },
  { id: 'editor', icon: Clapperboard, label: 'Editor', group: 'Video' },
  { id: 'preview', icon: Play, label: 'Preview', group: 'Video' },
  { id: 'assets', icon: Images, label: 'Assets', group: 'Video' },
  { id: 'export', icon: Download, label: 'Export', group: 'Video' },
  { id: 'ebooks', icon: BookOpen, label: 'Ebooks', group: 'Marketing' },
  { id: 'landing', icon: Layout, label: 'Landings', group: 'Marketing' },
  { id: 'ads', icon: Megaphone, label: 'Anuncios', group: 'Marketing' },
  { id: 'vsl-scripts', icon: Video, label: 'VSL Scripts', group: 'Marketing' },
  { id: 'funnels', icon: Target, label: 'Funnels', group: 'Marketing' },
  { id: 'offers', icon: Gem, label: 'Ofertas', group: 'Marketing' },
  { id: 'presentations', icon: Presentation, label: 'Slides', group: 'Marketing' },
  { id: 'content-calendar', icon: Calendar, label: 'Calendar', group: 'Marketing' },
  { id: 'email-sequences', icon: Mail, label: 'Emails', group: 'Marketing' },
  { id: 'lead-magnets', icon: Sparkles, label: 'Lead Magnets', group: 'Marketing' },
  { id: 'webinar', icon: Target, label: 'Webinar', group: 'Marketing' },
  { id: 'ai-chat', icon: MessageCircle, label: 'AI Chat', group: 'System' },
  { id: 'analytics', icon: Activity, label: 'Analytics', group: 'System' },
  { id: 'referrals', icon: Gift, label: 'Referidos', group: 'Growth' },
  { id: 'apis', icon: Server, label: 'APIs', group: 'System' },
  { id: 'about', icon: Info, label: 'About', group: 'System' },
];

export default function StudioLayout({ activeTab, onTabChange, children, scenes, hasProject, user, onSave, onOpenProjects, onOpenAuth, onSignOut, onNewProject, onUndo, onRedo, canUndo, canRedo, selectedSceneId, onSelectScene, onReorderScenes, onUpdateScene, onRegenerateImage, onRegenerateAudio, onDuplicateScene, onRemoveScene, isAdmin, onGenerateAllImages, onGenerateAllAudios, lastSaved, isSaving }: StudioLayoutProps) {
  const { t, locale, setLocale } = useTranslation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalAssets = totalScenes * 2;
  const completedAssets = completedImages + completedAudios;
  const progressVal = totalAssets > 0 ? (completedAssets / totalAssets) * 100 : 0;

  const TAB_LABELS: Record<string, string> = {
    dashboard: 'Dashboard', editor: 'Editor', preview: 'Preview',
    assets: 'Assets', analytics: 'Analytics', apis: 'APIs',
    about: 'About', admin: 'Admin', export: 'Export',
    ebooks: 'Ebooks', landing: 'Landings', ads: 'Anuncios',
    presentations: 'Slides', 'content-calendar': 'Calendar', 'email-sequences': 'Emails',
    referrals: 'Referidos', 'vsl-scripts': 'VSL Scripts', funnels: 'Funnels', offers: 'Ofertas',
    'lead-magnets': 'Lead Magnets', 'ai-chat': 'AI Chat',
  };

  const handleMobileTabChange = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border/20 bg-card/40 backdrop-blur-2xl relative z-30">
        <div className="flex items-center justify-between px-3 sm:px-5 h-11 sm:h-12">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 border border-primary/10 shadow-sm">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-gradient-primary">LogiTrainer</h1>
              <span className="text-[10px] text-muted-foreground/60 font-medium hidden sm:inline">Studio</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground/40">
              <span className="text-[10px]">/</span>
              <span className="text-[11px] font-medium text-foreground/70">{TAB_LABELS[activeTab] || activeTab}</span>
            </div>
          </div>

          {/* Center - Command Palette Trigger (desktop only) */}
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
            {/* Desktop-only undo/redo */}
            {!isMobile && hasProject && (
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

            {!isMobile && hasProject && (
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
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground" onClick={onSave}>
                    <Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.save}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t.save} (⌘S)</TooltipContent>
              </Tooltip>
            )}

            {!isMobile && user && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-7 px-2.5 text-muted-foreground hover:text-foreground" onClick={onOpenProjects}>
                <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.myProjects}</span>
              </Button>
            )}

            {/* Language - hidden on mobile */}
            {!isMobile && (
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
            )}

            <ThemeToggle />

            {/* Shortcuts (desktop) */}
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShortcutsOpen(true)}>
                    <Command className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Shortcuts</TooltipContent>
              </Tooltip>
            )}

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
                  {isMobile && (
                    <>
                      <DropdownMenuItem onClick={onOpenProjects} className="text-xs">
                        <FolderOpen className="w-3 h-3 mr-2" /> {t.myProjects}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onNewProject} className="text-xs">
                        <FilePlus2 className="w-3 h-3 mr-2" /> {t.newProject || 'New'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive text-xs">
                    <LogOut className="w-3 h-3 mr-2" /> {t.authLogout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="gap-1.5 text-[11px] h-7 px-3 glow-primary" onClick={onOpenAuth}>
                <Sparkles className="w-3 h-3" /> <span className="hidden xs:inline">{t.authLogin}</span>
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

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && (
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
        )}
        <main className="flex-1 overflow-auto gradient-mesh pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Desktop Status Bar */}
      {!isMobile && (
        <StatusBar scenes={scenes} user={user} hasProject={hasProject} lastSaved={lastSaved} isSaving={isSaving} />
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="shrink-0 border-t border-border/20 bg-card/95 backdrop-blur-xl z-40 safe-area-bottom">
          <div className="flex items-center justify-around h-14 px-1">
            {MOBILE_MAIN_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[56px]",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
            {/* More menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground active:text-foreground min-w-[56px]">
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Más</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0">
                <div className="p-4 border-b border-border/20">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-foreground">Todos los módulos</h3>
                </div>
                <div className="overflow-auto p-4 space-y-4">
                  {['Video', 'Marketing', 'Growth', 'System'].map(group => {
                    const groupTabs = ALL_TABS.filter(t => t.group === group);
                    if (group === 'System' && !isAdmin) {
                      // filter admin tab
                    }
                    return (
                      <div key={group}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {groupTabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleMobileTabChange(tab.id)}
                                className={cn(
                                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                  isActive
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/30 text-muted-foreground active:bg-muted/50"
                                )}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-[11px] font-medium">{tab.label}</span>
                              </button>
                            );
                          })}
                          {isAdmin && group === 'System' && (
                            <button
                              onClick={() => handleMobileTabChange('admin')}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                activeTab === 'admin'
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/30 text-muted-foreground active:bg-muted/50"
                              )}
                            >
                              <Shield className="w-5 h-5" />
                              <span className="text-[11px] font-medium">Admin</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      )}

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
