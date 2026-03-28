import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface StreamingGenerationOptions {
  onStreamChunk?: (fullText: string) => void;
  onComplete?: (parsed: any) => void;
  onError?: (error: string) => void;
}

// User-friendly error messages by code
const ERROR_MESSAGES: Record<string, string> = {
  NO_PROVIDER: '⚙️ El servicio de IA no está configurado. Contacta al administrador.',
  ALL_PROVIDERS_FAILED: '🔄 Todos los servicios de IA están temporalmente ocupados. Intenta en unos segundos.',
  PROVIDER_ERROR_400: '❌ Solicitud inválida. Intenta reformular tu petición.',
  PROVIDER_ERROR_401: '🔐 Error de autenticación con el servicio de IA.',
  INTERNAL_ERROR: '⚠️ Error inesperado. Por favor intenta de nuevo.',
};

function getUserFriendlyError(error: string, status?: number): string {
  // Check for known error codes
  for (const [code, msg] of Object.entries(ERROR_MESSAGES)) {
    if (error.includes(code)) return msg;
  }
  // Check by HTTP status
  if (status === 402) return '💳 Créditos de IA agotados. El sistema está intentando proveedores alternativos...';
  if (status === 429) return '⏳ Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.';
  if (status === 503) return '🔧 Servicios de IA temporalmente no disponibles. Intenta en unos minutos.';
  // Fallback
  if (error.includes('Credits exhausted') || error.includes('add funds')) {
    return '💳 Créditos agotados. Por favor agrega fondos en Settings > Workspace > Usage.';
  }
  if (error.includes('Rate limit') || error.includes('rate limit')) {
    return '⏳ Límite de velocidad alcanzado. Intenta en unos segundos.';
  }
  if (error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')) {
    return '🌐 Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  return `⚠️ ${error}`;
}

export function useStreamingGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (
    body: Record<string, any>,
    options?: StreamingGenerationOptions
  ) => {
    setIsGenerating(true);
    setStreamText('');
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Use streaming via ai-agent for real-time feedback
      const streamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;
      
      // Build the prompt from body params for streaming
      const userPrompt = buildPromptFromBody(body);
      const systemPrompt = buildSystemPromptFromType(body.type, body);

      const resp = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const status = resp.status;
        const err = await resp.json().catch(() => ({ error: `Server error (${status})` }));
        const friendlyMsg = getUserFriendlyError(err.error || '', status);
        toast.error(friendlyMsg, { duration: 6000 });
        throw new Error(friendlyMsg);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let charCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              charCount += content.length;
              // Estimate progress based on expected output size
              const estimatedSize = getEstimatedSize(body.type, body);
              setProgress(Math.min(95, (charCount / estimatedSize) * 100));
              setStreamText(fullContent);
              options?.onStreamChunk?.(fullContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamText(fullContent);
            }
          } catch {}
        }
      }

      setProgress(100);

      // Parse the final JSON from the streamed content
      const parsed = extractJSON(fullContent);
      if (parsed) {
        options?.onComplete?.(parsed);
        return parsed;
      } else {
        // If we can't parse JSON, return the raw text
        options?.onComplete?.({ rawContent: fullContent });
        return { rawContent: fullContent };
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.info('⏹️ Generación detenida');
        return null;
      }
      const msg = getUserFriendlyError(e.message || 'Generation failed');
      options?.onError?.(msg);
      throw e;
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return { generate, stop, isGenerating, streamText, progress };
}

function extractJSON(text: string): any {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  // Try raw JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  return null;
}

function getEstimatedSize(type: string, body: any): number {
  switch (type) {
    case 'ebook': return (body.chaptersCount || 8) * 3000;
    case 'ads': return (body.variantsCount || 4) * 800;
    case 'email_sequence': return (body.emailsCount || 5) * 1500;
    case 'presentation': return (body.slidesCount || 10) * 600;
    case 'landing': return 8000;
    case 'calendar': return (body.weeks || 2) * 7 * 300;
    case 'lead_magnet': return 4000;
    case 'research': return 5000;
    default: return 5000;
  }
}

function buildSystemPromptFromType(type: string, body: any): string {
  const prompts: Record<string, string> = {
    ebook: buildEbookSystemPrompt(body),
    ads: buildAdsSystemPrompt(body),
    email_sequence: buildEmailSystemPrompt(body),
    presentation: buildPresentationSystemPrompt(body),
    landing: buildLandingSystemPrompt(body),
    calendar: buildCalendarSystemPrompt(body),
    lead_magnet: buildLeadMagnetSystemPrompt(body),
    research: buildResearchSystemPrompt(body),
  };
  return prompts[type] || 'You are an expert marketing content generator. Return valid JSON.';
}

