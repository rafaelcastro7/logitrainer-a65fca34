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
            description: "Type of content to generate"
          },
          params: {
            type: "object",
            description: "Parameters specific to the content type",
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
          text: { type: "string", description: "Text to optimize" },
          goal: { type: "string", enum: ["conversion", "engagement", "clarity", "seo", "emotional"], description: "Optimization goal" },
          framework: { type: "string", enum: ["aida", "pas", "hso", "4u", "star"], description: "Framework to apply" }
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, stream = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: TOOLS,
        stream,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("AI gateway error:", status, body);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
