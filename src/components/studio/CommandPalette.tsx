import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Clapperboard, Play, Images, Activity, Server, Info,
  Save, FolderOpen, FilePlus2, Undo2, Redo2, Shield, Search, Sparkles,
  Image, Mic, Zap, Download, Upload, Settings2, Music, Command
} from 'lucide-react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator
} from '@/components/ui/command';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: string) => void;
  onSave?: () => void;
  onNewProject?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenProjects?: () => void;
  onGenerateAllImages?: () => void;
  onGenerateAllAudios?: () => void;
  hasProject: boolean;
  isAdmin?: boolean;
}

export default function CommandPalette({
  open, onOpenChange, onNavigate, onSave, onNewProject,
  onUndo, onRedo, onOpenProjects, onGenerateAllImages,
  onGenerateAllAudios, hasProject, isAdmin
}: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const run = (fn?: () => void) => {
    fn?.();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands, navigate, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => onNavigate('dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('editor'))}>
            <Clapperboard className="mr-2 h-4 w-4" /> Editor
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('preview'))}>
            <Play className="mr-2 h-4 w-4" /> Preview & Render
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('assets'))}>
            <Images className="mr-2 h-4 w-4" /> Assets
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('export'))}>
            <Download className="mr-2 h-4 w-4" /> Export Hub
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('analytics'))}>
            <Activity className="mr-2 h-4 w-4" /> Analytics
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('apis'))}>
            <Server className="mr-2 h-4 w-4" /> API Hub
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate('about'))}>
            <Info className="mr-2 h-4 w-4" /> About
          </CommandItem>
          {isAdmin && (
            <CommandItem onSelect={() => run(() => onNavigate('admin'))}>
              <Shield className="mr-2 h-4 w-4" /> Admin Panel
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {hasProject && onSave && (
            <CommandItem onSelect={() => run(onSave)}>
              <Save className="mr-2 h-4 w-4" /> Save Project
              <span className="ml-auto text-xs text-muted-foreground">⌘S</span>
            </CommandItem>
          )}
          {onNewProject && (
            <CommandItem onSelect={() => run(onNewProject)}>
              <FilePlus2 className="mr-2 h-4 w-4" /> New Project
            </CommandItem>
          )}
          {onOpenProjects && (
            <CommandItem onSelect={() => run(onOpenProjects)}>
              <FolderOpen className="mr-2 h-4 w-4" /> Open Projects
            </CommandItem>
          )}
          {hasProject && onUndo && (
            <CommandItem onSelect={() => run(onUndo)}>
              <Undo2 className="mr-2 h-4 w-4" /> Undo
              <span className="ml-auto text-xs text-muted-foreground">⌘Z</span>
            </CommandItem>
          )}
          {hasProject && onRedo && (
            <CommandItem onSelect={() => run(onRedo)}>
              <Redo2 className="mr-2 h-4 w-4" /> Redo
              <span className="ml-auto text-xs text-muted-foreground">⌘⇧Z</span>
            </CommandItem>
          )}
        </CommandGroup>

        {hasProject && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Generate">
              {onGenerateAllImages && (
                <CommandItem onSelect={() => run(onGenerateAllImages)}>
                  <Image className="mr-2 h-4 w-4" /> Generate All Images
                </CommandItem>
              )}
              {onGenerateAllAudios && (
                <CommandItem onSelect={() => run(onGenerateAllAudios)}>
                  <Mic className="mr-2 h-4 w-4" /> Generate All Audio
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
