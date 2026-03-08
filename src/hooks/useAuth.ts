import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const checkApproval = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_approved, approval_status')
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      setApprovalStatus((data as any).approval_status ?? 'pending');
      setIsApproved((data as any).is_approved ?? false);
    } else {
      setApprovalStatus('pending');
      setIsApproved(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkApproval(session.user.id), 0);
      } else {
        setApprovalStatus(null);
        setIsApproved(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkApproval(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkApproval]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, session, loading, signUp, signIn, signOut, approvalStatus, isApproved, recheckApproval: () => user && checkApproval(user.id) };
}
