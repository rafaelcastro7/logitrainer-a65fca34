import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Square, Trash2, Image, Mic, Shuffle, Zap,
  X, RotateCw
} from 'lucide-react';
import { Scene, TransitionType, AnimationSettings } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BatchOperationsProps {
  scenes: Scene[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchUpdateTransition: (ids: string[], transition: TransitionType) => void;
  onBatchUpdateAnimation: (ids: string[], animation: Partial<AnimationSettings>) => void;
  onBatchGenerateImages: (ids: string[]) => void;
  onBatchGenerateAudios: (ids: string[]) => void;
}

export default function BatchOperations({
  scenes, selectedIds, onToggleSelect, onSelectAll, onClearSelection,
  onBatchDelete, onBatchUpdateTransition, onBatchUpdateAnimation,
  onBatchGenerateImages, onBatchGenerateAudios,
}: BatchOperationsProps) {
  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === scenes.length && scenes.length > 0;

  const selectedScenes = scenes.filter(s => selectedIds.has(s.id));
  const pendingImages = selectedScenes.filter(s => s.image.status !== 'completed').length;
  const pendingAudios = selectedScenes.filter(s => s.audio.status !== 'completed' && s.script.trim()).length;

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-2 flex-wrap">
            {/* Selection info */}
            <div className="flex items-center gap-2 mr-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                <CheckSquare className="w-3 h-3" />
                {selectedCount} selected
              </Badge>
              <button onClick={onSelectAll} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <button onClick={onClearSelection} className="p-1 rounded hover:bg-muted/50 transition-colors">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            <div className="h-4 w-px bg-border/40" />

            {/* Batch actions */}
            {pendingImages > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1"
                onClick={() => onBatchGenerateImages(Array.from(selectedIds))}
              >
                <Image className="w-3 h-3" /> Generate {pendingImages} images
              </Button>
            )}

            {pendingAudios > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1"
                onClick={() => onBatchGenerateAudios(Array.from(selectedIds))}
              >
                <Mic className="w-3 h-3" /> Generate {pendingAudios} audios
              </Button>
            )}

            {/* Batch transition */}
            <Select onValueChange={v => onBatchUpdateTransition(Array.from(selectedIds), v as TransitionType)}>
              <SelectTrigger className="h-7 w-[120px] text-[11px] bg-muted/30 border-border/30">
                <Shuffle className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Transition" />
              </SelectTrigger>
              <SelectContent>
                {['fade', 'wipe_left', 'wipe_right', 'dissolve', 'slide_up', 'none'].map(t => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Batch animation */}
            <Select onValueChange={v => onBatchUpdateAnimation(Array.from(selectedIds), { type: v as AnimationSettings['type'] })}>
              <SelectTrigger className="h-7 w-[120px] text-[11px] bg-muted/30 border-border/30">
                <Zap className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Animation" />
              </SelectTrigger>
              <SelectContent>
                {['static', 'zoom_in', 'zoom_out', 'pan_left', 'pan_right'].map(a => (
                  <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {/* Batch delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" /> Delete {selectedCount}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedCount} scenes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the selected scenes and their generated assets.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      onBatchDelete(Array.from(selectedIds));
                      toast.success(`🗑️ ${selectedCount} scenes deleted`);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}