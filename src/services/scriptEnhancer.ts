import { supabase } from '@/integrations/supabase/client';

export type EnhanceAction = 'improve' | 'shorten' | 'expand' | 'rewrite' | 'dramatic' | 'casual';

export async function enhanceScript(params: {
  script: string;
  action: EnhanceAction;
  language?: string;
  context?: string;
}): Promise<{ enhanced: string; action: string }> {
  const { data, error } = await supabase.functions.invoke('enhance-script', {
    body: params,
  });

  if (error) throw new Error(error.message || 'Script enhancement failed');
  if (data?.error) throw new Error(data.error);
  return data;
}
