import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ['⌘', 'S'], desc: 'Save project' },
  { keys: ['⌘', 'Z'], desc: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], desc: 'Redo' },
  { keys: ['⌘', '⇧', 'N'], desc: 'New project' },
  { keys: ['⌘', '⇧', 'P'], desc: 'Preview' },
  { keys: ['Space'], desc: 'Play/Pause preview' },
];

export default function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gradient-primary text-xl">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-1 border-b border-border/20 last:border-0">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-md bg-muted/80 border border-border/50 text-xs font-mono font-semibold text-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Use <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">Ctrl</kbd> instead of <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">⌘</kbd> on Windows/Linux
        </p>
      </DialogContent>
    </Dialog>
  );
}
