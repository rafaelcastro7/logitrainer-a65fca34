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
    
    const prompt = sanitizeString(body.prompt, 2000, '');
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const modelTier = body.modelTier === 'production' ? 'production' : 'prototyping';
    const provider = sanitizeString(body.provider, 20, '');
    const userApiKey = typeof body.userApiKey === 'string' ? body.userApiKey.slice(0, 200) : '';

    // Validate provider is in allowed list
    const allowedProviders = ['', 'openai', 'stability', 'replicate', 'fal'];
    if (!allowedProviders.includes(provider)) {
      return new Response(JSON.stringify({ error: "Invalid provider" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== OpenAI DALL·E =====
    if (provider === 'openai' && userApiKey) {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `${prompt}. Cinematic, detailed, visually stunning. Landscape 16:9.`,
          n: 1,
          size: "1792x1024",
          quality: modelTier === 'production' ? 'hd' : 'standard',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI image error:", response.status, errText);
        throw new Error(`OpenAI image error: ${response.status}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify({
        imageUrl: data.data?.[0]?.url,
        usage: { model: 'dall-e-3', prompt_tokens: 0, completion_tokens: 0 },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Stability AI =====
    if (provider === 'stability' && userApiKey) {
      const model = modelTier === 'production' ? 'sd3-large' : 'sd3-medium';
      const response = await fetch(`https://api.stability.ai/v2beta/stable-image/generate/sd3`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userApiKey}`,
          "Accept": "application/json",
        },
        body: (() => {
          const fd = new FormData();
          fd.append("prompt", `${prompt}. Cinematic, detailed, visually stunning.`);
          fd.append("model", model);
          fd.append("aspect_ratio", "16:9");
          fd.append("output_format", "png");
          return fd;
        })(),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Stability error:", response.status, errText);
        throw new Error(`Stability AI error: ${response.status}`);
      }

      const data = await response.json();
      const base64Image = data.image;
      const imageUrl = `data:image/png;base64,${base64Image}`;

      return new Response(JSON.stringify({
        imageUrl,
        usage: { model, prompt_tokens: 0, completion_tokens: 0 },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Replicate (Flux) =====
    if (provider === 'replicate' && userApiKey) {
      const modelVersion = modelTier === 'production'
        ? 'black-forest-labs/flux-1.1-pro'
        : 'black-forest-labs/flux-schnell';

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelVersion,
          input: {
            prompt: `${prompt}. Cinematic, detailed, visually stunning. Landscape 16:9.`,
            aspect_ratio: "16:9",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Replicate error:", response.status, errText);
        throw new Error(`Replicate error: ${response.status}`);
      }

      let prediction = await response.json();

      // Poll for completion with timeout
      let attempts = 0;
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 60) {
        await new Promise(r => setTimeout(r, 2000));
        const pollResp = await fetch(prediction.urls.get, {
          headers: { "Authorization": `Bearer ${userApiKey}` },
        });
        prediction = await pollResp.json();
        attempts++;
      }

      if (prediction.status === 'failed') {
        throw new Error('Replicate prediction failed');
      }

      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

      return new Response(JSON.stringify({
        imageUrl,
        usage: { model: modelVersion, prompt_tokens: 0, completion_tokens: 0 },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== fal.ai =====
    if (provider === 'fal' && userApiKey) {
      const response = await fetch("https://queue.fal.run/fal-ai/flux-pro/v1.1", {
        method: "POST",
        headers: {
          "Authorization": `Key ${userApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${prompt}. Cinematic, detailed, visually stunning.`,
          image_size: "landscape_16_9",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("fal.ai error:", response.status, errText);
        throw new Error(`fal.ai error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.request_id) {
        let attempts = 0;
        while (attempts < 60) {
          await new Promise(r => setTimeout(r, 2000));
          const statusResp = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${data.request_id}/status`, {
            headers: { "Authorization": `Key ${userApiKey}` },
          });
          const statusData = await statusResp.json();
          if (statusData.status === 'COMPLETED') {
            const resultResp = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${data.request_id}`, {
              headers: { "Authorization": `Key ${userApiKey}` },
            });
            const resultData = await resultResp.json();
            return new Response(JSON.stringify({
              imageUrl: resultData.images?.[0]?.url,
              usage: { model: 'flux-pro-v1.1', prompt_tokens: 0, completion_tokens: 0 },
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (statusData.status === 'FAILED') throw new Error('fal.ai generation failed');
          attempts++;
        }
        throw new Error('fal.ai timeout');
      }

      return new Response(JSON.stringify({
        imageUrl: data.images?.[0]?.url,
        usage: { model: 'flux-pro-v1.1', prompt_tokens: 0, completion_tokens: 0 },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Default: Lovable AI (Gemini) =====
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = modelTier === "production"
      ? "google/gemini-3-pro-image-preview"
      : "google/gemini-2.5-flash-image";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "user", content: `Generate a high quality image: ${prompt}. Make it cinematic, detailed, and visually stunning. Landscape orientation 16:9.` },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Image generation error:", status, text);
      throw new Error(`Image generation error: ${status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(JSON.stringify({
      imageUrl,
      usage: {
        model,
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
