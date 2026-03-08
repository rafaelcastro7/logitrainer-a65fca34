import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, language, durationTarget, scenesCount, visualStyle, modelTier } = await req.json();

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
- Language: ${language || "es"} (write ALL scripts in this language)
- Target duration: ${durationTarget || 120} seconds
- Number of scenes: ${scenesCount || 5}
- Visual style: ${visualStyle || "Cinematic, photorealistic, 8k"}

REQUIREMENTS:
1. Each scene must have: name, script (narration text), image_prompt (detailed visual description in English), duration (seconds)
2. Scripts should be educational, engaging, and natural for voice narration
3. Image prompts must be detailed, consistent in style, and include "${visualStyle || "Cinematic, photorealistic, 8k"}"
4. Distribute the total duration across scenes proportionally
5. Include emoji in scene names for visual identification

Return this exact JSON structure:
{
  "scenes": [
    {
      "name": "🎬 Scene Name",
      "script": "Narration text in ${language || "es"}...",
      "image_prompt": "Detailed image description in English...",
      "duration": 8
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    const usage = data.usage || {};

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
