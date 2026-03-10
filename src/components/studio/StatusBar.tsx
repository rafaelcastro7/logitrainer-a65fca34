import { Wifi, WifiOff, Clock, Cpu, Zap, Film, HardDrive, Activity, Sparkles } from 'lucide-react';
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
    <footer className="shrink-0 h-6 border-t border-border/15 bg-card/30 backdrop-blur-xl flex items-center px-4 gap-3 text-[10px] text-muted-foreground/70 font-mono select-none">
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        {user ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Cloud</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span>Local</span>
          </>
        )}
      </div>

      <span className="text-border/40">·</span>

      {/* Engine Status */}
      <div className="flex items-center gap-1.5">
        {generating ? (
          <>
            <Sparkles className="w-2.5 h-2.5 text-primary animate-pulse" />
            <span className="text-primary/80">Processing</span>
          </>
        ) : (
          <>
            <Cpu className="w-2.5 h-2.5" />
            <span>Ready</span>
          </>
        )}
      </div>

      {hasProject && totalScenes > 0 && (
        <>
          <span className="text-border/40">·</span>
          <span>{totalScenes} scenes</span>
          <span className="text-border/40">·</span>
          <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
          <span className="text-border/40">·</span>
          <span>{completedImages + completedAudios}/{totalScenes * 2} assets</span>
          <span className="text-border/40">·</span>
          <span>{totalWords} words</span>
        </>
      )}

      <div className="flex-1" />

      <span className="opacity-40">LogiTrainer Studio v3.0</span>
    </footer>
  );
}
