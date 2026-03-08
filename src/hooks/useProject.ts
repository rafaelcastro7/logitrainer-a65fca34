import { useState, useCallback } from 'react';
import { Project, Scene, ProjectMeta, DEFAULT_PROJECT } from '@/types/project';

export function useProject() {
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const updateMeta = useCallback((updates: Partial<ProjectMeta>) => {
    setProject(prev => ({ ...prev, meta: { ...prev.meta, ...updates } }));
  }, []);

  const setScenes = useCallback((scenes: Scene[]) => {
    setProject(prev => ({ ...prev, scenes }));
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const removeScene = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== id),
    }));
  }, []);

  const addScene = useCallback((scene: Scene) => {
    setProject(prev => ({ ...prev, scenes: [...prev.scenes, scene] }));
  }, []);

  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setProject(prev => {
      const scenes = [...prev.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      return { ...prev, scenes };
    });
  }, []);

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
  };
}
