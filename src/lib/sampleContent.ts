import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Sample {
  module: string;
  title: string;
  prompt: string;
  content: string;
  metadata?: Record<string, any>;
}

export const SAMPLE_CONTENT: Sample[] = [
  {
    module: 'ebook',
    title: 'Guía Maestra de Productividad para Emprendedores',
    prompt: 'Ebook práctico sobre productividad personal aplicada a emprendedores digitales',
    metadata: { niche: 'desarrollo', template: 'guia', chaptersCount: 3, sample: true },
    content: `## Capítulo 1: La Trampa de la Hiperactividad\n\nEstar ocupado no es lo mismo que ser productivo. La mayoría de emprendedores confunden la cantidad de tareas completadas con el progreso real hacia sus objetivos. Este capítulo desmonta el mito del "hustle" y propone un sistema basado en resultados medibles.\n\n**Principios clave:**\n- Ley de Pareto aplicada: el 20% de tareas genera el 80% del impacto.\n- Bloqueo de tiempo profundo: 90 minutos sin notificaciones supera 8 horas fragmentadas.\n- Auditoría semanal: cada domingo, lista lo que movió la aguja vs ruido operativo.\n\n---\n\n## Capítulo 2: Sistema de Decisiones de Alto Impacto\n\nLas decisiones diarias consumen energía mental finita. Implementar frameworks reduce la fatiga decisional y libera capacidad cognitiva para trabajo creativo.\n\n**Framework Eisenhower 2.0:**\n1. Urgente + Importante → ejecutar ya\n2. Importante no urgente → calendarizar\n3. Urgente no importante → delegar\n4. Ninguno → eliminar\n\n---\n\n## Capítulo 3: Automatización Estratégica\n\nNo automatices procesos rotos. Primero optimiza, luego documenta, después automatiza. Herramientas recomendadas: Zapier para flujos sencillos, Make para lógica compleja, n8n para soberanía total.`
  },
  {
    module: 'ads',
    title: 'Campaña Meta Ads — Curso de Inglés Online',
    prompt: 'Anuncios para Facebook e Instagram para curso de inglés conversacional',
    metadata: { sample: true, platform: 'meta' },
    content: `# Variante 1 — Dolor + Solución\n\n**Headline:** ¿Sabes inglés pero te bloqueas al hablarlo?\n\n**Body:** No es tu culpa. Las academias enseñan gramática pero nunca te entrenan a pensar en inglés. Nuestro método de inmersión conversacional en 90 días te lleva de bloqueo a fluidez natural.\n\n**CTA:** Reserva tu clase de prueba gratis →\n\n---\n\n# Variante 2 — Prueba Social\n\n**Headline:** +3.000 estudiantes ya hablan inglés sin pensar\n\n**Body:** María logró su entrevista en Google. Carlos cerró su primer cliente en USA. ¿Qué pasaría si en 90 días tú también dominaras el inglés conversacional?\n\n**CTA:** Únete a la próxima cohorte →\n\n---\n\n# Variante 3 — Curiosidad + Urgencia\n\n**Headline:** El método "shadowing" que usa la BBC para entrenar locutores\n\n**Body:** No es repetir frases. Es entrenar tu cerebro para imitar ritmo, entonación y musicalidad del inglés real. Solo 50 cupos esta semana.\n\n**CTA:** Quiero mi cupo →`
  },
  {
    module: 'emails',
    title: 'Secuencia Welcome — SaaS B2B (5 emails)',
    prompt: 'Onboarding email sequence para nuevo usuario de plataforma SaaS',
    metadata: { sample: true, count: 5 },
    content: `## Email 1 — Bienvenida (Día 0)\n\n**Asunto:** Bienvenido — empieza aquí (60 segundos)\n\nHola {nombre},\n\nGracias por unirte. Antes de explorar todo, te recomiendo hacer estos 3 pasos que llevan a más del 80% del valor de la plataforma: conecta tu primera fuente de datos, invita a un compañero, configura tu primera alerta.\n\n[Ir al dashboard →]\n\n---\n\n## Email 2 — Win rápido (Día 1)\n\n**Asunto:** Tu primer reporte está listo en 5 minutos\n\nLa mayoría de usuarios obtienen su primer insight accionable en su primera sesión. Si aún no has conectado tu fuente de datos, este video de 90 segundos lo explica.\n\n---\n\n## Email 3 — Caso de uso (Día 3)\n\n**Asunto:** Cómo Acme Corp ahorró 12 horas/semana\n\nCaso real con métricas. Sin fluff.\n\n---\n\n## Email 4 — Activación (Día 5)\n\n**Asunto:** ¿Necesitas ayuda configurando? (responde a este email)\n\n---\n\n## Email 5 — Upsell suave (Día 7)\n\n**Asunto:** Desbloquea automatizaciones avanzadas`
  },
  {
    module: 'presentation',
    title: 'Pitch Deck — Startup FinTech LATAM',
    prompt: 'Presentación de inversión para startup de pagos en Latinoamérica',
    metadata: { sample: true, slides: 10 },
    content: `## Slide 1 — Portada\n**Pagora** — La infraestructura de pagos para LATAM\n\n## Slide 2 — Problema\n62% de la población LATAM no tiene acceso a pagos digitales fluidos cross-border.\n\n## Slide 3 — Solución\nAPI única que unifica 47 métodos de pago locales en 8 países.\n\n## Slide 4 — Mercado\nTAM $180B, SAM $24B, SOM $1.2B en 5 años.\n\n## Slide 5 — Producto\n3 capas: Acquiring, Payouts, FX.\n\n## Slide 6 — Tracción\n$4.2M ARR, 320% YoY, 1.400 merchants.\n\n## Slide 7 — Modelo\n2.4% take rate + suscripción enterprise.\n\n## Slide 8 — Equipo\nEx-Stripe, ex-MercadoPago, ex-Nubank.\n\n## Slide 9 — Competencia\nMatriz vs dLocal, EBANX, Kushki.\n\n## Slide 10 — Ronda\n$12M Series A. Use of funds: 60% producto, 30% expansión, 10% equipo.`
  },
  {
    module: 'lead_magnet',
    title: 'Checklist — Auditoría SEO Express en 27 puntos',
    prompt: 'Lead magnet práctico para captar leads de agencias digitales',
    metadata: { sample: true, format: 'checklist' },
    content: `# Auditoría SEO Express — 27 Puntos\n\n## Técnico (9)\n- [ ] HTTPS activo y certificado vigente\n- [ ] robots.txt sin bloqueos críticos\n- [ ] sitemap.xml enviado a Google Search Console\n- [ ] Core Web Vitals en verde (LCP < 2.5s, CLS < 0.1)\n- [ ] Mobile-first sin issues en GSC\n- [ ] Sin contenido duplicado (canonical correcto)\n- [ ] Schema.org implementado (Article, Product u Organization)\n- [ ] hreflang correcto si hay multi-idioma\n- [ ] 404s detectados y redirigidos\n\n## On-Page (10)\n- [ ] Title <60 chars con keyword principal\n- [ ] Meta description <160 chars con CTA\n- [ ] Un único H1 por página\n- [ ] Estructura H2/H3 lógica\n- [ ] URLs cortas, descriptivas, sin parámetros\n- [ ] Imágenes con alt descriptivo\n- [ ] Imágenes en WebP/AVIF, lazy loading\n- [ ] Internal linking contextual\n- [ ] Anchor text variado\n- [ ] Contenido >800 palabras en páginas pillar\n\n## Off-Page + Autoridad (8)\n- [ ] Perfil de backlinks revisado en Ahrefs/SEMrush\n- [ ] Disavow file actualizado si hay tóxicos\n- [ ] DA/DR creciendo trimestralmente\n- [ ] Brand mentions monitorizadas\n- [ ] Google Business Profile completo\n- [ ] Reviews recientes y respondidas\n- [ ] Presencia en directorios sectoriales\n- [ ] PR digital mensual activo`
  },
  {
    module: 'vsl',
    title: 'VSL — Programa de Coaching Empresarial 12 semanas',
    prompt: 'Script de Video Sales Letter para programa de coaching premium',
    metadata: { sample: true, duration: '8min' },
    content: `## Hook (0-15s)\nSi facturas más de $20K al mes pero trabajas 70 horas semanales atrapado en operaciones... este video va a cambiar cómo ves tu negocio para siempre.\n\n## Agitación (15s-90s)\nTe lo voy a decir directo: el problema no es que no sepas vender. El problema es que has construido un trabajo, no una empresa. Cada decisión pasa por ti. Si te enfermas dos semanas, los ingresos se desploman.\n\n## Historia (90s-3min)\nHace 4 años yo estaba exactamente ahí. Facturaba $35K/mes y dormía 5 horas. Hasta que apliqué el sistema EOS adaptado a empresas hispanas y en 12 semanas mi negocio operó sin mí por primera vez.\n\n## Solución (3-5min)\nEl programa de 12 semanas se divide en 3 fases:\n- Semanas 1-4: Auditoría y diseño del organigrama objetivo\n- Semanas 5-8: Documentación de procesos críticos (SOPs)\n- Semanas 9-12: Delegación supervisada y métricas L10\n\n## Prueba (5-6min)\nResultados promedio: +47% facturación, -52% horas trabajadas.\n\n## Oferta (6-7min)\nInversión: $4.997 USD. Incluye 12 sesiones 1-1, plantillas, comunidad.\n\n## CTA (7-8min)\nAgenda tu llamada de diagnóstico gratis (30 min). Si no es para ti, te lo digo. Solo 8 cupos por mes.`
  },
  {
    module: 'funnel',
    title: 'Funnel Lanzamiento — Curso Online de Yoga',
    prompt: 'Funnel completo de lanzamiento para curso digital de yoga para principiantes',
    metadata: { sample: true, type: 'launch' },
    content: `# Funnel: Curso "Yoga desde Cero en 30 días"\n\n## Etapa 1: Captación (TOFU)\n**Tráfico:** Reels educativos + ads Meta lookalike de yoguis activos.\n**Lead magnet:** Mini-guía PDF "5 posturas para aliviar la espalda" + video 7 min.\n**Tasa objetivo:** 32% landing → email.\n\n## Etapa 2: Nurturing (MOFU)\n**Secuencia 7 emails en 7 días:**\n- D1: Bienvenida + entrega del PDF\n- D2: Historia personal de transformación\n- D3: Mito desmontado ("no necesito ser flexible")\n- D4: Caso de éxito de alumna real\n- D5: Mini-clase gratuita en vivo (webinar)\n- D6: Apertura de carrito con bonos\n- D7: Cierre con recordatorio de bonos por expirar\n\n## Etapa 3: Conversión (BOFU)\n**Página de ventas:** VSL 12 min + sección de bonos + 3 testimonios en video + FAQ + garantía 30 días.\n**Precio:** $97 USD (descuento de lanzamiento desde $197).\n**Order bump:** Plan nutricional vegetariano +$27.\n**Upsell 1:** Membresía mensual $19/mes (primer mes gratis).\n\n## Etapa 4: Retención\nGrupo privado en Telegram, lives mensuales, sistema de niveles gamificado.`
  },
  {
    module: 'calendar',
    title: 'Calendario Editorial 30 días — Marca personal LinkedIn',
    prompt: 'Plan de contenido mensual para crecer marca personal de consultor B2B',
    metadata: { sample: true, days: 30 },
    content: `# Calendario LinkedIn — 30 días\n\n## Semana 1 — Autoridad\n- L1: Carousel "5 errores que cometen las PYMEs en su web"\n- M2: Post historia personal — primer fracaso\n- X3: Datos de industria con visual\n- J4: Pregunta abierta a la audiencia\n- V5: Caso de cliente (anonimizado)\n\n## Semana 2 — Conexión\n- L8: Lección aprendida esta semana\n- M9: Recomendación de libro/podcast\n- X10: Encuesta\n- J11: Lista de herramientas favoritas\n- V12: Reflexión de viernes\n\n## Semana 3 — Educación\n- L15: Tutorial en formato carousel\n- M16: Comparativa "Antes vs Después"\n- X17: Mini-framework propio\n- J18: Tendencia del sector con opinión\n- V19: Behind the scenes\n\n## Semana 4 — Conversión\n- L22: Anuncio webinar gratuito\n- M23: Testimonios de clientes\n- X24: Resultados medibles compartidos\n- J25: Recordatorio webinar\n- V26: Recap webinar + CTA\n\n## Cierre\n- L29: Post resumen del mes\n- M30: Pregunta para próximo mes`
  },
  {
    module: 'agents',
    title: 'AI Crew — Estrategia Lanzamiento de Producto',
    prompt: 'Coordinación de 3 agentes IA para diseñar estrategia completa de lanzamiento',
    metadata: { sample: true, mode: 'orchestrated', agents: ['researcher', 'strategist', 'copywriter'] },
    content: `## 🔬 Researcher\nMercado SaaS productividad: 18.4B USD, +14% YoY. Competidores top: Notion, ClickUp, Monday. Gap detectado: integración nativa con WhatsApp Business para PYMEs latinoamericanas.\n\n## 🎯 Strategist\nPosicionamiento: "El primer CRM que vive dentro de WhatsApp."\nGo-to-market en 3 olas:\n1. Beta cerrada con 50 PYMEs (mes 1-2)\n2. Product Hunt + LATAM influencers (mes 3)\n3. Paid acquisition Meta + partnership con cámaras de comercio (mes 4+)\n\nPrecio freemium: gratis hasta 100 contactos, $29/mes Pro, $99/mes Business.\n\n## ✍️ Copywriter\n**Tagline:** Vende sin salir de WhatsApp.\n**Bullet points:**\n- Sincroniza chats con tu CRM en tiempo real\n- Plantillas de respuesta con IA contextual\n- Reportes de ventas semanales automáticos\n- Sin instalar apps extra: todo desde tu WhatsApp\n\n**Email lanzamiento (asunto):** Tu próximo cliente está en WhatsApp. Tu CRM también debería estarlo.`
  }
];

export async function seedSampleContent(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error('Inicia sesión para cargar muestras');
    return 0;
  }

  const rows = SAMPLE_CONTENT.map(s => ({
    user_id: user.id,
    module: s.module,
    title: s.title,
    prompt: s.prompt,
    content: s.content,
    metadata: { ...(s.metadata ?? {}), sample: true },
  }));

  const { data, error } = await supabase
    .from('generated_content')
    .insert(rows)
    .select('id');

  if (error) {
    toast.error('Error cargando muestras: ' + error.message);
    return 0;
  }
  toast.success(`✨ ${data?.length ?? 0} muestras cargadas`);
  return data?.length ?? 0;
}
