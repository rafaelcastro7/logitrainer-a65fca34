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
        const { topic, niche, template, chaptersCount, language, detailLevel } = body;
        const langMap: Record<string, string> = { es: 'Spanish', en: 'English', pt: 'Portuguese' };
        const lang = langMap[language] || 'Spanish';
        
        const templateInstructions: Record<string, string> = {
          guia: 'Write as a practical step-by-step guide. Each chapter must include: numbered steps, real-world examples, pro tips in callout boxes, and a practical exercise at the end.',
          curso: 'Structure as an educational course. Each chapter is a lesson with: learning objectives, detailed explanations, examples, case studies, key takeaways, and homework/exercises.',
          checklist: 'Format as actionable checklists. Each chapter includes: numbered action items with detailed explanations, templates to copy-paste, and quick-win tips.',
          storytelling: 'Write with compelling narrative. Each chapter tells a story that teaches a lesson, includes dialogue, real or realistic case studies, and actionable insights.',
          tecnico: 'Write as a TECHNICAL GUIDE. Each chapter MUST include: detailed code examples in markdown code blocks (```language), step-by-step implementation instructions, configuration snippets, API usage examples, troubleshooting tips, and best practices. Code must be real, functional, and copy-pasteable.',
          playbook: 'Write as a marketing PLAYBOOK. Include: proven frameworks with fill-in templates, real metrics and benchmarks, swipe files (email templates, ad copy, headlines), ROI calculators, and campaign blueprints.',
          workbook: 'Write as an interactive WORKBOOK. Each chapter includes: reflection questions, fill-in-the-blank exercises, self-assessment quizzes, planning templates, and action plan worksheets.',
        };

        const detail = detailLevel === 'extensive' ? '800-1200' : detailLevel === 'detailed' ? '500-800' : '300-500';
        
        systemPrompt = `You are a world-class author and subject matter expert. Generate a comprehensive, professional ebook with ${chaptersCount} chapters. 

CRITICAL RULES:
- Each chapter MUST be ${detail} words minimum — NOT a summary, a FULL chapter
- Use **markdown formatting**: ## for sections, **bold** for key terms, \`code\` for inline code, \`\`\`language for code blocks, > for callouts, - for bullet lists, 1. for numbered lists
- Include REAL examples, not generic placeholder text
- ${templateInstructions[template] || templateInstructions.guia}

Return valid JSON: { "title": "string", "subtitle": "string", "chapters": [{ "title": "string", "content": "string (FULL chapter content in markdown, ${detail} words minimum)", "keyTakeaways": ["string (3-5 key takeaways)"], "exercises": ["string (1-3 practical exercises)"] }] }

Write entirely in ${lang}. Niche: ${niche}. Be specific, data-driven, and immediately actionable. Never use filler content.`;
        userPrompt = `Create a comprehensive ebook about: ${topic}`;
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
        systemPrompt = `You are an elite performance marketer who has managed $50M+ in ad spend. Generate ${variantsCount} ad copy variants. Platform: ${platform}. Framework: ${framework}.

Return valid JSON: { "variants": [{ "headline": "string (max 40 chars, attention-grabbing)", "primary_text": "string (ad body: hook + story/proof + CTA, 4-6 sentences minimum, use line breaks for readability)", "cta": "string (button text)", "hook": "string (scroll-stopping first line)", "framework": "${framework}", "targeting_notes": "string (suggested audience targeting)", "creative_notes": "string (suggested visual/creative direction)" }] }.

Each variant must use a completely different psychological angle (fear, aspiration, social proof, curiosity, urgency, authority). Include specific numbers, results, and proof points. Make hooks that STOP the scroll.`;
        userPrompt = `Product: ${product}\nAudience: ${audience}\nMain benefit: ${benefit}`;
        break;
      }
      case "presentation": {
        const { topic, presentationType, slidesCount } = body;
        systemPrompt = `You are a presentation strategist who has created decks for TED talks and Fortune 500 pitches. Create ${slidesCount} slides for a ${presentationType} presentation.

Return valid JSON: { "slides": [{ "title": "string (compelling, not generic)", "content": "string (detailed content: 4-6 bullet points with supporting data, examples, or talking points. Use markdown formatting: **bold**, - bullets, numbers)", "notes": "string (detailed speaker notes: what to say, transitions, audience engagement cues)", "layout": "string (title|content|quote|stats|cta|comparison|timeline)" }] }.

Include data points, specific examples, and compelling visuals descriptions. Each slide should flow naturally to the next with clear transitions.`;
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
        systemPrompt = `You are an email marketing expert who has generated $10M+ in revenue from email sequences. Generate a ${sequenceType} email sequence with ${emailsCount} emails.

Return valid JSON: { "emails": [{ "subject": "string (A/B test worthy subject line, use curiosity gaps, numbers, or personalization)", "preview": "string (compelling preview text that complements subject)", "body": "string (complete email in markdown: hook, story/proof, value, CTA. 5-8 paragraphs minimum. Use **bold**, bullet points, P.S. lines. Include specific examples and data)", "cta": "string (specific call to action with urgency)", "day": number, "notes": "string (strategy: why this email, what psychological trigger, expected open/click rate)" }] }.

Use proven frameworks: PAS (Problem-Agitate-Solve), AIDA, Storytelling. Each email must have a clear purpose in the sequence and build on the previous one. Include P.S. lines, curiosity loops, and open loops.`;
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
      case "research": {
        const { researchType, query: researchQuery, niche: researchNiche } = body;
        const typePrompts: Record<string, string> = {
          competitor: 'Analyze competitors in this space. Identify their strengths, weaknesses, pricing, positioning, and content strategies.',
          trend: 'Identify current and emerging trends in this market. Include data points, growth indicators, and future predictions.',
          audience: 'Create a detailed audience profile. Include demographics, psychographics, pain points, desires, buying behavior, and where they hang out online.',
          keywords: 'Research relevant keywords and SEO opportunities. Include search volume estimates, competition levels, long-tail variations, and content gap opportunities.',
          strategy: 'Create a comprehensive marketing strategy. Include positioning, channels, content plan, growth tactics, and 90-day action plan.',
        };
        systemPrompt = `You are a senior market research analyst and digital marketing strategist. ${typePrompts[researchType] || typePrompts.strategy} Return valid JSON: { "summary": "string (executive summary, 3-5 paragraphs)", "findings": [{ "title": "string", "detail": "string", "impact": "string (high/medium/low)" }], "recommendations": ["string (actionable recommendation)"], "actionPlan": "string (detailed step-by-step action plan)" }. Be specific, data-driven, and actionable. Write in Spanish.`;
        userPrompt = `Research query: ${researchQuery}\nNiche: ${researchNiche || 'not specified'}`;
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
