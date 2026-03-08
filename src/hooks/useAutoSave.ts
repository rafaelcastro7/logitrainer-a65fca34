import { useEffect, useRef } from 'react';
import { Project } from '@/types/project';

const AUTOSAVE_KEY = 'lt-autosave';
const AUTOSAVE_INTERVAL = 15000; // 15 seconds

export function useAutoSave(project: Project, hasProject: boolean) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasProject) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
      } catch {}
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [project, hasProject]);
}

export function getAutoSavedProject(): Project | null {
  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function clearAutoSave() {
  localStorage.removeItem(AUTOSAVE_KEY);
}
