import { Wifi, WifiOff, Clock, Cpu, Zap, Film, HardDrive, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
import type { User as SupaUser } from '@supabase/supabase-js';

interface StatusBarProps {
  scenes: Scene[];
  user: SupaUser | null;
  hasProject: boolean;
}

export default function StatusBar({ scenes, user, hasProject }: StatusBarProps) {
  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const generating = scenes.some(s => s.image.status === 'generating' || s.audio.status === 'generating');
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const totalWords = scenes.reduce((sum, s) => sum + s.script.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <footer className="shrink-0 h-7 border-t border-border/30 bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 text-[11px] text-muted-foreground font-mono select-none">
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        {user ? (
          <>
            <Wifi className="w-3 h-3 text-success" />
            <span className="text-success">Cloud</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Local</span>
          </>
        )}
      </div>

      <div className="w-px h-3.5 bg-border/40" />

      {/* Engine Status */}
      <div className="flex items-center gap-1.5">
        {generating ? (
          <>
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-primary">Processing...</span>
          </>
        ) : (
          <>
            <Cpu className="w-3 h-3" />
            <span>Ready</span>
          </>
        )}
      </div>

      {hasProject && totalScenes > 0 && (
        <>
          <div className="w-px h-3.5 bg-border/40" />

          <div className="flex items-center gap-1.5">
            <Film className="w-3 h-3" />
            <span>{totalScenes} scenes</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>{completedImages + completedAudios}/{totalScenes * 2} assets</span>
          </div>

          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" />
            <span>{totalWords} words</span>
          </div>
        </>
      )}

      <div className="flex-1" />

      <span className="opacity-50">LogiTrainer Studio v2.0</span>
    </footer>
  );
}
