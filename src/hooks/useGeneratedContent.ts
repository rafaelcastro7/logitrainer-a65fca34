import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeneratedContentItem {
  id: string;
  module: string;
  title: string;
  prompt: string;
  content: string;
  metadata: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useGeneratedContent(module: string) {
  const [items, setItems] = useState<GeneratedContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GeneratedContentItem | null>(null);

  const fetchItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .eq('module', module)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setItems(data.map(d => ({
        ...d,
        metadata: (d.metadata as Record<string, any>) ?? {},
      })));
    }
    setLoading(false);
  }, [module]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const saveContent = useCallback(async (opts: {
    title: string;
    prompt: string;
    content: string;
    metadata?: Record<string, any>;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Inicia sesión para guardar contenido');
      return null;
    }
    const { data, error } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        module,
        title: opts.title,
        prompt: opts.prompt,
        content: opts.content,
        metadata: opts.metadata ?? {},
      })
      .select()
      .single();
    if (error) {
      toast.error('Error al guardar: ' + error.message);
      return null;
    }
    const item: GeneratedContentItem = {
      ...data,
      metadata: (data.metadata as Record<string, any>) ?? {},
    };
    setItems(prev => [item, ...prev]);
    toast.success('Contenido guardado ✅');
    return item;
  }, [module]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('generated_content').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      toast.success('Eliminado');
    }
  }, [selectedItem]);

  const updateContent = useCallback(async (id: string, updates: { title?: string; content?: string; metadata?: Record<string, any> }) => {
    const { data, error } = await supabase
      .from('generated_content')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      toast.error('Error al actualizar: ' + error.message);
      return null;
    }
    const item: GeneratedContentItem = { ...data, metadata: (data.metadata as Record<string, any>) ?? {} };
    setItems(prev => prev.map(i => i.id === id ? item : i));
    if (selectedItem?.id === id) setSelectedItem(item);
    toast.success('Cambios guardados ✅');
    return item;
  }, [selectedItem]);

  const toggleFavorite = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const { error } = await supabase
      .from('generated_content')
      .update({ is_favorite: !item.is_favorite })
      .eq('id', id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: !i.is_favorite } : i));
    }
  }, [items]);

  return {
    items,
    loading,
    selectedItem,
    setSelectedItem,
    saveContent,
    updateContent,
    deleteItem,
    toggleFavorite,
    refetch: fetchItems,
  };
}

