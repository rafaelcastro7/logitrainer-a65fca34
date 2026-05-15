import { API_PROVIDERS, ApiProvider } from '@/services/apiService';

export type TaskType = 'script' | 'image' | 'tts' | 'music' | 'research';
export type Priority = 'speed' | 'quality' | 'cost';

export interface RouteResult {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  tier: string;
  estimatedCost: number; // relative 1-10
  estimatedSpeed: number; // relative 1-10 (higher = faster)
  estimatedQuality: number; // relative 1-10
  score: number;
}

interface ModelMeta {
  providerId: string;
  modelId: string;
  capabilities: TaskType[];
  cost: number;
  speed: number;
  quality: number;
}

// Comprehensive model database with relative scores
const MODEL_DB: ModelMeta[] = [
  // Lovable AI - Scripts
  { providerId: 'lovable-ai', modelId: 'google/gemini-3-flash-preview', capabilities: ['script'], cost: 2, speed: 9, quality: 7 },
  { providerId: 'lovable-ai', modelId: 'google/gemini-2.5-pro', capabilities: ['script'], cost: 6, speed: 5, quality: 9 },
  { providerId: 'lovable-ai', modelId: 'google/gemini-2.5-flash', capabilities: ['script'], cost: 2, speed: 8, quality: 7 },
  { providerId: 'lovable-ai', modelId: 'openai/gpt-5', capabilities: ['script'], cost: 8, speed: 4, quality: 10 },
  { providerId: 'lovable-ai', modelId: 'openai/gpt-5-mini', capabilities: ['script'], cost: 3, speed: 8, quality: 7 },
  { providerId: 'lovable-ai', modelId: 'openai/gpt-5-nano', capabilities: ['script'], cost: 1, speed: 10, quality: 5 },
  // Lovable AI - Images
  { providerId: 'lovable-ai', modelId: 'google/gemini-2.5-flash-image', capabilities: ['image'], cost: 2, speed: 8, quality: 6 },
  { providerId: 'lovable-ai', modelId: 'google/gemini-3-pro-image-preview', capabilities: ['image'], cost: 5, speed: 5, quality: 8 },
  // OpenAI Direct
  { providerId: 'openai', modelId: 'dall-e-3', capabilities: ['image'], cost: 7, speed: 5, quality: 9 },
  { providerId: 'openai', modelId: 'gpt-4o', capabilities: ['script'], cost: 7, speed: 6, quality: 9 },
  { providerId: 'openai', modelId: 'tts-1-hd', capabilities: ['tts'], cost: 5, speed: 6, quality: 8 },
  { providerId: 'openai', modelId: 'tts-1', capabilities: ['tts'], cost: 2, speed: 9, quality: 6 },
  // ElevenLabs
  { providerId: 'elevenlabs', modelId: 'eleven_multilingual_v2', capabilities: ['tts'], cost: 6, speed: 5, quality: 10 },
  { providerId: 'elevenlabs', modelId: 'eleven_turbo_v2_5', capabilities: ['tts'], cost: 4, speed: 9, quality: 8 },
  { providerId: 'elevenlabs', modelId: 'eleven_music_v1', capabilities: ['music'], cost: 5, speed: 5, quality: 9 },
  // Anthropic
  { providerId: 'anthropic', modelId: 'claude-sonnet-4-20250514', capabilities: ['script'], cost: 7, speed: 5, quality: 10 },
  { providerId: 'anthropic', modelId: 'claude-3-5-haiku-20241022', capabilities: ['script'], cost: 2, speed: 9, quality: 7 },
  // Stability
  { providerId: 'stability', modelId: 'sd3-large', capabilities: ['image'], cost: 5, speed: 4, quality: 9 },
  { providerId: 'stability', modelId: 'sd3-medium', capabilities: ['image'], cost: 3, speed: 7, quality: 7 },
  // Replicate
  { providerId: 'replicate', modelId: 'black-forest-labs/flux-1.1-pro', capabilities: ['image'], cost: 4, speed: 5, quality: 9 },
  { providerId: 'replicate', modelId: 'black-forest-labs/flux-schnell', capabilities: ['image'], cost: 1, speed: 10, quality: 6 },
  { providerId: 'replicate', modelId: 'meta/musicgen', capabilities: ['music'], cost: 3, speed: 6, quality: 7 },
  // Perplexity
  { providerId: 'perplexity', modelId: 'sonar-pro', capabilities: ['research'], cost: 5, speed: 6, quality: 9 },
  { providerId: 'perplexity', modelId: 'sonar', capabilities: ['research'], cost: 2, speed: 9, quality: 7 },
  // fal.ai
  { providerId: 'fal', modelId: 'fal-ai/minimax/video-01', capabilities: ['image'], cost: 4, speed: 6, quality: 9 },
  // Local Ollama
  { providerId: 'local-ollama', modelId: 'llama3', capabilities: ['script'], cost: 0, speed: 8, quality: 7 },
  { providerId: 'local-ollama', modelId: 'mistral', capabilities: ['script'], cost: 0, speed: 8, quality: 7 },
  { providerId: 'local-ollama', modelId: 'phi3', capabilities: ['script'], cost: 0, speed: 9, quality: 6 },
  { providerId: 'local-ollama', modelId: 'custom', capabilities: ['script'], cost: 0, speed: 8, quality: 7 },
];

