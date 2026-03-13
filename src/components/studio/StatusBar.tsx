import { useState, useEffect } from 'react';
import { Clock, Cpu, Film, Sparkles, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/types/project';
import type { User as SupaUser } from '@supabase/supabase-js';

interface StatusBarProps {
  scenes: Scene[];
  user: SupaUser | null;
  hasProject: boolean;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export default function StatusBar({ scenes, user, hasProject, lastSaved, isSaving }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const totalScenes = scenes.length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const generating = scenes.some(s => s.image.status === 'generating' || s.audio.status === 'generating');
  const hasErrors = scenes.some(s => s.image.status === 'error' || s.audio.status === 'error');
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const totalWords = scenes.reduce((sum, s) => sum + s.script.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalAssets = totalScenes * 2;
  const completedAssets = completedImages + completedAudios;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatSaveTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <footer className="shrink-0 h-7 border-t border-border/15 bg-card/40 backdrop-blur-xl flex items-center px-4 gap-4 text-[10px] text-muted-foreground/70 font-mono select-none">
      {/* Connection Status */}
      <div className="flex items-center gap-1.5">
        {user ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Cloud</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span>Local</span>
          </>
        )}
      </div>

      <span className="text-border/40">│</span>

      {/* Engine Status */}
      <div className="flex items-center gap-1.5">
        {generating ? (
          <>
            <Sparkles className="w-2.5 h-2.5 text-primary animate-pulse" />
            <span className="text-primary/80">Generating...</span>
          </>
        ) : hasErrors ? (
          <>
            <AlertCircle className="w-2.5 h-2.5 text-destructive" />
            <span className="text-destructive/80">Errors</span>
          </>
        ) : (
          <>
            <Cpu className="w-2.5 h-2.5" />
            <span>Ready</span>
          </>
        )}
      </div>

      {/* Save Status */}
      {user && hasProject && (
        <>
          <span className="text-border/40">│</span>
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <>
                <Save className="w-2.5 h-2.5 animate-pulse text-primary" />
                <span className="text-primary/70">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                <span>Saved {formatSaveTime(lastSaved)}</span>
              </>
            ) : (
              <>
                <Save className="w-2.5 h-2.5 text-muted-foreground/40" />
                <span>Unsaved</span>
              </>
            )}
          </div>
        </>
      )}

      {hasProject && totalScenes > 0 && (
        <>
          <span className="text-border/40">│</span>
          <div className="flex items-center gap-1.5">
            <Film className="w-2.5 h-2.5" />
            <span>{totalScenes} scenes</span>
          </div>
          <span className="text-border/40">│</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-2.5 h-2.5" />
            <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
          </div>
          <span className="text-border/40">│</span>
          <span>{completedAssets}/{totalAssets} assets</span>
          <span className="text-border/40">│</span>
          <span>{totalWords.toLocaleString()} words</span>
        </>
      )}

      <div className="flex-1" />

      <span className="tabular-nums">
        {currentTime.getHours()}:{String(currentTime.getMinutes()).padStart(2, '0')}
      </span>
      <span className="text-border/40">│</span>
      <span className="opacity-50">LogiTrainer Studio v3.1</span>
    </footer>
  );
}
