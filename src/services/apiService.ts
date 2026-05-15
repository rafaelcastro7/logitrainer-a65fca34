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

// ==================== User API Keys ====================

export async function getUserApiKeys(): Promise<Record<string, { api_key: string; is_active: boolean }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('provider_id, api_key, is_active')
    .eq('user_id', user.id);

  if (error || !data) return {};

  const keys: Record<string, { api_key: string; is_active: boolean }> = {};
  for (const row of data) {
    keys[row.provider_id] = { api_key: row.api_key, is_active: row.is_active };
  }
  return keys;
}

export async function saveUserApiKey(providerId: string, apiKey: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_api_keys')
    .upsert({
      user_id: user.id,
      provider_id: providerId,
      api_key: apiKey,
      is_active: true,
    }, { onConflict: 'user_id,provider_id' });

  if (error) throw new Error(error.message);
}

export async function deleteUserApiKey(providerId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider_id', providerId);

  if (error) throw new Error(error.message);
}

export async function toggleUserApiKey(providerId: string, isActive: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_api_keys')
    .update({ is_active: isActive })
    .eq('user_id', user.id)
    .eq('provider_id', providerId);

  if (error) throw new Error(error.message);
}

// ==================== Script Generation ====================

export async function generateScript(params: {
  topic: string;
  language: string;
  durationTarget: number;
  scenesCount: number;
  visualStyle: string;
  modelTier: 'prototyping' | 'production';
  provider?: string;
  model?: string;
  localEndpoint?: string;
}): Promise<{ scenes: GeneratedScene[]; usage: ApiUsage }> {
  if (params.provider === 'local-ollama' && params.localEndpoint) {
    return generateScriptLocal({
      topic: params.topic,
      language: params.language,
      scenesCount: params.scenesCount,
      model: params.model || 'llama3',
      endpoint: params.localEndpoint,
    });
  }

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
  provider?: string;
  userApiKey?: string;
}): Promise<{ imageUrl: string; usage: ApiUsage }> {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: params,
  });

  if (error) throw new Error(error.message || 'Image generation failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function generateScriptLocal(params: {
  topic: string;
  language: string;
  scenesCount: number;
  model: string;
  endpoint: string;
}): Promise<{ scenes: GeneratedScene[]; usage: ApiUsage }> {
  console.log('🤖 Generating script locally with:', params.model, 'at', params.endpoint);
  
  const response = await fetch(`${params.endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.model,
      messages: [
        {
          role: 'system',
          content: `You are a video script generator. Output ONLY a valid JSON object with the following structure:
          {
            "scenes": [
              { "name": "Scene Name", "script": "Narration text", "image_prompt": "Description for AI image generator", "duration": 8 }
            ],
            "usage": { "model": "${params.model}", "prompt_tokens": 0, "completion_tokens": 0 }
          }
          Generate ${params.scenesCount} scenes about the topic in ${params.language}.`
        },
        { role: 'user', content: params.topic }
      ],
      stream: false,
    }),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  const data = await response.json();
  const content = data.message?.content || '{}';
  
  try {
    const parsed = JSON.parse(content.replace(/```json|```/g, ''));
    return {
      scenes: parsed.scenes || [],
      usage: {
        model: params.model,
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      }
    };
  } catch (e) {
    console.error('Failed to parse local LLM response:', content);
    throw new Error('Local LLM returned invalid format. Ensure it follows JSON instructions.');
  }
}

// ==================== TTS Generation ====================

export async function generateTTS(params: {
  text: string;
  voiceName?: string;
  emotion?: string;
  provider?: string;
  userApiKey?: string;
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
  icon: string;
  keyPlaceholder?: string;
  docsUrl?: string;
  keyInstructions?: string;
}

export const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'lovable-ai',
    name: 'Lovable AI',
    description: 'Gateway integrado con Gemini y GPT-5. Sin configuración adicional.',
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
    description: 'Voces ultra-realistas multilingüe y generación de música con IA.',
    capabilities: ['tts', 'music_generation'],
    status: 'available',
    requiresKey: true,
    icon: 'AudioLines',
    keyPlaceholder: 'xi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    keyInstructions: 'Ve a elevenlabs.io → Profile → API Keys → Create API Key',
    models: [
      { id: 'eleven_multilingual_v2', name: 'Multilingual v2', tier: 'production', speed: '🔥 Alta calidad' },
      { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5', tier: 'prototyping', speed: '⚡ Baja latencia' },
      { id: 'eleven_music_v1', name: 'Music v1', tier: 'production', speed: '🎵 Música IA' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI (Directo)',
    description: 'Acceso directo a DALL·E 3, GPT-4o y Whisper con tu propia API key.',
    capabilities: ['image_generation', 'script_generation', 'tts'],
    status: 'available',
    requiresKey: true,
    icon: 'Sparkles',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyInstructions: 'Ve a platform.openai.com → API Keys → Create new secret key',
    models: [
      { id: 'dall-e-3', name: 'DALL·E 3', tier: 'production', speed: '🔥 Imágenes HD' },
      { id: 'gpt-4o', name: 'GPT-4o', tier: 'production', speed: '🔥 Multimodal' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'prototyping', speed: '⚡ Rápido' },
      { id: 'tts-1-hd', name: 'TTS-1 HD', tier: 'production', speed: '🔥 Voz HD' },
      { id: 'tts-1', name: 'TTS-1', tier: 'prototyping', speed: '⚡ Voz rápida' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 4 para scripts de alta calidad con razonamiento avanzado.',
    capabilities: ['script_generation', 'text_analysis'],
    status: 'available',
    requiresKey: true,
    icon: 'Sparkles',
    keyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyInstructions: 'Ve a console.anthropic.com → Settings → API Keys → Create Key',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tier: 'production', speed: '🔥 Premium' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tier: 'prototyping', speed: '⚡ Rápido' },
    ],
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion 3 y SDXL para imágenes fotorrealistas y artísticas.',
    capabilities: ['image_generation'],
    status: 'available',
    requiresKey: true,
    icon: 'ImagePlus',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://platform.stability.ai/account/keys',
    keyInstructions: 'Ve a platform.stability.ai → Account → API Keys',
    models: [
      { id: 'sd3-large', name: 'SD3 Large', tier: 'production', speed: '🔥 Última gen' },
      { id: 'sd3-medium', name: 'SD3 Medium', tier: 'prototyping', speed: '⚡ Balanceado' },
      { id: 'sdxl-1.0', name: 'SDXL 1.0', tier: 'prototyping', speed: '⚡ Clásico' },
    ],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Miles de modelos open-source: Flux, MusicGen, Bark y más.',
    capabilities: ['image_generation', 'tts', 'music_generation'],
    status: 'available',
    requiresKey: true,
    icon: 'Film',
    keyPlaceholder: 'r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://replicate.com/account/api-tokens',
    keyInstructions: 'Ve a replicate.com → Account → API Tokens',
    models: [
      { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', tier: 'production', speed: '🔥 Imágenes HD' },
      { id: 'black-forest-labs/flux-schnell', name: 'Flux Schnell', tier: 'prototyping', speed: '⚡ Ultra rápido' },
      { id: 'meta/musicgen', name: 'MusicGen', tier: 'production', speed: '🎵 Música' },
      { id: 'suno-ai/bark', name: 'Bark TTS', tier: 'production', speed: '🎙️ Voces' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Búsqueda IA con fuentes verificadas para investigación de temas.',
    capabilities: ['research'],
    status: 'available',
    requiresKey: true,
    icon: 'Search',
    keyPlaceholder: 'pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://docs.perplexity.ai',
    keyInstructions: 'Ve a perplexity.ai → Settings → API → Generate API Key',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', tier: 'production', speed: '🔥 Búsqueda profunda' },
      { id: 'sonar', name: 'Sonar', tier: 'prototyping', speed: '⚡ Búsqueda rápida' },
    ],
  },
  {
    id: 'fal',
    name: 'fal.ai',
    description: 'Infraestructura GPU rápida para Flux, animación y video IA.',
    capabilities: ['image_generation', 'video_generation'],
    status: 'available',
    requiresKey: true,
    icon: 'Film',
    keyPlaceholder: 'fal-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://fal.ai/dashboard/keys',
    keyInstructions: 'Ve a fal.ai → Dashboard → API Keys',
    models: [
      { id: 'fal-ai/flux-pro/v1.1', name: 'Flux Pro v1.1', tier: 'production', speed: '🔥 Imágenes HD' },
      { id: 'fal-ai/minimax/video-01', name: 'MiniMax Video', tier: 'production', speed: '🎬 Video IA' },
    ],
  },
  {
    id: 'local-ollama',
    name: 'Local Ollama',
    description: 'Ejecuta modelos como Llama 3, Mistral o Phi-3 en tu propio hardware.',
    capabilities: ['script_generation', 'text_analysis'],
    status: 'available',
    requiresKey: false,
    icon: 'Cpu',
    keyPlaceholder: 'http://localhost:11434',
    docsUrl: 'https://ollama.com',
    keyInstructions: 'Instala Ollama y asegúrate de que el servidor esté corriendo (OLLAMA_ORIGINS="*" ollama serve)',
    models: [
      { id: 'llama3', name: 'Llama 3 (Local)', tier: 'prototyping', speed: '💻 Hardware local' },
      { id: 'mistral', name: 'Mistral (Local)', tier: 'prototyping', speed: '💻 Hardware local' },
      { id: 'phi3', name: 'Phi-3 (Local)', tier: 'prototyping', speed: '💻 Hardware local' },
      { id: 'custom', name: 'Custom Model', tier: 'prototyping', speed: '💻 Hardware local' },
    ],
  },
  {
    id: 'runway',
    name: 'Runway ML',
    description: 'Generación de video con Gen-3 Alpha. Líder en video IA.',
    capabilities: ['video_generation'],
    status: 'coming_soon',
    requiresKey: true,
    icon: 'Film',
    models: [
      { id: 'gen-3-alpha', name: 'Gen-3 Alpha', tier: 'production', speed: '🎬 Video IA' },
    ],
  },
];

// ==================== Usage Tracking ====================

export interface UsageRecord {
  provider: string;
  model: string;
  type: 'script' | 'image' | 'tts' | 'music' | 'research';
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
