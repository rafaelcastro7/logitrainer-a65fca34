import { Film, LayoutDashboard, Clapperboard, Play, Images, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
import { Progress } from '@/components/ui/progress';

interface StudioLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  scenes: Scene[];
  hasProject: boolean;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'editor', label: 'Editor', icon: Clapperboard },
  { id: 'preview', label: 'Preview', icon: Play },
  { id: 'assets', label: 'Assets', icon: Images },
];

export default function StudioLayout({ activeTab, onTabChange, children, scenes, hasProject }: StudioLayoutProps) {
  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const totalAssets = totalScenes * 2;
  const completedAssets = completedImages + completedAudios;
  const progress = totalAssets > 0 ? (completedAssets / totalAssets) * 100 : 0;
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const hasErrors = scenes.some(s => s.image.status === 'error' || s.audio.status === 'error');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border/50 glass-panel">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gradient-primary">LogiTrainer</span>
              <span className="text-muted-foreground font-medium ml-1">Studio</span>
            </h1>
          </div>

          {/* Tab Navigation */}
          {hasProject && (
            <nav className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const badge = tab.id === 'editor' ? totalScenes :
                             tab.id === 'assets' ? completedImages : null;
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
          )}

          {/* Project Stats */}
          {hasProject && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
              </span>
              {hasErrors ? (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" /> Errores
                </span>
              ) : progress === 100 ? (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completo
                </span>
              ) : (
                <span>{Math.round(progress)}%</span>
              )}
            </div>
          )}
          {!hasProject && <div />}
        </div>

        {/* Progress Bar */}
        {hasProject && totalScenes > 0 && progress < 100 && (
          <div className="px-6 pb-1">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