function buildPromptFromBody(body: any): string {
  const parts: string[] = [];
  if (body.topic) parts.push(`Topic: ${body.topic}`);
  if (body.product) parts.push(`Product: ${body.product}`);
  if (body.productName) parts.push(`Product: ${body.productName}`);
  if (body.audience) parts.push(`Audience: ${body.audience}`);
  if (body.targetAudience) parts.push(`Audience: ${body.targetAudience}`);
  if (body.niche) parts.push(`Niche: ${body.niche}`);
  if (body.benefit) parts.push(`Main benefit: ${body.benefit}`);
  if (body.productDesc) parts.push(`Description: ${body.productDesc}`);
  if (body.platform) parts.push(`Platform: ${body.platform}`);
  if (body.query) parts.push(`Query: ${body.query}`);
  if (body.problem) parts.push(`Problem: ${body.problem}`);
  return parts.join('\n') || 'Generate professional marketing content';
}

// ── System prompts per type (PREMIUM quality) ──

function buildEbookSystemPrompt(body: any): string {
  const { chaptersCount = 8, language = 'es', detailLevel = 'detailed', template = 'guia' } = body;
  const langMap: Record<string, string> = { es: 'Spanish', en: 'English', pt: 'Portuguese' };
  const lang = langMap[language] || 'Spanish';
  const detail = detailLevel === 'extensive' ? '1000-1500' : detailLevel === 'detailed' ? '600-1000' : '400-600';

  const templateInstructions: Record<string, string> = {
    guia: `Write as a PRACTICAL GUIDE. Each chapter MUST include:
- Clear numbered steps with detailed explanations (not just one-liners)
- Real-world examples with specific companies, people, or scenarios
- "Pro Tip" callout boxes using > blockquotes with insider knowledge
- A "Common Mistakes" section listing 3-5 pitfalls to avoid
- Data points, statistics, or case study results where applicable
- A practical exercise with clear instructions at the end`,
    curso: `Structure as an EDUCATIONAL COURSE. Each chapter MUST include:
- "Learning Objectives" section at the top (3-5 objectives)
- Concept explanations with analogies and real examples
- "Case Study" section with a real or realistic scenario analyzed in detail
- "Quiz" with 3-5 questions to test understanding
- "Assignment" with a hands-on task
- Key vocabulary/terms defined in context`,
    tecnico: `Write as a DEEP TECHNICAL GUIDE. Each chapter MUST include:
- Multiple code examples in markdown code blocks (\`\`\`language) that are REAL, FUNCTIONAL, and COPY-PASTEABLE
- Step-by-step implementation with terminal commands
- Configuration files (JSON, YAML, .env examples)
- API request/response examples with curl commands
- Troubleshooting section: "Problem → Cause → Solution" format
- Architecture diagrams described in text/ASCII
- Performance benchmarks or comparison tables using markdown tables
- Best practices vs anti-patterns side by side`,
    playbook: `Write as a MARKETING PLAYBOOK. Each chapter MUST include:
- A proven framework with visual diagram described in text
- Fill-in-the-blank templates the reader can copy and customize
- Real metrics and benchmarks (CTR, conversion rates, ROAS)
- Swipe files: 3-5 ready-to-use templates (email subjects, ad headlines, landing page copy)
- ROI calculation examples with numbers
- Campaign blueprint with timeline, budget, and KPIs
- A/B test ideas for each strategy`,
    workbook: `Write as an INTERACTIVE WORKBOOK. Each chapter MUST include:
- 3-5 reflection questions that provoke deep thinking
- Fill-in-the-blank exercises with example answers
- Self-assessment scoring rubric (rate 1-10)
- Planning template with sections to fill out
- "Before & After" examples showing transformation
- Action plan worksheet with deadlines
- Accountability checklist`,
    checklist: `Format as ACTIONABLE CHECKLISTS. Each chapter MUST include:
- Numbered action items with 2-3 sentence explanations each
- Priority markers (🔴 Critical, 🟡 Important, 🟢 Nice to have)
- Time estimates for each action
- Templates to copy-paste (email scripts, social posts, etc.)
- Quick-win tips marked with ⚡
- "Done" criteria for each item
- Resources/tools links described`,
    storytelling: `Write with COMPELLING NARRATIVE. Each chapter MUST include:
- An opening hook that creates curiosity or tension
- Real or realistic dialogue between characters
- Detailed case study with specific numbers and outcomes
- "The Lesson" section extracting actionable principles
- A transition that creates anticipation for the next chapter
- Emotional beats: struggle → insight → transformation
- Quotes or wisdom from industry leaders`,
  };

  return `You are a BESTSELLING AUTHOR and subject matter expert writing a premium-quality ebook. Generate ${chaptersCount} chapters that would be worthy of a published book on Amazon.

CRITICAL QUALITY RULES:
- Each chapter MUST be ${detail} words minimum — write FULL, RICH chapters, NOT summaries
- Use extensive **markdown formatting**: ## for sections, ### for subsections, **bold** for key terms, \`code\` for inline code, \`\`\`language for code blocks, > for callout boxes, - for bullets, 1. for numbered lists, | for tables
- Include SPECIFIC real-world examples with names, companies, numbers, and dates
- Add data points, statistics, and research citations where applicable
- Use storytelling techniques: hooks, tension, resolution
- Include visual elements described in text: tables, comparison charts, step diagrams
- ${templateInstructions[template] || templateInstructions.guia}
- Write ENTIRELY in ${lang}. Niche: ${body.niche || 'general'}.
- NEVER use generic filler like "Lorem ipsum" or "[insert here]"
- Each chapter must feel complete and independently valuable

Return valid JSON: { "title": "string (compelling, benefit-driven title)", "subtitle": "string (descriptive subtitle with target audience)", "chapters": [{ "title": "string (intriguing chapter title)", "content": "string (FULL rich markdown content, ${detail} words minimum with all formatting)", "keyTakeaways": ["string (5-7 specific, actionable takeaways)"], "exercises": ["string (2-4 hands-on exercises with clear instructions)"] }] }`;
}

