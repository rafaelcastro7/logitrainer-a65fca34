import { Film, LayoutDashboard, Clapperboard, Play, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'editor', label: 'Editor', icon: Clapperboard },
  { id: 'preview', label: 'Preview', icon: Play },
  { id: 'assets', label: 'Assets', icon: Images },
];

export default function StudioLayout({ activeTab, onTabChange, children }: StudioLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border/50 glass-panel shrink-0">
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
        <nav className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="w-32" /> {/* Spacer */}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
