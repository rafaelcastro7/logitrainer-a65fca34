import { supabase } from '@/integrations/supabase/client';

export interface ApiUsage {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
}

export interface GeneratedScene {
  name: string;
  script: string;
  image_prompt: string;
  duration: number;
}

// ==================== Script Generation ====================

export async function generateScript(params: {
  topic: string;
  language: string;
  durationTarget: number;
  scenesCount: number;
  visualStyle: string;
  modelTier: 'prototyping' | 'production';
}): Promise<{ scenes: GeneratedScene[]; usage: ApiUsage }> {
  const { data, error } = await supabase.functions.invoke('generate-script', {
    body: params,
  });

  if (error) throw new Error(error.message || 'Script generation failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ==================== Image Generation ====================

export async function generateImage(params: {
  prompt: string;
  modelTier: 'prototyping' | 'production';
}): Promise<{ imageUrl: string; usage: ApiUsage }> {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: params,
  });

  if (error) throw new Error(error.message || 'Image generation failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ==================== TTS Generation ====================

export async function generateTTS(params: {
  text: string;
  voiceName?: string;
  emotion?: string;
}): Promise<{ audioBase64: string | null; provider: string; message?: string }> {
  const { data, error } = await supabase.functions.invoke('generate-tts', {
    body: params,
  });

  if (error) throw new Error(error.message || 'TTS generation failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ==================== API Provider Registry ====================

export interface ApiProvider {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'available' | 'coming_soon';
  requiresKey: boolean;
  models: { id: string; name: string; tier: string; speed: string }[];
  icon: string; // lucide icon name
}

export const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'lovable-ai',
    name: 'Lovable AI',
    description: 'Gateway integrado con modelos Gemini y GPT-5. Sin configuración adicional.',
    capabilities: ['script_generation', 'image_generation', 'text_analysis'],
    status: 'active',
    requiresKey: false,
    icon: 'Sparkles',
    models: [
      { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', tier: 'prototyping', speed: '⚡ Rápido' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'production', speed: '🔥 Premium' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'prototyping', speed: '⚡ Rápido' },
      { id: 'google/gemini-2.5-flash-image', name: 'Gemini Flash Image', tier: 'prototyping', speed: '⚡ Imágenes' },
      { id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image', tier: 'production', speed: '🔥 Imágenes HD' },
      { id: 'openai/gpt-5', name: 'GPT-5', tier: 'production', speed: '🔥 Premium' },
      { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', tier: 'prototyping', speed: '⚡ Rápido' },
      { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', tier: 'prototyping', speed: '⚡⚡ Ultra rápido' },
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Voces ultra-realistas multilingüe. Requiere conexión de API.',
    capabilities: ['tts'],
    status: 'available',
    requiresKey: true,
    icon: 'AudioLines',
    models: [
      { id: 'eleven_multilingual_v2', name: 'Multilingual v2', tier: 'production', speed: '🔥 Alta calidad' },
      { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5', tier: 'prototyping', speed: '⚡ Baja latencia' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Búsqueda IA para investigación de temas. Requiere conexión.',
    capabilities: ['research'],
    status: 'available',
    requiresKey: true,
    icon: 'Search',
    models: [
      { id: 'sonar', name: 'Sonar', tier: 'prototyping', speed: '⚡ Búsqueda rápida' },
    ],
  },
  {
    id: 'runway',
    name: 'Runway ML',
    description: 'Generación de video con IA. Próximamente.',
    capabilities: ['video_generation'],
    status: 'coming_soon',
    requiresKey: true,
    icon: 'Film',
    models: [
      { id: 'gen-3', name: 'Gen-3 Alpha', tier: 'production', speed: '🔥 Video IA' },
    ],
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Generación de imágenes Stable Diffusion. Próximamente.',
    capabilities: ['image_generation'],
    status: 'coming_soon',
    requiresKey: true,
    icon: 'ImagePlus',
    models: [
      { id: 'sdxl', name: 'SDXL', tier: 'production', speed: '🔥 Alta calidad' },
      { id: 'sd3', name: 'Stable Diffusion 3', tier: 'production', speed: '🔥 Última gen' },
    ],
  },
];

// ==================== Usage Tracking ====================

export interface UsageRecord {
  provider: string;
  model: string;
  type: 'script' | 'image' | 'tts';
  tokens: number;
  timestamp: number;
}

let usageHistory: UsageRecord[] = [];

export function trackUsage(record: UsageRecord) {
  usageHistory.push(record);
}

export function getUsageHistory(): UsageRecord[] {
  return [...usageHistory];
}

export function getUsageSummary() {
  const byProvider: Record<string, { calls: number; tokens: number }> = {};
  for (const r of usageHistory) {
    if (!byProvider[r.provider]) byProvider[r.provider] = { calls: 0, tokens: 0 };
    byProvider[r.provider].calls++;
    byProvider[r.provider].tokens += r.tokens;
  }
  return {
    totalCalls: usageHistory.length,
    totalTokens: usageHistory.reduce((s, r) => s + r.tokens, 0),
    byProvider,
  };
}