function buildAdsSystemPrompt(body: any): string {
  const { platform = 'facebook', framework = 'aida', variantsCount = 4 } = body;
  
  const platformSpecs: Record<string, string> = {
    facebook: 'Facebook Ads: primary text up to 125 chars visible (full up to 1000), headline 40 chars, link desc 30 chars. Use emotional triggers and social proof.',
    instagram_feed: 'Instagram Feed: caption up to 2200 chars, first 125 visible. Use emojis strategically, line breaks for readability, 20-30 hashtags.',
    instagram_story: 'Instagram Story: short punchy text, 1-2 sentences max for overlay. Focus on urgency and FOMO. Include swipe-up CTA.',
    tiktok: 'TikTok: hook in first 3 seconds is EVERYTHING. Use trending formats, conversational tone, pattern interrupts. Caption max 150 chars.',
    google: 'Google Ads: Headline 1 (30 chars), Headline 2 (30 chars), Headline 3 (30 chars), Description 1 (90 chars), Description 2 (90 chars). Focus on search intent and keywords.',
    linkedin: 'LinkedIn: Professional tone, data-driven, thought leadership angle. 1300 chars for sponsored content. Use industry jargon appropriately.',
  };

  const frameworkDetails: Record<string, string> = {
    aida: 'AIDA: Attention (pattern interrupt) → Interest (curiosity gap) → Desire (paint transformation) → Action (clear CTA with urgency)',
    pas: 'PAS: Problem (name their exact pain) → Agitate (twist the knife, show consequences) → Solution (present your offer as the bridge)',
    bab: 'BAB: Before (their current painful reality) → After (vivid picture of desired state) → Bridge (your product connects the two)',
    hso: 'HSO (Russell Brunson): Hook (bold claim or question) → Story (personal transformation story with specific details) → Offer (irresistible stack)',
    storytelling: 'Storytelling: Open with "I was exactly where you are..." → Share specific struggle with dates/numbers → Turning point revelation → Results with proof → "You can do it too" CTA',
    '4u': '4U: Useful (what they gain) → Urgent (why now) → Unique (why only you) → Ultra-specific (exact results with numbers)',
  };

  return `You are an elite performance marketer who has managed $100M+ in ad spend across all platforms. You've studied the best ads from Hormozi, Brunson, Kern, Gary Vee, and Sabri Suby.

PLATFORM: ${platformSpecs[platform] || platformSpecs.facebook}
FRAMEWORK: ${frameworkDetails[framework] || frameworkDetails.aida}

Generate ${variantsCount} WILDLY DIFFERENT ad copy variants. Each must use a UNIQUE psychological angle:
1. Fear of Missing Out / Urgency
2. Social Proof / Authority  
3. Curiosity Gap / Pattern Interrupt
4. Aspiration / Dream State
(additional variants: Contrarian take, Data-driven, Emotional storytelling, Direct response)

QUALITY RULES:
- Headlines must STOP THE SCROLL — use specific numbers, bold claims, or provocative questions
- Primary text must be 5-8 sentences MINIMUM with strategic line breaks
- Include specific results ("327% increase", "in just 14 days", "$47,000 in revenue")
- Use power words: discover, proven, secret, limited, exclusive, guaranteed
- Each CTA must create urgency (limited spots, deadline, bonuses expiring)
- Include emoji strategically for visual breaks (but not cheesy overuse)

Return valid JSON: { "variants": [{ "headline": "string (attention-grabbing, platform-appropriate length)", "primary_text": "string (RICH ad body: hook + story/proof + benefits + CTA, 5-8 sentences with \\n line breaks, includes specific numbers and proof)", "cta": "string (action-oriented button text with urgency)", "hook": "string (the scroll-stopping opening line that makes them stop and read)", "framework": "${framework}", "targeting_notes": "string (detailed targeting: interests, lookalikes, custom audiences, demographics)", "creative_notes": "string (detailed visual direction: image/video concept, colors, text overlay ideas, B-roll suggestions)" }] }`;
}

