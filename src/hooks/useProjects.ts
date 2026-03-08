import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, DEFAULT_PROJECT } from '@/types/project';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface SavedProject {
  id: string;
  name: string;
  data: Project;
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjects(user: User | null) {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setSavedProjects((data || []).map(d => ({
        id: d.id,
        name: d.name,
        data: d.data as unknown as Project,
        share_token: d.share_token,
        is_public: d.is_public ?? false,
        created_at: d.created_at,
        updated_at: d.updated_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const saveProject = useCallback(async (project: Project): Promise<string | null> => {
    if (!user) return null;
    
    if (currentProjectId) {
      const { error } = await supabase
        .from('projects')
        .update({ name: project.meta.name, data: JSON.parse(JSON.stringify(project)) })
        .eq('id', currentProjectId);
      if (error) { toast.error('Save failed'); return null; }
      toast.success('Project saved');
      fetchProjects();
      return currentProjectId;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ user_id: user.id, name: project.meta.name, data: JSON.parse(JSON.stringify(project)) }])
        .select('id')
        .single();
      if (error || !data) { toast.error('Save failed'); return null; }
      setCurrentProjectId(data.id);
      toast.success('Project saved');
      fetchProjects();
      return data.id;
    }
  }, [user, currentProjectId, fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    if (currentProjectId === id) setCurrentProjectId(null);
    toast.success('Project deleted');
    fetchProjects();
  }, [currentProjectId, fetchProjects]);

  const generateShareLink = useCallback(async (id: string): Promise<string | null> => {
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from('projects')
      .update({ share_token: token, is_public: true })
      .eq('id', id);
    if (error) { toast.error('Failed to generate link'); return null; }
    fetchProjects();
    const link = `${window.location.origin}/?shared=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success('Share link copied!');
    return link;
  }, [fetchProjects]);

  const loadSharedProject = useCallback(async (token: string): Promise<Project | null> => {
    // Validate token format before sending
    if (!token || typeof token !== 'string' || token.length > 100) return null;
    
    const { data, error } = await supabase
      .rpc('get_shared_project', { p_share_token: token });
    if (error || !data || data.length === 0) return null;
    return (data[0] as any).data as unknown as Project;
  }, []);

  return {
    savedProjects,
    loading,
    currentProjectId,
    setCurrentProjectId,
    saveProject,
    deleteProject,
    fetchProjects,
    generateShareLink,
    loadSharedProject,
  };
}
