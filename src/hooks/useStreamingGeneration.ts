import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface StreamingGenerationOptions {
  onStreamChunk?: (fullText: string) => void;
  onComplete?: (parsed: any) => void;
  onError?: (error: string) => void;
}

// User-friendly error messages by code
const ERROR_MESSAGES: Record<string, string> = {
  NO_PROVIDER: '⚙️ El servicio de IA no está configurado. Contacta al administrador.',
  ALL_PROVIDERS_FAILED: '🔄 Todos los servicios de IA están temporalmente ocupados. Intenta en unos segundos.',
  PROVIDER_ERROR_400: '❌ Solicitud inválida. Intenta reformular tu petición.',
  PROVIDER_ERROR_401: '🔐 Error de autenticación con el servicio de IA.',
  INTERNAL_ERROR: '⚠️ Error inesperado. Por favor intenta de nuevo.',
};

function getUserFriendlyError(error: string, status?: number): string {
  // Check for known error codes
  for (const [code, msg] of Object.entries(ERROR_MESSAGES)) {
    if (error.includes(code)) return msg;
  }
  // Check by HTTP status
  if (status === 402) return '💳 Créditos de IA agotados. El sistema está intentando proveedores alternativos...';
  if (status === 429) return '⏳ Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.';
  if (status === 503) return '🔧 Servicios de IA temporalmente no disponibles. Intenta en unos minutos.';
  // Fallback
  if (error.includes('Credits exhausted') || error.includes('add funds')) {
    return '💳 Créditos agotados. Por favor agrega fondos en Settings > Workspace > Usage.';
  }
  if (error.includes('Rate limit') || error.includes('rate limit')) {
    return '⏳ Límite de velocidad alcanzado. Intenta en unos segundos.';
  }
  if (error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')) {
    return '🌐 Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  return `⚠️ ${error}`;
}

export function useStreamingGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (
    body: Record<string, any>,
    options?: StreamingGenerationOptions
  ) => {
    setIsGenerating(true);
    setStreamText('');
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Use streaming via ai-agent for real-time feedback
      const streamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;
      
      // Build the prompt from body params for streaming
      const userPrompt = buildPromptFromBody(body);
      const systemPrompt = buildSystemPromptFromType(body.type, body);

      const resp = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const status = resp.status;
        const err = await resp.json().catch(() => ({ error: `Server error (${status})` }));
        const friendlyMsg = getUserFriendlyError(err.error || '', status);
        toast.error(friendlyMsg, { duration: 6000 });
        throw new Error(friendlyMsg);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let charCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              charCount += content.length;
              // Estimate progress based on expected output size
              const estimatedSize = getEstimatedSize(body.type, body);
              setProgress(Math.min(95, (charCount / estimatedSize) * 100));
              setStreamText(fullContent);
              options?.onStreamChunk?.(fullContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamText(fullContent);
            }
          } catch {}
        }
      }

      setProgress(100);

      // Parse the final JSON from the streamed content
      const parsed = extractJSON(fullContent);
      if (parsed) {
        options?.onComplete?.(parsed);
        return parsed;
      } else {
        // If we can't parse JSON, return the raw text
        options?.onComplete?.({ rawContent: fullContent });
        return { rawContent: fullContent };
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.info('⏹️ Generación detenida');
        return null;
      }
      const msg = getUserFriendlyError(e.message || 'Generation failed');
      options?.onError?.(msg);
      throw e;
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return { generate, stop, isGenerating, streamText, progress };
}

function extractJSON(text: string): any {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  // Try raw JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  return null;
}

function getEstimatedSize(type: string, body: any): number {
  switch (type) {
    case 'ebook': return (body.chaptersCount || 8) * 3000;
    case 'ads': return (body.variantsCount || 4) * 800;
    case 'email_sequence': return (body.emailsCount || 5) * 1500;
    case 'presentation': return (body.slidesCount || 10) * 600;
    case 'landing': return 8000;
    case 'calendar': return (body.weeks || 2) * 7 * 300;
    case 'lead_magnet': return 4000;
    case 'research': return 5000;
    default: return 5000;
  }
}

function buildSystemPromptFromType(type: string, body: any): string {
  const prompts: Record<string, string> = {
    ebook: buildEbookSystemPrompt(body),
    ads: buildAdsSystemPrompt(body),
    email_sequence: buildEmailSystemPrompt(body),
    presentation: buildPresentationSystemPrompt(body),
    landing: buildLandingSystemPrompt(body),
    calendar: buildCalendarSystemPrompt(body),
    lead_magnet: buildLeadMagnetSystemPrompt(body),
    research: buildResearchSystemPrompt(body),
  };
  return prompts[type] || 'You are an expert marketing content generator. Return valid JSON.';
}

function buildPromptFromBody(body: any): string {
  const parts: string[] = [];
  if (body.topic) parts.push(`Topic: ${body.topic}`);
  if (body.product) parts.push(`Product: ${body.product}`);
  if (body.productName) parts.push(`Product: ${body.productName}`);
  if (body.audience) parts.push(`Audience: ${body.audience}`);
  if (body.targetAudience) parts.push(`Audience: ${body.targetAudience}`);
  if (body.niche) parts.push(`Niche: ${body.niche}`);
  if (body.benefit) parts.push(`Main benefit: ${body.benefit}`);
  if (body.productDesc) parts.push(`Description: ${body.productDesc}`);
  if (body.platform) parts.push(`Platform: ${body.platform}`);
  if (body.query) parts.push(`Query: ${body.query}`);
  if (body.problem) parts.push(`Problem: ${body.problem}`);
  return parts.join('\n') || 'Generate professional marketing content';
}