function buildEmailSystemPrompt(body: any): string {
  const { sequenceType = 'welcome', emailsCount = 5 } = body;
  
  const sequenceFrameworks: Record<string, string> = {
    welcome: `WELCOME SEQUENCE (Andre Chaperon style):
Email 1 (Day 0): The Big Promise — welcome, set expectations, deliver immediate value, create curiosity about what's coming
Email 2 (Day 1): The Origin Story — your personal journey, why you care, build connection
Email 3 (Day 3): The Quick Win — give them an actionable tip that produces a result TODAY
Email 4 (Day 5): The Case Study — detailed client transformation story with numbers
Email 5 (Day 7): The Soft Offer — invite them to take the next step, remove risk`,
    launch: `LAUNCH SEQUENCE (Jeff Walker Product Launch Formula):
Email 1 (Day -7): Pre-launch teaser — hint at something big coming, create curiosity
Email 2 (Day -5): Value bomb #1 — teach something valuable, position as authority
Email 3 (Day -3): Value bomb #2 — address main objection with proof
Email 4 (Day -1): Value bomb #3 — social proof and anticipation
Email 5 (Day 0): CART OPEN — full offer reveal, early bird bonus
Email 6 (Day 2): Objection crusher — FAQ, testimonials, risk reversal
Email 7 (Day 4): CART CLOSE — final call, urgency, scarcity, deadline`,
    cash_machine: `4-DAY CASH MACHINE (Frank Kern):
Email 1 (Day 1): The Story — personal story + massive free value, NO selling
Email 2 (Day 2): The Proof — case studies, results, social proof, still no hard sell
Email 3 (Day 3): The Offer — present the offer with irresistible stack, time-limited bonus
Email 4 (Day 4): The Deadline — last chance, what they'll miss, final CTA with countdown`,
    nurture: `NURTURE SEQUENCE (value-first authority building):
Each email teaches one concept deeply, includes a "do this now" action item, and subtly positions your offer as the natural next step.`,
    cart: `ABANDONED CART RECOVERY:
Email 1 (1 hour): Helpful reminder, address technical issues
Email 2 (24 hours): Overcome top objection, add social proof
Email 3 (48 hours): Final urgency, limited bonus or discount`,
    webinar: `POST-WEBINAR FOLLOW-UP:
Email 1 (Immediate): Replay link, key takeaways summary
Email 2 (Day 1): Deepest objection addressed with case study
Email 3 (Day 2): FAQ + new bonus announcement
Email 4 (Day 3): Final deadline, what they're leaving on the table`,
    reengagement: `RE-ENGAGEMENT (win-back):
Email 1: "We miss you" + what's new/improved
Email 2: Exclusive comeback offer
Email 3: "Last email unless..." breakup email (highest converting)`,
    tripwire: `TRIPWIRE SEQUENCE:
Email 1: Deliver lead magnet + introduce low-ticket offer ($7-$27)
Email 2: Value stack of the tripwire, overcome price objection
Email 3: Upsell to core offer with seamless transition`,
  };

  return `You are a WORLD-CLASS email copywriter who has studied Ryan Deiss, Andre Chaperon, Ben Settle, Frank Kern, and Russell Brunson. You write emails that get 40%+ open rates and 5%+ click rates.

SEQUENCE TYPE: ${sequenceType}
${sequenceFrameworks[sequenceType] || sequenceFrameworks.welcome}

Generate ${emailsCount} emails that are SO GOOD people would screenshot and share them.

QUALITY RULES FOR EVERY EMAIL:
- Subject lines: Use curiosity gaps ("The one thing nobody tells you about..."), numbers ("3 mistakes killing your..."), or personalization. A/B variants welcome.
- Preview text: Complement (not repeat) the subject, create additional curiosity
- Body MUST be 200-400 words with rich markdown formatting:
  - Opening hook (1 line that makes them read line 2)
  - Story or proof section with specific details, names, numbers
  - Value/teaching section with actionable insight
  - Transition to CTA that feels natural, not forced
  - P.S. line (the most-read part of any email) with additional urgency or bonus
  - Use **bold** for emphasis, line breaks for rhythm, > for testimonial quotes
  - Include specific numbers: "Sarah went from $3K to $27K/month in 90 days"
- Notes must include: psychological trigger used, expected open rate, and how this email connects to the next

Return valid JSON: { "emails": [{ "subject": "string (A/B test worthy, curiosity-driven)", "preview": "string (complements subject, 40-90 chars)", "body": "string (RICH markdown email: 200-400 words, hooks + story + value + CTA + P.S., with **bold**, > quotes, bullets, line breaks)", "cta": "string (specific action with urgency: 'Claim your spot before midnight')", "day": number, "notes": "string (strategy: trigger used, purpose in sequence, expected metrics, connection to next email)" }] }`;
}