const PRIORITY_WEIGHTS: Record<Priority, { cost: number; speed: number; quality: number }> = {
  speed: { cost: 0.1, speed: 0.7, quality: 0.2 },
  quality: { cost: 0.1, speed: 0.1, quality: 0.8 },
  cost: { cost: 0.7, speed: 0.1, quality: 0.2 },
};

export function routeTask(
  taskType: TaskType,
  priority: Priority,
  connectedProviders: Set<string>, // provider IDs with active API keys
): RouteResult[] {
  // Always include lovable-ai as available
  const available = new Set(connectedProviders);
  available.add('lovable-ai');

  const weights = PRIORITY_WEIGHTS[priority];

  const candidates = MODEL_DB
    .filter(m => m.capabilities.includes(taskType) && available.has(m.providerId))
    .map(m => {
      const provider = API_PROVIDERS.find(p => p.id === m.providerId);
      const model = provider?.models.find(mod => mod.id === m.modelId);
      // For cost, invert: lower cost = higher score
      const costScore = 10 - m.cost;
      const score = (costScore * weights.cost) + (m.speed * weights.speed) + (m.quality * weights.quality);

      return {
        providerId: m.providerId,
        providerName: provider?.name || m.providerId,
        modelId: m.modelId,
        modelName: model?.name || m.modelId,
        tier: model?.tier || 'prototyping',
        estimatedCost: m.cost,
        estimatedSpeed: m.speed,
        estimatedQuality: m.quality,
        score: Math.round(score * 10) / 10,
      };
    })
    .sort((a, b) => b.score - a.score);

  return candidates;
}

export function getBestRoute(
  taskType: TaskType,
  priority: Priority,
  connectedProviders: Set<string>,
): RouteResult | null {
  const routes = routeTask(taskType, priority, connectedProviders);
  return routes[0] || null;
}

// Estimate cost for a full project
export function estimateProjectCost(
  scenesCount: number,
  connectedProviders: Set<string>,
  priority: Priority = 'cost',
): { scripts: RouteResult | null; images: RouteResult | null; tts: RouteResult | null; totalRelativeCost: number } {
  const scripts = getBestRoute('script', priority, connectedProviders);
  const images = getBestRoute('image', priority, connectedProviders);
  const tts = getBestRoute('tts', priority, connectedProviders);

  const totalRelativeCost =
    (scripts?.estimatedCost || 0) * 1 + // 1 script call
    (images?.estimatedCost || 0) * scenesCount +
    (tts?.estimatedCost || 0) * scenesCount;

  return { scripts, images, tts, totalRelativeCost };
}
