import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { type, model: requestedModel } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "ebook": {
        const { topic, niche, template, chaptersCount, language } = body;
        systemPrompt = `You are a professional ebook writer and digital marketing expert. Generate a complete ebook with ${chaptersCount} chapters. Return valid JSON with this structure: { "title": "string", "chapters": [{ "title": "string", "content": "string (2-3 paragraphs per chapter)" }] }. Write in ${language === 'es' ? 'Spanish' : language === 'pt' ? 'Portuguese' : 'English'}. Niche: ${niche}. Template style: ${template}. Make it actionable, professional, and valuable. Each chapter should be 200-400 words.`;
        userPrompt = `Create an ebook about: ${topic}`;
        break;
      }
      case "landing": {
        const { productName, productDesc, targetAudience, template: landingTemplate } = body;
        systemPrompt = `You are a world-class landing page copywriter and designer. Generate a complete, standalone HTML landing page. The HTML must be self-contained with inline CSS. Include: hero with headline, subheadline, CTA button, benefits section (3-6 benefits with icons using emoji), testimonials (3 fake but realistic), FAQ section, pricing/offer section, final CTA, footer. Use modern design with gradients, shadows, and professional typography. Template style: ${landingTemplate}. Return ONLY valid JSON: { "html": "complete HTML string" }`;
        userPrompt = `Product: ${productName}\nDescription: ${productDesc}\nAudience: ${targetAudience}`;
        break;
      }
      case "ads": {
        const { product, audience, benefit, platform, framework, variantsCount } = body;
        systemPrompt = `You are an expert performance marketer and copywriter. Generate ${variantsCount} ad copy variants. Platform: ${platform}. Framework: ${framework}. Return valid JSON: { "variants": [{ "headline": "string (max 40 chars)", "primary_text": "string (ad body, 2-3 sentences)", "cta": "string (button text)", "hook": "string (attention grabber)", "framework": "${framework}" }] }. Each variant must use a different angle/hook. Make them compelling and conversion-focused.`;
        userPrompt = `Product: ${product}\nAudience: ${audience}\nMain benefit: ${benefit}`;
        break;
      }
      case "presentation": {
        const { topic, presentationType, slidesCount } = body;
        systemPrompt = `You are a presentation design expert. Create ${slidesCount} slides for a ${presentationType} presentation. Return valid JSON: { "slides": [{ "title": "string", "content": "string (2-4 bullet points or short paragraphs)", "notes": "string (speaker notes)", "layout": "string (title|content|quote|stats|cta)" }] }. Make it engaging and professional. Include an intro, body sections, and a closing CTA slide.`;
        userPrompt = `Presentation topic: ${topic}`;
        break;
      }
      case "calendar": {
        const { niche, weeks, contentTypes } = body;
        const totalPosts = weeks * 7;
        systemPrompt = `You are a social media strategist. Generate ${totalPosts} content posts for ${weeks} week(s). Return valid JSON: { "posts": [{ "day": "string (Day 1, Day 2...)", "type": "string (one of: ${contentTypes.join(',')})", "title": "string", "content": "string (the actual post text, 2-4 sentences)", "hashtags": ["string"], "hook": "string (first line hook)", "platform": "string (Instagram|X/Twitter|LinkedIn|Email)" }] }. Mix content types. Make hooks viral and content valuable.`;
        userPrompt = `Niche: ${niche}`;
        break;
      }
      case "email_sequence": {
        const { product, audience, sequenceType, emailsCount } = body;
        systemPrompt = `You are an email marketing expert. Generate a ${sequenceType} email sequence with ${emailsCount} emails. Return valid JSON: { "emails": [{ "subject": "string (compelling subject line)", "preview": "string (preview text)", "body": "string (email body, 3-5 paragraphs)", "cta": "string (call to action)", "day": number (day to send), "notes": "string (strategy note)" }] }. Optimize subject lines for open rate. Each email should build on the previous one.`;
        userPrompt = `Product: ${product}\nAudience: ${audience}`;
        break;
      }
      case "lead_magnet": {
        const { magnetType, niche, audience, problem } = body;
        systemPrompt = `You are an expert lead magnet strategist and copywriter. Create a complete ${magnetType} lead magnet. Return valid JSON: { "title": "string", "hook": "string (compelling headline)", "description": "string (2-3 sentences)", "sections": [{ "title": "string", "content": "string (detailed content)" }], "cta": "string (call to action)", "landingCopy": "string (landing page copy, 3-4 paragraphs)" }. Make it highly valuable, actionable, and irresistible. The lead magnet must solve a real problem and provide quick wins.`;
        userPrompt = `Niche: ${niche}\nAudience: ${audience || 'general'}\nProblem: ${problem || 'not specified'}\nType: ${magnetType}`;
        break;
      }
      case "webinar": {
        const { webinarType, topic, product, price, audience: webinarAudience } = body;
        systemPrompt = `You are a webinar strategy expert who has studied Russell Brunson's Perfect Webinar, Sam Ovens' masterclass format, and top converting webinars. Create a complete ${webinarType} script with slides. Return valid JSON: { "slides": [{ "title": "string", "talking_points": ["string"], "script": "string (what to say word for word, 2-3 paragraphs)", "notes": "string (presenter notes)" }], "summary": "string" }. For perfect_webinar: include The One Thing, 3 Secrets, Stack & Close. For challenge: 5 daily sessions building to offer. Create 8-15 slides. Make it conversion-focused.`;
        userPrompt = `Topic: ${topic}\nProduct: ${product || 'not specified'}\nPrice: ${price || 'not specified'}\nAudience: ${webinarAudience || 'general'}`;
        break;
      }
      case "chat": {
        const { prompt, context } = body;
        systemPrompt = `You are an expert AI marketing assistant for LogiTrainer Studio, a digital marketing platform. You help users with: marketing strategies, content creation, copywriting, SEO, social media, email marketing, ad campaigns, sales funnels, and growth hacking. Be concise, actionable, and practical. Respond in the same language as the user's message.`;
        userPrompt = context ? `Previous conversation:\n${context}\n\nUser: ${prompt}` : prompt;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid content type" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const isChat = type === "chat";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestedModel || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    // For chat, return plain text
    if (isChat) {
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) {
        parsed = JSON.parse(objMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-marketing-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
