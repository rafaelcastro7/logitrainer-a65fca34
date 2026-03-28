import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un agente de IA experto en marketing digital, creación de contenido y estrategia de negocios integrado en LogiTrainer Studio — la plataforma líder de producción de contenido.

## TUS CAPACIDADES (usa tool_calls cuando el usuario lo necesite):
- generate_ebook: Generar ebooks completos con capítulos, ejercicios y código
- generate_ads: Crear variantes de anuncios para cualquier plataforma  
- generate_landing: Crear landing pages completas con HTML
- generate_emails: Crear secuencias de email marketing
- generate_presentation: Crear presentaciones profesionales
- generate_lead_magnet: Crear lead magnets irresistibles
- research_market: Investigar mercado, competencia y tendencias
- optimize_copy: Mejorar y optimizar cualquier texto de marketing
- create_funnel: Diseñar embudos de venta completos
- generate_calendar: Crear calendarios de contenido

## REGLAS:
1. Responde SIEMPRE en el idioma del usuario
2. Sé proactivo: sugiere mejoras y próximos pasos
3. Cuando el usuario pida algo que puedes hacer con una herramienta, úsala
4. Da respuestas accionables con frameworks (AIDA, PAS, HSO, 4U)
5. Incluye datos, ejemplos reales y métricas cuando sea posible
6. Si el usuario pide algo vago, haz preguntas clarificadoras inteligentes
7. Formatea con Markdown: **bold**, listas, \`código\`, bloques de código, > citas
8. Cuando des estrategias, incluye timeline y prioridades`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_content",
      description: "Generate marketing content: ebooks, ads, emails, presentations, landing pages, lead magnets, calendars, or market research",
      parameters: {
        type: "object",
        properties: {
          content_type: {
            type: "string",
            enum: ["ebook", "ads", "landing", "email_sequence", "presentation", "lead_magnet", "calendar", "research"],
          },
          params: {
            type: "object",
            properties: {
              topic: { type: "string" },
              niche: { type: "string" },
              audience: { type: "string" },
              product: { type: "string" },
              platform: { type: "string" },
              framework: { type: "string" },
              language: { type: "string", default: "es" },
            }
          }
        },
        required: ["content_type", "params"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "optimize_copy",
      description: "Optimize and improve marketing copy using proven frameworks",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          goal: { type: "string", enum: ["conversion", "engagement", "clarity", "seo", "emotional"] },
          framework: { type: "string", enum: ["aida", "pas", "hso", "4u", "star"] }
        },
        required: ["text", "goal"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_strategy",
      description: "Analyze and create marketing strategies, funnels, and growth plans",
      parameters: {
        type: "object",
        properties: {
          business_type: { type: "string" },
          current_situation: { type: "string" },
          goals: { type: "string" },
          budget: { type: "string" },
          timeline: { type: "string" }
        },
        required: ["business_type", "goals"]
      }
    }
  }
];

// ── Provider call helpers ──

interface ProviderAttempt {
  name: string;
  call: (messages: any[], stream: boolean) => Promise<Response>;
}