function buildPresentationSystemPrompt(body: any): string {
  const { presentationType = 'pitch', slidesCount = 12 } = body;
  
  const typeInstructions: Record<string, string> = {
    pitch: `PITCH DECK (Sequoia Capital format):
1. Title + tagline  2. Problem (market pain)  3. Solution (your unique approach)
4. Market Size (TAM/SAM/SOM with numbers)  5. Product (how it works)
6. Traction (metrics, growth, revenue)  7. Business Model  8. Competition (positioning matrix)
9. Team  10. Financial Projections  11. The Ask  12. Contact/CTA`,
    webinar: `WEBINAR (Russell Brunson Perfect Webinar):
1. Title + Promise  2. Your Story (credibility)  3. The Big Problem
4. Secret #1 (Vehicle)  5. Secret #2 (Internal belief)  6. Secret #3 (External excuse)
7. Transition to offer  8. The Stack  9. Bonuses  10. Guarantee  11. Urgency  12. CTA`,
    masterclass: `MASTERCLASS (authority positioning):
1. Hook + Promise  2. Why This Matters NOW  3. The Framework overview
4-8. Deep dive into each pillar (with data, examples, case studies)
9. Implementation roadmap  10. Resources  11. Q&A prep  12. Next steps CTA`,
    lanzamiento: `PRODUCT LAUNCH presentation:
1. The Problem landscape  2. Why existing solutions fail  3. Introducing [Product]
4. Key Feature #1 with demo  5. Key Feature #2 with demo  6. Key Feature #3 with demo
7. Customer results/testimonials  8. Pricing & packages  9. Bonuses  10. Guarantee
11. Timeline/availability  12. CTA`,
    reporte: `RESULTS REPORT (data-driven):
1. Executive Summary  2. Objectives vs Results  3. Key Metrics Dashboard
4. Channel Performance  5. Top Performing Content  6. Audience Insights
7. Revenue Attribution  8. A/B Test Results  9. Learnings  10. Recommendations
11. Next Quarter Plan  12. Resources Needed`,
  };

  return `You are a PRESENTATION STRATEGIST who has created decks for TED talks, Y Combinator pitches, and Fortune 500 boardrooms. You study Canva, Beautiful.ai, and Gamma for design principles.

TYPE: ${presentationType}
${typeInstructions[presentationType] || typeInstructions.pitch}

Create EXACTLY ${slidesCount} slides that tell a compelling story.

QUALITY RULES:
- Titles must be PUNCHY and specific (not "Introduction" but "Why 73% of Marketers Are Wasting Their Budget")
- Content must include 4-8 bullet points with SPECIFIC data, examples, and proof
- Use markdown: **bold** key phrases, numbers in bullets, comparison data
- Speaker notes: 100+ words with what to SAY (not just read), transitions, audience interaction cues, timing
- Layout types: title, content, quote, stats, comparison, timeline, cta, image_placeholder
- Include data visualizations described: "Bar chart showing 3x growth", "Comparison table: us vs competitors"
- Natural flow with clear transitions between slides
- Opening must HOOK, middle must PROVE, ending must COMPEL action

Return valid JSON: { "slides": [{ "title": "string (punchy, specific, benefit-driven)", "content": "string (4-8 rich bullets with **bold** key phrases, specific numbers, and evidence. Use markdown formatting extensively: tables, bold, lists)", "notes": "string (100+ word speaker script: what to say, how to transition, audience engagement cues, timing notes)", "layout": "string (title|content|quote|stats|comparison|timeline|cta|image_placeholder)" }] }`;
}

