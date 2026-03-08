import { useEffect } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onNewProject?: () => void;
  onPreview?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handlers.onSave?.();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onRedo?.();
          } else {
            handlers.onUndo?.();
          }
          break;
        case 'y':
          e.preventDefault();
          handlers.onRedo?.();
          break;
        case 'n':
          if (e.shiftKey) {
            e.preventDefault();
            handlers.onNewProject?.();
          }
          break;
        case 'p':
          if (e.shiftKey) {
            e.preventDefault();
            handlers.onPreview?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
