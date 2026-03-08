import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitizeString(val: unknown, maxLen: number, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, maxLen);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    
    const script = sanitizeString(body.script, 10000, '');
    if (!script) {
      return new Response(JSON.stringify({ error: "Script is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const allowedActions = ['improve', 'shorten', 'expand', 'rewrite', 'dramatic', 'casual'];
    const action = allowedActions.includes(body.action) ? body.action : 'improve';
    const language = sanitizeString(body.language, 5, 'es');
    const context = sanitizeString(body.context, 500, '');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const actionPrompts: Record<string, string> = {
      improve: `Improve this narration script. Make it more engaging, vivid, and professional while keeping the same meaning and length. Fix any grammar or flow issues.`,
      shorten: `Shorten this narration script to roughly half its current length. Keep the key message but make it punchier and more concise.`,
      expand: `Expand this narration script to roughly double its length. Add more detail, examples, and vivid descriptions while maintaining the same tone.`,
      rewrite: `Completely rewrite this narration script with a fresh perspective. Keep the same topic but use different wording, structure, and approach.`,
      dramatic: `Rewrite this narration script with a dramatic, cinematic tone. Use powerful imagery, rhetorical devices, and build tension.`,
      casual: `Rewrite this narration script in a casual, conversational tone. Make it feel like a friend explaining the topic.`,
    };

    const actionPrompt = actionPrompts[action];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional video script writer. ${actionPrompt}
            
Rules:
- Write in ${language} language
- Return ONLY the enhanced script text, no explanations
- Keep the same language as the input
- The script should be suitable for voice narration
${context ? `- Scene context: ${context}` : ''}`
          },
          { role: "user", content: script },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({
      enhanced,
      action,
      usage: data.usage || {},
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enhance-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
