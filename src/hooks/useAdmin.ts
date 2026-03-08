import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface PendingUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_approved: boolean;
  approval_status: string;
}

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setAllUsers(data as PendingUser[]);
      setPendingUsers((data as PendingUser[]).filter(u => u.approval_status === 'pending'));
    }
  }, [isAdmin]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const approveUser = useCallback(async (userId: string) => {
    await supabase.from('profiles').update({ 
      is_approved: true, 
      approval_status: 'approved' 
    }).eq('id', userId);
    await fetchUsers();
  }, [fetchUsers]);

  const rejectUser = useCallback(async (userId: string) => {
    await supabase.from('profiles').update({ 
      is_approved: false, 
      approval_status: 'rejected' 
    }).eq('id', userId);
    await fetchUsers();
  }, [fetchUsers]);

  return { isAdmin, loading, pendingUsers, allUsers, approveUser, rejectUser, refetch: fetchUsers };
}