// ── System prompts per type ──

function buildEbookSystemPrompt(body: any): string {
  const { chaptersCount = 8, language = 'es', detailLevel = 'detailed', template = 'guia' } = body;
  const langMap: Record<string, string> = { es: 'Spanish', en: 'English', pt: 'Portuguese' };
  const lang = langMap[language] || 'Spanish';
  const detail = detailLevel === 'extensive' ? '800-1200' : detailLevel === 'detailed' ? '500-800' : '300-500';

  const templateInstructions: Record<string, string> = {
    guia: 'Write as a practical step-by-step guide with numbered steps, real-world examples, pro tips, and exercises.',
    curso: 'Structure as an educational course with learning objectives, detailed explanations, case studies, and homework.',
    tecnico: 'Write as a TECHNICAL GUIDE with code examples in markdown code blocks, APIs, configuration, and troubleshooting.',
    playbook: 'Write as a marketing PLAYBOOK with frameworks, templates, swipe files, ROI calculators, and campaign blueprints.',
    workbook: 'Write as an interactive WORKBOOK with reflection questions, exercises, quizzes, and planning templates.',
    checklist: 'Format as actionable checklists with detailed explanations, templates, and quick-win tips.',
    storytelling: 'Write with compelling narrative, dialogue, case studies, and actionable insights.',
  };

  return `You are a world-class author. Generate a comprehensive ebook with ${chaptersCount} chapters.
RULES:
- Each chapter: ${detail} words minimum, FULL content
- Use markdown: ## sections, **bold**, \`code\`, \`\`\`language blocks, > callouts, lists
- Include REAL examples, data, and actionable content
- ${templateInstructions[template] || templateInstructions.guia}
- Write in ${lang}. Niche: ${body.niche || 'general'}.
Return valid JSON: { "title": "string", "subtitle": "string", "chapters": [{ "title": "string", "content": "string (${detail} words min)", "keyTakeaways": ["string"], "exercises": ["string"] }] }`;
}

function buildAdsSystemPrompt(body: any): string {
  const { platform = 'facebook', framework = 'aida', variantsCount = 4 } = body;
  return `You are an elite performance marketer. Generate ${variantsCount} ad variants for ${platform} using ${framework} framework.
Return valid JSON: { "variants": [{ "headline": "string (max 40 chars)", "primary_text": "string (4-6 sentences with line breaks)", "cta": "string", "hook": "string (scroll-stopping first line)", "framework": "${framework}", "targeting_notes": "string", "creative_notes": "string" }] }
Each variant uses a different psychological angle. Include specific numbers and proof points.`;
}

function buildEmailSystemPrompt(body: any): string {
  const { sequenceType = 'welcome', emailsCount = 5 } = body;
  return `You are an email marketing expert. Generate a ${sequenceType} sequence with ${emailsCount} emails.
Return valid JSON: { "emails": [{ "subject": "string (A/B test worthy)", "preview": "string", "body": "string (markdown: 5-8 paragraphs, **bold**, bullets, P.S. lines)", "cta": "string", "day": number, "notes": "string (strategy notes)" }] }
Use frameworks: PAS, AIDA, Storytelling. Each email builds on the previous.`;
}

function buildPresentationSystemPrompt(body: any): string {
  const { presentationType = 'pitch', slidesCount = 10 } = body;
  return `Create ${slidesCount} slides for a ${presentationType} presentation.
Return valid JSON: { "slides": [{ "title": "string", "content": "string (4-6 bullets with data)", "notes": "string (speaker notes)", "layout": "string (title|content|quote|stats|cta)" }] }`;
}

function buildLandingSystemPrompt(body: any): string {
  return `Generate a complete standalone HTML landing page with inline CSS. Include: hero, benefits (3-6), testimonials (3), FAQ, pricing, CTA, footer. Modern design with gradients.
Return valid JSON: { "html": "complete HTML string" }`;
}

function buildCalendarSystemPrompt(body: any): string {
  const { weeks = 2, contentTypes = ['post', 'story', 'reel'] } = body;
  return `Generate ${weeks * 7} content posts for ${weeks} week(s).
Return valid JSON: { "posts": [{ "day": "string", "type": "string (${contentTypes.join(',')})", "title": "string", "content": "string (2-4 sentences)", "hashtags": ["string"], "hook": "string", "platform": "string" }] }`;
}

function buildLeadMagnetSystemPrompt(body: any): string {
  const { magnetType = 'checklist' } = body;
  return `Create a complete ${magnetType} lead magnet.
Return valid JSON: { "title": "string", "hook": "string", "description": "string", "sections": [{ "title": "string", "content": "string" }], "cta": "string", "landingCopy": "string" }`;
}

function buildResearchSystemPrompt(body: any): string {
  const { researchType = 'strategy' } = body;
  const types: Record<string, string> = {
    competitor: 'Analyze competitors: strengths, weaknesses, pricing, positioning.',
    trend: 'Identify current/emerging trends with data points and predictions.',
    audience: 'Create detailed audience profiles with demographics, psychographics, pain points.',
    keywords: 'Research keywords/SEO: volume, competition, long-tail, content gaps.',
    strategy: 'Create comprehensive marketing strategy with channels, content plan, 90-day action plan.',
  };
  return `${types[researchType] || types.strategy}
Return valid JSON: { "summary": "string (3-5 paragraphs)", "findings": [{ "title": "string", "detail": "string", "impact": "string" }], "recommendations": ["string"], "actionPlan": "string" }. Write in Spanish.`;
}