function buildProviders(systemMessages: any[]): ProviderAttempt[] {
  const providers: ProviderAttempt[] = [];
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  // 1) Lovable AI — primary (gemini-3-flash-preview)
  if (LOVABLE_API_KEY) {
    providers.push({
      name: "lovable/gemini-3-flash",
      call: (messages, stream) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [...systemMessages, ...messages],
          tools: TOOLS,
          stream,
        }),
      }),
    });

    // 2) Lovable AI — cheap fallback (flash-lite)
    providers.push({
      name: "lovable/flash-lite",
      call: (messages, stream) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [...systemMessages, ...messages],
          stream,
        }),
      }),
    });

    // 3) Lovable AI — GPT-5-nano (very cheap)
    providers.push({
      name: "lovable/gpt5-nano",
      call: (messages, stream) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-5-nano",
          messages: [...systemMessages, ...messages],
          stream,
        }),
      }),
    });
  }

  // 4) Google AI Studio — free tier (gemini-2.0-flash)
  if (GOOGLE_API_KEY) {
    providers.push({
      name: "google-ai-studio",
      call: async (messages, stream) => {
        // Google AI Studio doesn't support OpenAI-compatible streaming easily,
        // so we do a non-streaming call and wrap it as a fake SSE stream or JSON
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
        const systemText = systemMessages.map(m => m.content).join("\n");
        const userMessages = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemText }] },
            contents: userMessages,
            generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
          }),
        });

        if (!resp.ok) throw new Error(`google-${resp.status}`);

        const data = await resp.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        if (stream) {
          // Convert to SSE format for client compatibility
          const ssePayload = `data: ${JSON.stringify({
            choices: [{ delta: { content }, finish_reason: "stop" }]
          })}\n\ndata: [DONE]\n\n`;
          return new Response(ssePayload, {
            headers: { "Content-Type": "text/event-stream" },
          });
        }

        return new Response(JSON.stringify({
          choices: [{ message: { role: "assistant", content } }]
        }), { headers: { "Content-Type": "application/json" } });
      },
    });
  }

  // 5) OpenAI direct — if user has their own key
  if (OPENAI_API_KEY) {
    providers.push({
      name: "openai-direct",
      call: (messages, stream) => fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [...systemMessages, ...messages],
          stream,
        }),
      }),
    });
  }

  return providers;
}

// Errors that should trigger fallback to next provider
function isRetryableError(status: number): boolean {
  return status === 402 || status === 429 || status === 500 || status === 502 || status === 503;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, stream = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: 'messages' array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemMessages = [{ role: "system", content: SYSTEM_PROMPT }];
    const providers = buildProviders(systemMessages);

    if (providers.length === 0) {
      return new Response(JSON.stringify({
        error: "No AI provider configured. The system requires at least one AI service.",
        code: "NO_PROVIDER",
      }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let lastError: string = "";
    let lastStatus: number = 500;

    for (const provider of providers) {
      try {
        console.log(`[ai-agent] Trying provider: ${provider.name}`);
        const response = await provider.call(messages, stream);

        if (response.ok) {
          console.log(`[ai-agent] ✓ Success with: ${provider.name}`);

          // Add provider info header for transparency in logs
          const headers = new Headers(corsHeaders);
          headers.set("X-AI-Provider", provider.name);

          if (stream) {
            headers.set("Content-Type", "text/event-stream");
            return new Response(response.body, { headers });
          }

          const data = await response.json();
          data._provider = provider.name;
          headers.set("Content-Type", "application/json");
          return new Response(JSON.stringify(data), { headers });
        }

        // Non-OK response — check if retryable
        const status = response.status;
        const errorBody = await response.text().catch(() => "");

        console.warn(`[ai-agent] ✗ ${provider.name} returned ${status}: ${errorBody.slice(0, 200)}`);

        if (isRetryableError(status)) {
          lastError = `${provider.name}: ${status}`;
          lastStatus = status;
          continue; // Try next provider
        }

        // Non-retryable error (400 bad request, 401 auth, etc.)
        return new Response(JSON.stringify({
          error: "The AI service returned an error. Please try again.",
          code: `PROVIDER_ERROR_${status}`,
          _provider: provider.name,
        }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[ai-agent] ✗ ${provider.name} threw: ${msg}`);
        lastError = `${provider.name}: ${msg}`;
        lastStatus = 500;
        continue; // Network error, try next
      }
    }

    // All providers exhausted
    console.error(`[ai-agent] All ${providers.length} providers failed. Last: ${lastError}`);

    const userMessage = lastStatus === 402
      ? "All AI credits are exhausted. Please add funds in Settings > Workspace > Usage, or configure a backup API key."
      : lastStatus === 429
        ? "AI services are temporarily busy. Please wait a moment and try again."
        : "All AI services are temporarily unavailable. Please try again in a few minutes.";

    return new Response(JSON.stringify({
      error: userMessage,
      code: "ALL_PROVIDERS_FAILED",
      details: lastError,
    }), {
      status: lastStatus === 402 ? 402 : lastStatus === 429 ? 429 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[ai-agent] Fatal error:", e);
    return new Response(JSON.stringify({
      error: "An unexpected error occurred. Please try again.",
      code: "INTERNAL_ERROR",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
