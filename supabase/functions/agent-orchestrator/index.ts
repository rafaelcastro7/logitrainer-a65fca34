import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Agent Definitions ──

interface AgentDef {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

const AGENTS: Record<string, AgentDef> = {
  orchestrator: {
    id: "orchestrator",
    name: "🎯 Orchestrator",
    role: "Manager & Task Decomposer",
    systemPrompt: `You are the ORCHESTRATOR agent — a senior project manager for content creation. Your job is to:
1. Analyze the user's request and decompose it into specific sub-tasks
2. Assign each sub-task to the appropriate specialist agent
3. Review the combined output for quality and coherence
4. Ensure all deliverables meet premium quality standards

You MUST respond with a JSON execution plan:
{
  "plan": [
    { "agent": "researcher|writer|editor|strategist|designer", "task": "specific task description", "priority": 1-5, "depends_on": [] }
  ],
  "summary": "Brief description of the overall approach"
}

Rules:
- Break complex requests into 2-5 focused sub-tasks
- Always include a quality review step at the end
- Prefer parallel execution when tasks don't depend on each other
- Be specific about what each agent should produce`,
    model: "google/gemini-3-flash-preview",
    temperature: 0.3,
    maxTokens: 2000,
  },

  researcher: {
    id: "researcher",
    name: "🔍 Researcher",
    role: "Market Intelligence & Data Gathering",
    systemPrompt: `You are the RESEARCHER agent — a senior market analyst. Your specialties:
- Competitive analysis with real companies, products, and pricing
- Industry trends with specific data points and statistics
- Audience profiling with psychographic and behavioral insights
- Best practices with cited frameworks and methodologies
- SEO and keyword research with search volume estimates

Rules:
- Always include SPECIFIC numbers, percentages, and data points
- Reference REAL companies, tools, and industry leaders
- Provide sourced insights (even if general industry knowledge)
- Structure findings with clear headers and actionable takeaways
- Write in the user's language (default: Spanish)
- Format with rich Markdown: tables, bold, lists, blockquotes`,
    model: "google/gemini-3-flash-preview",
    temperature: 0.4,
    maxTokens: 4000,
  },

  writer: {
    id: "writer",
    name: "✍️ Writer",
    role: "Content Creation Specialist",
    systemPrompt: `You are the WRITER agent — a bestselling author and world-class copywriter who has studied:
- Russell Brunson (DotCom Secrets, Expert Secrets)
- Alex Hormozi ($100M Offers, $100M Leads)
- Frank Kern (4-Day Cash Machine)
- Gary Halbert (The Boron Letters)
- Eugene Schwartz (Breakthrough Advertising)

Your writing is:
- Rich with specific examples, case studies, and data
- Emotionally compelling with storytelling techniques
- Structured with proven frameworks (AIDA, PAS, HSO, 4U, BAB)
- Formatted beautifully with Markdown (bold, tables, code blocks, callouts)
- NEVER generic — every sentence adds value

Rules:
- Minimum 300 words per section/chapter
- Include "Pro Tips" in > blockquotes
- Use specific numbers: "$47,000 in revenue", "327% increase", "in just 14 days"
- Add tables for comparisons, checklists for action items
- Write in the user's language (default: Spanish)`,
    model: "google/gemini-3-flash-preview",
    temperature: 0.7,
    maxTokens: 8000,
  },

  editor: {
    id: "editor",
    name: "📝 Editor",
    role: "Quality Reviewer & Enhancer",
    systemPrompt: `You are the EDITOR agent — a premium content quality reviewer. Your job:
1. Review content for quality, accuracy, and completeness
2. Enhance weak sections with more specific examples and data
3. Fix formatting issues and improve Markdown structure
4. Ensure consistent tone and voice throughout
5. Add missing elements: CTAs, transitions, proof points
6. Check that content is NEVER generic or filler

Quality Checklist:
- ✅ Specific numbers and data points (not "many" or "significant")
- ✅ Real examples with company names and results
- ✅ Actionable advice (not "consider doing X" but "Do X by following these steps")
- ✅ Rich formatting: **bold**, tables, > callouts, \`code\`, lists
- ✅ Emotional hooks and compelling transitions
- ✅ Zero placeholder text or "[insert here]" markers

Output the IMPROVED version directly — don't explain changes, just deliver better content.`,
    model: "google/gemini-3-flash-preview",
    temperature: 0.3,
    maxTokens: 8000,
  },

  strategist: {
    id: "strategist",
    name: "🧠 Strategist",
    role: "Marketing Strategy & Frameworks",
    systemPrompt: `You are the STRATEGIST agent — a CMO-level marketing strategist who has driven $100M+ in revenue. You design:
- Go-to-market strategies with specific channel allocation
- Conversion funnels with benchmarked metrics
- Email sequences using proven frameworks (PLF, Cash Machine, Soap Opera)
- Ad strategies with platform-specific optimization
- Content calendars with strategic content pillars
- Pricing and offer design using "Grand Slam Offer" principles

Rules:
- Every strategy must include specific KPIs and benchmarks
- Include budget allocation percentages
- Provide 30/60/90-day implementation timelines
- Reference specific tools and platforms
- Include risk mitigation and contingency plans
- Write in the user's language (default: Spanish)`,
    model: "google/gemini-3-flash-preview",
    temperature: 0.5,
    maxTokens: 6000,
  },

  designer: {
    id: "designer",
    name: "🎨 Designer",
    role: "Visual & UX Direction",
    systemPrompt: `You are the DESIGNER agent — a senior creative director specializing in conversion-optimized design. You provide:
- Color palette recommendations with hex codes and psychology
- Layout wireframes described in detail
- Typography pairing suggestions
- Visual hierarchy recommendations
- UI/UX patterns for maximum conversion
- Platform-specific creative specs

Rules:
- Always include specific hex color codes
- Reference design trends and successful examples
- Provide mobile-first responsive recommendations
- Include A/B testing suggestions for creative variations
- Describe layouts in enough detail to implement
- Write in the user's language (default: Spanish)`,
    model: "google/gemini-2.5-flash-lite",
    temperature: 0.6,
    maxTokens: 4000,
  },
};

// ── AI Gateway Call ──

async function callAgent(
  agent: AgentDef,
  messages: Array<{ role: string; content: string }>,
  stream: boolean,
  apiKey: string
): Promise<Response> {
  const body: any = {
    model: agent.model,
    messages: [
      { role: "system", content: agent.systemPrompt },
      ...messages,
    ],
    temperature: agent.temperature,
    stream,
  };

  if (agent.maxTokens) {
    body.max_tokens = agent.maxTokens;
  }

  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function isRetryableError(status: number): boolean {
  return status === 402 || status === 429 || status === 500 || status === 502 || status === 503;
}

// Fallback models for when primary fails
const FALLBACK_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5-nano",
];

async function callAgentWithFallback(
  agent: AgentDef,
  messages: Array<{ role: string; content: string }>,
  stream: boolean,
  apiKey: string
): Promise<Response> {
  // Try primary model
  try {
    const resp = await callAgent(agent, messages, stream, apiKey);
    if (resp.ok) return resp;
    if (!isRetryableError(resp.status)) return resp;
    console.warn(`[orchestrator] Agent ${agent.id} primary model failed: ${resp.status}`);
  } catch (e) {
    console.warn(`[orchestrator] Agent ${agent.id} primary threw:`, e);
  }

  // Try fallback models
  for (const model of FALLBACK_MODELS) {
    if (model === agent.model) continue;
    try {
      const fallbackAgent = { ...agent, model };
      const resp = await callAgent(fallbackAgent, messages, stream, apiKey);
      if (resp.ok) {
        console.log(`[orchestrator] Agent ${agent.id} succeeded with fallback: ${model}`);
        return resp;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error(`All models failed for agent ${agent.id}`);
}

// ── Orchestration Modes ──

// Mode 1: Simple — single agent with enhanced prompt
async function executeSimple(
  agentId: string,
  messages: any[],
  stream: boolean,
  apiKey: string
): Promise<Response> {
  const agent = AGENTS[agentId] || AGENTS.writer;
  return callAgentWithFallback(agent, messages, stream, apiKey);
}

// Mode 2: Pipeline — sequential agent chain with context accumulation
async function executePipeline(
  pipeline: string[],
  messages: any[],
  apiKey: string
): Promise<Response> {
  let accumulatedContext = "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < pipeline.length; i++) {
          const agentId = pipeline[i];
          const agent = AGENTS[agentId];
          if (!agent) continue;

          // Send agent status event
          const statusEvent = `data: ${JSON.stringify({
            choices: [{ delta: { content: `\n\n---\n### ${agent.name} — ${agent.role}\n_Procesando paso ${i + 1}/${pipeline.length}..._\n\n` } }]
          })}\n\n`;
          controller.enqueue(encoder.encode(statusEvent));

          // Build messages with accumulated context
          const agentMessages = [
            ...messages,
            ...(accumulatedContext ? [{ role: "assistant", content: `Contexto previo de otros agentes:\n${accumulatedContext}` }, { role: "user", content: "Continúa con tu parte basándote en el contexto anterior. Mejora y expande el contenido." }] : []),
          ];

          const resp = await callAgentWithFallback(agent, agentMessages, true, apiKey);
          if (!resp.ok || !resp.body) {
            const errEvent = `data: ${JSON.stringify({
              choices: [{ delta: { content: `\n> ⚠️ Agente ${agent.name} no disponible, continuando...\n` } }]
            })}\n\n`;
            controller.enqueue(encoder.encode(errEvent));
            continue;
          }

          // Stream the agent's response and accumulate
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let agentContent = "";
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, nl);
              buffer = buffer.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (json === "[DONE]") break;
              try {
                const parsed = JSON.parse(json);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  agentContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
                }
              } catch {}
            }
          }

          accumulatedContext += `\n\n### Output de ${agent.name}:\n${agentContent}`;
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Pipeline error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n> ❌ Error: ${errMsg}` } }] })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// Mode 3: Full orchestration — orchestrator plans, then executes agents
async function executeOrchestrated(
  task: string,
  messages: any[],
  apiKey: string
): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Orchestrator creates execution plan
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: "## 🎯 Orchestrator — Planificando ejecución...\n\n" } }]
        })}\n\n`));

        // Determine which agents to use based on task type
        const agentPlan = determineAgentPlan(task);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: `**Plan de ejecución:**\n${agentPlan.map((a, i) => `${i + 1}. ${AGENTS[a]?.name || a} — ${AGENTS[a]?.role || ''}`).join('\n')}\n\n---\n\n` } }]
        })}\n\n`));

        // Step 2: Execute each agent in sequence
        let accumulatedContext = "";

        for (let i = 0; i < agentPlan.length; i++) {
          const agentId = agentPlan[i];
          const agent = AGENTS[agentId];
          if (!agent) continue;

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: `\n### ${agent.name} — Paso ${i + 1}/${agentPlan.length}\n\n` } }]
          })}\n\n`));

          const agentMessages = [
            ...messages,
            ...(accumulatedContext ? [{
              role: "user" as const,
              content: `Contexto de agentes previos:\n${accumulatedContext}\n\nTu tarea: ${task}\n\nGenera tu contribución mejorando y expandiendo lo anterior.`
            }] : []),
          ];

          try {
            const resp = await callAgentWithFallback(agent, agentMessages, true, apiKey);
            if (!resp.ok || !resp.body) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                choices: [{ delta: { content: `> ⚠️ ${agent.name} no disponible, continuando...\n\n` } }]
              })}\n\n`));
              continue;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let agentContent = "";
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              let nl: number;
              while ((nl = buffer.indexOf("\n")) !== -1) {
                let line = buffer.slice(0, nl);
                buffer = buffer.slice(nl + 1);
                if (line.endsWith("\r")) line = line.slice(0, -1);
                if (!line.startsWith("data: ")) continue;
                const json = line.slice(6).trim();
                if (json === "[DONE]") break;
                try {
                  const parsed = JSON.parse(json);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    agentContent += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
                  }
                } catch {}
              }
            }

            accumulatedContext += `\n### ${agent.name}:\n${agentContent}\n`;
          } catch (e) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { content: `> ⚠️ Error en ${agent.name}: ${e instanceof Error ? e.message : 'Unknown'}\n\n` } }]
            })}\n\n`));
          }
        }

        // Final summary
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: "\n\n---\n✅ **Todos los agentes han completado su trabajo.**\n" } }]
        })}\n\n`));

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: `\n❌ Error de orquestación: ${e instanceof Error ? e.message : 'Unknown'}` } }]
        })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// Determine which agents to use based on task keywords
