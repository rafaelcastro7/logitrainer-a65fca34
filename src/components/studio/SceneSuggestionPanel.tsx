import { useState } from 'react';
import { Sparkles, Wand2, Palette, Clock, Shuffle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Scene, TransitionType } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SceneSuggestionPanelProps {
  scenes: Scene[];
  onApplySuggestion: (sceneId: string, updates: Partial<Scene>) => void;
}

interface Suggestion {
  sceneId: string;
  sceneName: string;
  type: 'transition' | 'duration' | 'animation' | 'prompt';
  label: string;
  description: string;
  action: Partial<Scene>;
}

export default function SceneSuggestionPanel({ scenes, onApplySuggestion }: SceneSuggestionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  // Generate smart suggestions based on content analysis
  const suggestions: Suggestion[] = [];

  scenes.forEach((scene, i) => {
    const wordCount = scene.script.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.ceil((wordCount / 150) * 60);

    // Duration mismatch
    if (wordCount > 0 && Math.abs(readTime - scene.duration) > 3) {
      suggestions.push({
        sceneId: scene.id,
        sceneName: scene.name,
        type: 'duration',
        label: `Adjust duration to ~${readTime}s`,
        description: `Script has ${wordCount} words (~${readTime}s reading), but duration is ${scene.duration}s`,
        action: { duration: readTime },
      });
    }

    // Transition suggestions
    if (i > 0 && scene.transition === 'none') {
      const prevScene = scenes[i - 1];
      const suggestedTransition: TransitionType = 
        scene.script.toLowerCase().includes('meanwhile') || scene.script.toLowerCase().includes('por otro lado') ? 'wipe_left' :
        scene.script.toLowerCase().includes('later') || scene.script.toLowerCase().includes('después') ? 'dissolve' :
        'fade';
      
      suggestions.push({
        sceneId: scene.id,
        sceneName: scene.name,
        type: 'transition',
        label: `Add ${suggestedTransition} transition`,
        description: `No transition between "${prevScene.name}" and this scene`,
        action: { transition: suggestedTransition },
      });
    }

    // Static animation
    if (scene.animation.type === 'static' && scene.image.status === 'completed') {
      suggestions.push({
        sceneId: scene.id,
        sceneName: scene.name,
        type: 'animation',
        label: 'Add Ken Burns effect',
        description: 'Static images feel more dynamic with subtle motion',
        action: { animation: { type: 'zoom_in', intensity: 0.3 } },
      });
    }

    // Short/empty prompt
    if (scene.image_prompt.length < 20 && scene.script.trim().length > 30) {
      suggestions.push({
        sceneId: scene.id,
        sceneName: scene.name,
        type: 'prompt',
        label: 'Enhance image prompt',
        description: 'Image prompt is too short for good generation results',
        action: {},
      });
    }
  });

  if (suggestions.length === 0) return null;

  const handleApply = (suggestion: Suggestion, idx: number) => {
    if (Object.keys(suggestion.action).length > 0) {
      onApplySuggestion(suggestion.sceneId, suggestion.action);
    }
    setApplied(prev => new Set([...prev, `${idx}`]));
  };

  const typeIcons: Record<string, typeof Sparkles> = {
    transition: Shuffle,
    duration: Clock,
    animation: Palette,
    prompt: Wand2,
  };

  const typeColors: Record<string, string> = {
    transition: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    duration: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    animation: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    prompt: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary/20 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold flex-1 text-left">Smart Suggestions</span>
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
          {suggestions.length - applied.size} tips
        </Badge>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {suggestions.map((s, i) => {
            const Icon = typeIcons[s.type] || Sparkles;
            const isApplied = applied.has(`${i}`);
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
                  isApplied ? "opacity-40 bg-muted/10 border-border/10" : "bg-muted/20 border-border/20 hover:bg-muted/30"
                )}
              >
                <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg shrink-0 border", typeColors[s.type])}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.sceneName} — {s.description}</p>
                </div>
                {!isApplied && Object.keys(s.action).length > 0 && (
                  <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 shrink-0" onClick={() => handleApply(s, i)}>
                    Apply
                  </Button>
                )}
                {isApplied && <span className="text-[10px] text-success shrink-0">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
