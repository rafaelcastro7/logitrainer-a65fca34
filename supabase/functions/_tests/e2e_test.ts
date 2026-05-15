// End-to-end tests for all AI edge functions.
// Run: deno test --allow-net --allow-env supabase/functions/_tests/e2e_test.ts
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
}

const FN_BASE = `${SUPABASE_URL}/functions/v1`;

async function callFn(name: string, body: unknown): Promise<{ status: number; data: any }> {
  const res = await fetch(`${FN_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

// ── 1. generate-script ──────────────────────────────────────────────
Deno.test("E2E: generate-script returns structured scenes", async () => {
  const { status, data } = await callFn("generate-script", {
    topic: "Beneficios de meditar 5 minutos al día",
    scenesCount: 2,
    durationTarget: 40,
    language: "es",
  });
  assertEquals(status, 200, `generate-script failed: ${JSON.stringify(data)}`);
  assert(Array.isArray(data.scenes), "scenes must be an array");
  assert(data.scenes.length >= 1, "must have at least 1 scene");
  for (const s of data.scenes) {
    assert(typeof s.script === "string" && s.script.length > 10, "script too short");
    assert(typeof s.image_prompt === "string" && s.image_prompt.length > 10, "image_prompt too short");
    assert(typeof s.duration === "number" && s.duration > 0, "duration invalid");
  }
});

Deno.test("E2E: generate-script rejects empty topic", async () => {
  const { status, data } = await callFn("generate-script", { topic: "", scenesCount: 1 });
  assertEquals(status, 400);
  assert(typeof data.error === "string");
});

// ── 2. enhance-script ───────────────────────────────────────────────
Deno.test("E2E: enhance-script improves narration", async () => {
  const original = "El café es bueno para empezar el día.";
  const { status, data } = await callFn("enhance-script", {
    script: original,
    action: "improve",
    language: "es",
  });
  assertEquals(status, 200, JSON.stringify(data));
  assert(typeof data.enhanced === "string" && data.enhanced.length > 0, "enhanced empty");
  assertEquals(data.action, "improve");
});

Deno.test("E2E: enhance-script supports dramatic action", async () => {
  const { status, data } = await callFn("enhance-script", {
    script: "La luna brilla en la noche.",
    action: "dramatic",
    language: "es",
  });
  assertEquals(status, 200);
  assert(data.enhanced.length > 0);
});

// ── 3. generate-marketing-content ──────────────────────────────────
Deno.test("E2E: generate-marketing-content (ads/AIDA)", async () => {
  const { status, data } = await callFn("generate-marketing-content", {
    type: "ads",
    topic: "App de productividad para emprendedores",
    platform: "instagram",
    framework: "AIDA",
    language: "es",
  });
  assertEquals(status, 200, JSON.stringify(data));
  assert(Array.isArray(data.variants) && data.variants.length >= 1);
  const v = data.variants[0];
  assert(typeof v.headline === "string" && v.headline.length > 0);
  assert(typeof v.primary_text === "string" && v.primary_text.length > 0);
  assert(typeof v.cta === "string");
});

Deno.test("E2E: generate-marketing-content rejects invalid type", async () => {
  const { status } = await callFn("generate-marketing-content", { type: "not_a_type" });
  assertEquals(status, 400);
});

// ── 4. generate-tts ────────────────────────────────────────────────
Deno.test("E2E: generate-tts returns audio or fallback", async () => {
  const { status, data } = await callFn("generate-tts", {
    text: "Hola, esto es una prueba completa de síntesis de voz.",
    voice: "alloy",
    language: "es",
  });
  assertEquals(status, 200, JSON.stringify(data));
  // Either real audio (audioBase64) or a fallback note
  assert(
    typeof data.audioBase64 === "string" || data.provider === "lovable-ai" || typeof data.message === "string",
    "Expected audioBase64 or fallback provider/message",
  );
});

// ── 5. generate-image ──────────────────────────────────────────────
Deno.test("E2E: generate-image returns image data", async () => {
  const { status, data } = await callFn("generate-image", {
    prompt: "A minimalist sunrise over mountains, vector poster style",
  });
  assertEquals(status, 200, JSON.stringify(data));
  // Function may return imageUrl, imageBase64, or url
  const hasImage =
    typeof data.imageUrl === "string" ||
    typeof data.imageBase64 === "string" ||
    typeof data.url === "string" ||
    typeof data.image === "string";
  assert(hasImage, `Expected image data in response, got keys: ${Object.keys(data).join(",")}`);
});

// ── 6. End-to-end pipeline: script → enhance → image prompt → tts ──
Deno.test("E2E: full pipeline (script → enhance → image → tts)", async () => {
  // Step 1: generate a 1-scene script
  const scriptRes = await callFn("generate-script", {
    topic: "El poder del silencio en la creatividad",
    scenesCount: 1,
    durationTarget: 30,
    language: "es",
  });
  assertEquals(scriptRes.status, 200);
  const scene = scriptRes.data.scenes[0];
  assert(scene?.script, "no script returned");

  // Step 2: enhance the narration
  const enhanceRes = await callFn("enhance-script", {
    script: scene.script,
    action: "dramatic",
    language: "es",
  });
  assertEquals(enhanceRes.status, 200);
  assert(enhanceRes.data.enhanced.length > 0);

  // Step 3: generate the image from the scene's image_prompt
  const imageRes = await callFn("generate-image", { prompt: scene.image_prompt });
  assertEquals(imageRes.status, 200);

  // Step 4: synthesize the enhanced narration
  const ttsRes = await callFn("generate-tts", {
    text: enhanceRes.data.enhanced.slice(0, 200),
    voice: "alloy",
    language: "es",
  });
  assertEquals(ttsRes.status, 200);
});