function buildLandingSystemPrompt(body: any): string {
  return `You are a CONVERSION-FOCUSED landing page expert who has studied Unbounce, Leadpages, and ClickFunnels top-performing pages. Generate a complete, STUNNING standalone HTML landing page.

QUALITY RULES:
- Modern, premium design with CSS gradients, shadows, animations, and glass effects
- Mobile-responsive with proper media queries
- Hero section: massive headline with gradient text, compelling subheadline, animated CTA button, trust indicators
- Social proof bar: logos or "As seen in" section
- Benefits section: 4-6 benefits with emoji icons and detailed descriptions
- "How it works" section: 3-step process with numbered circles
- Testimonials: 3 realistic testimonials with names, photos (placeholder), roles, and specific results
- FAQ accordion section: 5-7 common questions
- Pricing/offer section with highlighted value and savings
- Final CTA section with urgency (countdown timer in CSS)
- Footer with links
- Use Google Fonts, smooth scrolling, hover effects, subtle animations
- Color scheme should feel premium and trustworthy

Return valid JSON: { "html": "complete HTML string with all CSS inline in a <style> tag" }`;
}

function buildCalendarSystemPrompt(body: any): string {
  const { weeks = 2, contentTypes = ['post', 'story', 'reel'] } = body;
  const totalPosts = weeks * 7;
  
  return `You are a SOCIAL MEDIA STRATEGIST who manages accounts with 500K+ followers. You've studied the content strategies of Gary Vee, Alex Hormozi, and Jasmine Star.

Generate ${totalPosts} content posts for ${weeks} week(s) that follow a strategic content calendar.

CONTENT MIX STRATEGY:
- 40% Value/Educational (teach something, solve a problem)
- 20% Engagement (questions, polls, controversials, hot takes)
- 20% Social Proof (results, testimonials, behind-the-scenes)
- 10% Entertainment (memes, trends, relatable humor)
- 10% Promotional (soft sell with value-first approach)

QUALITY RULES:
- Every hook must be a SCROLL-STOPPER (controversial, specific number, bold claim, or question)
- Content must be COMPLETE — ready to copy-paste and post
- Carousel posts: outline 8-10 slides with the content for each slide
- Reels/TikToks: include hook + script outline + CTA + trending audio suggestion
- Threads: 5-7 connected tweets with hooks and value
- Each post should have 15-25 relevant hashtags mixing popular and niche
- Include best posting time suggestions
- Stories: include poll/question sticker ideas

Return valid JSON: { "posts": [{ "day": "string (Lunes Sem1, Martes Sem1...)", "type": "string (${contentTypes.join(',')})", "title": "string (internal reference title)", "content": "string (COMPLETE post text ready to copy: 150-300 words for feed posts, full carousel slides, reel scripts)", "hashtags": ["string (15-25 hashtags)"], "hook": "string (the scroll-stopping first line)", "platform": "string (Instagram|X/Twitter|LinkedIn|Email|TikTok)", "bestTime": "string (suggested posting time)", "contentPillar": "string (value|engagement|proof|entertainment|promo)" }] }`;
}

function buildLeadMagnetSystemPrompt(body: any): string {
  const { magnetType = 'checklist' } = body;
  
  const typeInstructions: Record<string, string> = {
    checklist: 'Create a detailed CHECKLIST with 20-30 items organized by category. Each item has a description explaining WHY it matters and HOW to do it. Include priority levels and estimated time.',
    calculator: 'Design an interactive CALCULATOR concept: input fields, formulas, expected output ranges, interpretation guide, and example calculations with real numbers.',
    'mini-course': 'Design a 5-LESSON MINI COURSE: each lesson has a video script outline (500+ words), key takeaway, homework assignment, and resource list. Include welcome and completion emails.',
    template: 'Create 5-7 READY-TO-USE TEMPLATES: each with fill-in-the-blank sections, example filled out, customization guide, and use-case scenarios.',
    cheatsheet: 'Create a COMPREHENSIVE CHEAT SHEET: organized by category with formulas, shortcuts, best practices, dos & don\'ts, quick reference tables, and visual layout descriptions.',
    quiz: 'Design a 10-15 question ASSESSMENT: each question has 4 answer options, scoring logic, 3-4 result profiles with detailed descriptions and personalized recommendations.',
  };

  return `You are a LEAD MAGNET specialist who has studied the most downloaded freebies from HubSpot, Neil Patel, DigitalMarketer, and Amy Porterfield.

TYPE: ${magnetType}
${typeInstructions[magnetType] || typeInstructions.checklist}

Create a lead magnet SO VALUABLE people would pay $47 for it but you're giving it away free.

QUALITY RULES:
- Title must use a formula: "The [Specific Result] [Type]: How to [Benefit] in [Timeframe]"
- Hook must create IRRESISTIBLE curiosity
- Content must be IMMEDIATELY actionable — no fluff, pure value
- Include 5-8 detailed sections with rich markdown content
- Each section: 150-300 words with specific examples, templates, or frameworks
- Landing page copy must follow PAS framework with specific proof points
- CTA must overcome the "what's the catch?" objection

Return valid JSON: { "title": "string (compelling, benefit-driven)", "hook": "string (irresistible headline that promises transformation)", "description": "string (3-4 sentences with specific promise and social proof)", "sections": [{ "title": "string", "content": "string (150-300 words with markdown: **bold**, bullets, > callouts, code if applicable, tables, numbered steps)" }], "cta": "string (specific, urgent call to action)", "landingCopy": "string (4-6 paragraphs with PAS framework: problem, agitate with statistics, solution with proof, risk reversal, CTA with urgency. Include **bold**, bullets, and testimonial quotes)" }`;
}

