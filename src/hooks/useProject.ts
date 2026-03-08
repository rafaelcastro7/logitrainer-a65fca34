import { useState, useCallback, useRef } from 'react';
import { Project, Scene, ProjectMeta, BackgroundMusic, DEFAULT_PROJECT } from '@/types/project';

interface HistoryEntry {
  project: Project;
  label: string;
}

export function useProject() {
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const historyRef = useRef<HistoryEntry[]>([{ project: DEFAULT_PROJECT, label: 'init' }]);
  const historyIndexRef = useRef(0);
  const maxHistory = 50;

  const pushHistory = useCallback((newProject: Project, label: string) => {
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push({ project: JSON.parse(JSON.stringify(newProject)), label });
    if (historyRef.current.length > maxHistory) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setProject(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current].project)));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setProject(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current].project)));
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const loadProject = useCallback((p: Project) => {
    const clone = JSON.parse(JSON.stringify(p));
    if (!clone.backgroundMusic) {
      clone.backgroundMusic = { id: crypto.randomUUID(), name: '', url: null, volume: 0.15, fadeIn: 2, fadeOut: 3, loop: true, status: 'none' };
    }
    if (!clone.meta.aspectRatio) clone.meta.aspectRatio = '16:9';
    // Ensure all scenes have transition
    if (clone.scenes) {
      clone.scenes = clone.scenes.map((s: any) => ({ transition: 'fade', ...s }));
    }
    setProject(clone);
    historyRef.current = [{ project: clone, label: 'load' }];
    historyIndexRef.current = 0;
  }, []);

  const resetProject = useCallback(() => {
    loadProject(DEFAULT_PROJECT);
    setActiveTab('dashboard');
  }, [loadProject]);

  const updateMeta = useCallback((updates: Partial<ProjectMeta>) => {
    setProject(prev => {
      const next = { ...prev, meta: { ...prev.meta, ...updates } };
      pushHistory(next, 'updateMeta');
      return next;
    });
  }, [pushHistory]);

  const setScenes = useCallback((scenes: Scene[]) => {
    setProject(prev => {
      const next = { ...prev, scenes };
      pushHistory(next, 'setScenes');
      return next;
    });
  }, [pushHistory]);

  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setProject(prev => {
      const next = {
        ...prev,
        scenes: prev.scenes.map(s => s.id === id ? { ...s, ...updates } : s),
      };
      const isStatusOnly = Object.keys(updates).every(k => k === 'image' || k === 'audio');
      if (!isStatusOnly) pushHistory(next, 'updateScene');
      return next;
    });
  }, [pushHistory]);

  const removeScene = useCallback((id: string) => {
    setProject(prev => {
      const next = { ...prev, scenes: prev.scenes.filter(s => s.id !== id) };
      pushHistory(next, 'removeScene');
      return next;
    });
  }, [pushHistory]);

  const addScene = useCallback((scene: Scene) => {
    setProject(prev => {
      const next = { ...prev, scenes: [...prev.scenes, scene] };
      pushHistory(next, 'addScene');
      return next;
    });
  }, [pushHistory]);

  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setProject(prev => {
      const scenes = [...prev.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      const next = { ...prev, scenes };
      pushHistory(next, 'reorderScenes');
      return next;
    });
  }, [pushHistory]);

  const updateBackgroundMusic = useCallback((updates: Partial<BackgroundMusic>) => {
    setProject(prev => {
      const next = { ...prev, backgroundMusic: { ...prev.backgroundMusic, ...updates } };
      // Don't push history for status updates
      if (!('status' in updates)) pushHistory(next, 'updateMusic');
      return next;
    });
  }, [pushHistory]);

  return {
    project,
    activeTab,
    setActiveTab,
    updateMeta,
    setScenes,
    updateScene,
    removeScene,
    addScene,
    reorderScenes,
    loadProject,
    resetProject,
    undo,
    redo,
    canUndo,
    canRedo,
    updateBackgroundMusic,
  };
}