function determineAgentPlan(task: string): string[] {
  const lower = task.toLowerCase();

  // Content creation tasks
  if (lower.includes("ebook") || lower.includes("libro") || lower.includes("curso") || lower.includes("guía")) {
    return ["researcher", "writer", "editor"];
  }
  if (lower.includes("anuncio") || lower.includes("ad") || lower.includes("publicidad")) {
    return ["strategist", "writer", "editor"];
  }
  if (lower.includes("email") || lower.includes("secuencia") || lower.includes("correo")) {
    return ["strategist", "writer", "editor"];
  }
  if (lower.includes("landing") || lower.includes("página")) {
    return ["strategist", "designer", "writer"];
  }
  if (lower.includes("presentación") || lower.includes("slides") || lower.includes("pitch")) {
    return ["researcher", "strategist", "writer"];
  }
  if (lower.includes("funnel") || lower.includes("embudo")) {
    return ["strategist", "writer", "designer"];
  }
  if (lower.includes("investigar") || lower.includes("research") || lower.includes("analizar")) {
    return ["researcher", "strategist"];
  }
  if (lower.includes("estrategia") || lower.includes("plan") || lower.includes("strategy")) {
    return ["researcher", "strategist", "writer"];
  }
  if (lower.includes("diseñ") || lower.includes("visual") || lower.includes("brand")) {
    return ["designer", "strategist"];
  }
  if (lower.includes("lead magnet") || lower.includes("imán")) {
    return ["strategist", "writer", "editor"];
  }
  if (lower.includes("vsl") || lower.includes("video") || lower.includes("script")) {
    return ["strategist", "writer", "editor"];
  }
  if (lower.includes("calendario") || lower.includes("calendar") || lower.includes("contenido")) {
    return ["strategist", "writer"];
  }

  // Default: researcher + writer + editor
  return ["researcher", "writer", "editor"];
}

// ── Main Server ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, mode = "orchestrated", agent, pipeline, stream = true } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: 'messages' array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "NO_PROVIDER" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the last user message for task analysis
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";

    switch (mode) {
      case "simple":
        // Single agent call
        const simpleResp = await executeSimple(agent || "writer", messages, stream, apiKey);
        if (stream) {
          return new Response(simpleResp.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-Agent-Mode": "simple", "X-Agent-Id": agent || "writer" },
          });
        }
        const simpleData = await simpleResp.json();
        return new Response(JSON.stringify(simpleData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case "pipeline":
        // Sequential agent chain
        return executePipeline(pipeline || ["researcher", "writer", "editor"], messages, apiKey);

      case "orchestrated":
      default:
        // Full orchestration
        return executeOrchestrated(lastUserMsg, messages, apiKey);
    }

  } catch (e) {
    console.error("[agent-orchestrator] Fatal:", e);
    return new Response(JSON.stringify({
      error: "Orchestration error. Please try again.",
      code: "INTERNAL_ERROR",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