function buildResearchSystemPrompt(body: any): string {
  const { researchType = 'strategy' } = body;
  const types: Record<string, string> = {
    competitor: `COMPETITIVE ANALYSIS: Map the competitive landscape with positioning matrix. For each competitor analyze: pricing tiers, feature comparison, content strategy, social media presence, ad spend estimates, unique selling propositions, customer reviews sentiment, weaknesses to exploit. Include a SWOT analysis and strategic recommendations.`,
    trend: `TREND ANALYSIS: Identify 8-12 current and emerging trends with supporting data. For each: growth trajectory, market impact, adoption timeline, early movers, opportunities for entry, potential risks. Include technology convergence patterns and predictions for next 12-24 months.`,
    audience: `AUDIENCE RESEARCH: Create 3-4 detailed buyer personas with demographics (age, income, location, education), psychographics (values, fears, aspirations, beliefs), buying behavior (triggers, objections, decision timeline, influences), online behavior (platforms, content preferences, communities), and messaging angles that resonate.`,
    keywords: `KEYWORD/SEO RESEARCH: Identify 30-50 keyword opportunities organized by intent (informational, commercial, transactional). Include estimated search volume, competition difficulty, long-tail variations, content gap opportunities, and suggested content types for each cluster.`,
    strategy: `MARKETING STRATEGY: Create a comprehensive go-to-market strategy including positioning statement, unique mechanism, content pillars, channel strategy with budget allocation, 90-day sprint plan with weekly milestones, KPIs and benchmarks, growth loops, and scaling playbook.`,
  };
  return `You are a SENIOR MARKETING STRATEGIST at a top consulting firm (McKinsey/BCG level analysis). ${types[researchType] || types.strategy}

QUALITY RULES:
- Be data-driven: include specific numbers, percentages, and benchmarks
- Reference real companies, tools, and industry reports
- Provide ACTIONABLE recommendations, not generic advice
- Each finding should have clear business impact assessment
- Action plan must have specific deadlines and responsible parties
- Write in Spanish with a professional, authoritative tone

Return valid JSON: { "summary": "string (executive summary: 4-6 paragraphs with key findings and bold recommendations)", "findings": [{ "title": "string (specific finding)", "detail": "string (2-3 paragraphs with data, examples, and analysis)", "impact": "string (alto|medio|bajo with explanation)" }], "recommendations": ["string (specific, actionable recommendations with expected outcome)"], "actionPlan": "string (detailed 90-day plan organized by week/month with specific tasks, KPIs, and milestones. Use markdown formatting: headers, bullets, bold)" }`;
}

