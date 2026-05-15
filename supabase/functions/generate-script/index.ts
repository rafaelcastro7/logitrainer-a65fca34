import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation
function sanitizeString(val: unknown, maxLen: number, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, maxLen).replace(/[<>]/g, '');
}

function sanitizeNumber(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    
    // Validate and sanitize inputs
    const topic = sanitizeString(body.topic, 500, '');
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const language = sanitizeString(body.language, 5, 'es');
    const durationTarget = sanitizeNumber(body.durationTarget, 10, 600, 120);
    const scenesCount = sanitizeNumber(body.scenesCount, 1, 20, 5);
    const visualStyle = sanitizeString(body.visualStyle, 200, 'Cinematic, photorealistic, 8k');
    const modelTier = body.modelTier === 'production' ? 'production' : 'prototyping';

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = modelTier === "production"
      ? "google/gemini-2.5-pro"
      : "google/gemini-3-flash-preview";

    const systemPrompt = `You are a professional video director and educational content creator.
You create structured video scripts organized by scenes.
Always respond with valid JSON only, no markdown, no explanation.`;

    const userPrompt = `Create a detailed video structure about "${topic}".

SETTINGS:
- Language: ${language} (write ALL scripts in this language)
- Target duration: ${durationTarget} seconds
- Number of scenes: ${scenesCount}
- Visual style: ${visualStyle}

REQUIREMENTS:
1. Each scene must have: name, script (narration text), image_prompt (detailed visual description in English), duration (seconds)
2. Scripts should be educational, engaging, and natural for voice narration
3. Image prompts must be detailed, consistent in style, and include "${visualStyle}"
4. Distribute the total duration across scenes proportionally
5. Include emoji in scene names for visual identification

Return this exact JSON structure:
{
  "scenes": [
    {
      "name": "🎬 Scene Name",
      "script": "Narration text in ${language}...",
      "image_prompt": "Detailed image description in English...",
      "duration": 8
    }
  ]
}`;

    async function callAI(extraInstruction = ""): Promise<string> {
      const sys = systemPrompt + (extraInstruction ? `\n\n${extraInstruction}` : "");
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) {
        if (r.status === 429) throw new Error("RATE_LIMIT");
        if (r.status === 402) throw new Error("CREDITS");
        const t = await r.text();
        console.error("AI gateway error:", r.status, t);
        throw new Error(`AI gateway error: ${r.status}`);
      }
      const j = await r.json();
      return j.choices?.[0]?.message?.content || "";
    }

    function tryParseJSON(content: string): any | null {
      const tryIt = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
      const candidates: string[] = [];
      const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenced) candidates.push(fenced[1].trim());
      candidates.push(content.trim());
      const a = content.indexOf("{"), b = content.lastIndexOf("}");
      if (a !== -1 && b > a) candidates.push(content.slice(a, b + 1));
      // Repair: value missing OPENING quote but has closing `",` at end of its line
      // e.g. `"script": Con el tiempo, ... agradecerá!",`
      let repaired = content.replace(
        /("(?:script|image_prompt|name)"\s*:\s*)([^"\n\r\[\{][^"\n\r]*")(\s*[,}])/g,
        (_m, key, val, end) => {
          const inner = val.slice(0, -1).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
          return `${key}"${inner}"${end}`;
        },
      );
      candidates.push(repaired);
      const a2 = repaired.indexOf("{"), b2 = repaired.lastIndexOf("}");
      if (a2 !== -1 && b2 > a2) candidates.push(repaired.slice(a2, b2 + 1));
      for (const c of candidates) { const p = tryIt(c); if (p) return p; }
      return null;
    }

    let content = "";
    let parsed: any = null;
    try {
      content = await callAI();
      parsed = tryParseJSON(content);
      if (!parsed) {
        console.warn("First parse failed, retrying with stricter prompt");
        content = await callAI("CRITICAL: Respond with VALID JSON ONLY. Every string value MUST be wrapped in double quotes. No trailing commas. No commentary.");
        parsed = tryParseJSON(content);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "RATE_LIMIT") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg === "CREDITS") {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    if (!parsed) {
      console.error("Failed to parse AI response after retry:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    const usage: any = {};

    return new Response(JSON.stringify({
      scenes: parsed.scenes || [],
      usage: {
        model,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
