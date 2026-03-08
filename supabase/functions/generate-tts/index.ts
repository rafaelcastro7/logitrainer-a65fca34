import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voiceName, emotion } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check if ElevenLabs is connected
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (ELEVENLABS_API_KEY) {
      // Use ElevenLabs for high-quality TTS
      const voiceMap: Record<string, string> = {
        'Roger': 'CwhRBWXzGAHq8TQ4Fs17',
        'Sarah': 'EXAVITQu4vr4xnSDxMaL',
        'Laura': 'FGY2WhTYpPnrIDTdsKH5',
        'Charlie': 'IKne3meq5aSn9XLyUdCD',
        'George': 'JBFqnCBsd6RMkjVDRZzb',
        'Liam': 'TX3LPaxmHKxFdv7VOQHJ',
        'Alice': 'Xb7hH8MSUJpSbSDYk0k2',
        'Matilda': 'XrExE9yKIg1WjnnlVkGX',
        'Jessica': 'cgSgspJ2msm6clMCkdW9',
        'Brian': 'nPczCjzI2devNBz1zQrb',
        'Daniel': 'onwK4e9ZLuTAKqWW03F9',
        'Lily': 'pFZP5JQG7iQjIQuC4Bku',
      };

      const voiceId = voiceMap[voiceName || 'Sarah'] || 'EXAVITQu4vr4xnSDxMaL';

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: emotion === 'dramatic' ? 0.3 : emotion === 'calm' ? 0.8 : 0.5,
              similarity_boost: 0.75,
              style: emotion === 'energetic' ? 0.6 : 0.3,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("ElevenLabs error:", response.status, errText);
        throw new Error(`ElevenLabs error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
      const base64Audio = base64Encode(audioBuffer);

      return new Response(JSON.stringify({
        audioBase64: base64Audio,
        provider: "elevenlabs",
        format: "mp3",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: Use Lovable AI TTS (Gemini)
    const geminiVoiceMap: Record<string, string> = {
      'Puck': 'Puck', 'Kore': 'Kore', 'Fenrir': 'Fenrir',
      'Charon': 'Charon', 'Aoede': 'Aoede', 'Leda': 'Leda',
    };

    const voice = geminiVoiceMap[voiceName || 'Kore'] || 'Kore';

    // For Gemini TTS, we use the chat completions API with specific instructions
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are a professional narrator. Read the following text naturally with a ${emotion || 'professional'} tone. Voice: ${voice}.` },
          { role: "user", content: text },
        ],
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
      throw new Error(`TTS error: ${response.status}`);
    }

    // Since Gemini doesn't natively do TTS via this API, return a text-only response
    // indicating the provider limitation
    return new Response(JSON.stringify({
      audioBase64: null,
      provider: "lovable-ai",
      message: "TTS via Lovable AI text model. For high-quality audio, connect ElevenLabs.",
      textContent: text,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