function buildVSLSystemPrompt(body: any): string {
  const { scriptType = 'vsl', product = '', audience = '', mainBenefit = '', price = '' } = body;

  const typeScripts: Record<string, string> = {
    vsl: `VSL (Video Sales Letter) — 10-15 minute script:
1. HOOK (0:00-0:30): Pattern interrupt question or shocking statistic. Must make them think "wait, WHAT?"
2. PROBLEM (0:30-2:30): Name their EXACT pain. Use "If you're like most [audience]..." Agitate with consequences of NOT solving it.
3. CREDIBILITY (2:30-3:30): Why YOU? Quick credentials, results, or "I was where you are" story.
4. STORY (3:30-6:00): Your personal transformation OR client case study. Specific dates, numbers, emotions. Make it cinematic.
5. THE MECHANISM (6:00-8:00): Why your solution works differently. Name your unique process/framework. Explain the "secret" or "discovery."
6. SOCIAL PROOF (8:00-9:30): 3-5 client results with specific numbers. "Maria went from X to Y in Z days."
7. THE OFFER (9:30-11:30): Present the full offer. Stack value (total value $X,XXX). Bonuses with individual values. Price reveal with anchoring.
8. GUARANTEE (11:30-12:00): Risk reversal. Make it bold: "If you don't [result] in [timeframe], I'll [guarantee]."
9. CLOSE (12:00-13:00): Urgency, scarcity, final CTA. "Click the button below RIGHT NOW before [reason]."
10. P.S. (13:00-14:00): Restate the biggest benefit and the risk of doing nothing.`,
    webinar: `PERFECT WEBINAR (Russell Brunson) — 60-90 minute script:
1. INTRO + BIG PROMISE (0-5 min): "In the next 60 minutes, I'm going to show you [specific result]"
2. YOUR STORY (5-15 min): Epiphany Bridge story — how you discovered the secret
3. THE ONE THING (15-20 min): Name the vehicle/framework that changes everything
4. SECRET #1 — VEHICLE (20-30 min): Break the belief about the vehicle. Story + proof + framework.
5. SECRET #2 — INTERNAL (30-40 min): Break the belief about their ability. Story + proof + framework.
6. SECRET #3 — EXTERNAL (40-50 min): Break the belief about external obstacles. Story + proof + framework.
7. THE STACK (50-60 min): Present each component with individual value. Total value reveal. Price drop.
8. CLOSE (60-70 min): "You have 3 choices: do nothing, do it alone, let me help you." Urgency + bonuses deadline.`,
    mini_vsl: `MINI VSL — 2-5 minute script:
1. HOOK (0:00-0:15): One powerful line that stops the scroll
2. PROBLEM (0:15-0:45): Quick pain identification
3. PROOF (0:45-1:30): One compelling case study with numbers
4. SOLUTION (1:30-2:30): What your product does (not features, TRANSFORMATION)
5. CTA (2:30-3:00): Clear next step with urgency`,
    story_sell: `EPIPHANY BRIDGE (Russell Brunson) — 10-20 minute script:
1. BACKSTORY: "I was just like you... [specific situation with details]"
2. THE WALL: "I tried everything... [list 3-5 things that didn't work and why]"
3. THE EPIPHANY: "Then one day... [specific moment of discovery]"
4. THE PLAN: "Here's what I did next... [3-5 specific steps]"
5. THE TRANSFORMATION: "And the results were... [specific numbers and outcomes]"
6. THE OFFER: "And now I want to help YOU get the same results..."`,
  };

  return `You are a WORLD-CLASS VIDEO SALES COPYWRITER at the level of Russell Brunson, Frank Kern, and Sabri Suby. You write scripts that generate millions in revenue.

SCRIPT TYPE: ${scriptType}
${typeScripts[scriptType] || typeScripts.vsl}

PRODUCT: ${product}
AUDIENCE: ${audience}
MAIN BENEFIT: ${mainBenefit}
PRICE: ${price}

QUALITY RULES:
- Write WORD-FOR-WORD what to say — this is a teleprompter script
- Include stage directions: [PAUSE], [SHOW SLIDE], [LEAN IN], [CHANGE TONE]
- Use conversational language — write how people TALK, not how they write
- Include specific numbers, names, and results throughout
- Emotional beats: curiosity → pain → hope → proof → desire → action
- Each section needs transition phrases that flow naturally

Return valid JSON: { "sections": [{ "name": "string (section name)", "content": "string (WORD-FOR-WORD script with stage directions, 200-500 words per section)", "duration": "string (estimated time)", "type": "hook|story|content|offer|close" }] }`;
}

function buildFunnelSystemPrompt(body: any): string {
  const { niche = '', steps = [] } = body;
  
  return `You are a FUNNEL ARCHITECT who has built $10M+ funnels studying Russell Brunson (ClickFunnels), Alex Hormozi ($100M Offers), and Ryan Deiss (DigitalMarketer).

NICHE: ${niche}
FUNNEL STEPS:
${steps.map((s: any, i: number) => `${i + 1}. ${s.name} (${s.type}) — Price: ${s.price} — Goal: ${s.conversionGoal}`).join('\n')}

For EACH step, generate:
- A KILLER hook that stops people in their tracks
- Rich description of the offer (3-5 sentences with specific benefits and proof)
- Specific CTA that creates urgency
- Conversion optimization tips
- Email/retargeting copy for non-converters
- Expected conversion benchmarks

QUALITY RULES:
- Hooks must be specific: "How [audience] Are Getting [specific result] in [timeframe] Without [common obstacle]"
- Each offer must follow the "Grand Slam Offer" framework: dream outcome + perceived likelihood × time delay × effort & sacrifice
- Include value stacking: list 5-7 components with individual values
- Risk reversal: specific guarantee for each paid step
- Urgency mechanism: deadline, scarcity, or bonus expiration

Return valid JSON: { "steps": [{ "hook": "string (scroll-stopping hook)", "description": "string (3-5 sentences with benefits, proof, and value stack)", "cta": "string (specific, urgent CTA)", "conversionTips": "string (3-5 optimization tips)", "retargetingCopy": "string (follow-up copy for non-converters)", "expectedConversion": "string (benchmark conversion rate for this step type)" }] }`;
}
