export type AspectRatio = '16:9' | '9:16' | '1:1';
export type TransitionType = 'fade' | 'wipe_left' | 'wipe_right' | 'dissolve' | 'slide_up' | 'none';
export type ExportQuality = '720p' | '1080p' | '4k';

export type SubtitleStyle = 'none' | 'classic' | 'karaoke' | 'fade_word' | 'typewriter' | 'bounce' | 'glow';

export interface BrandKit {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  watermarkPosition: 'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkOpacity: number;
  introText: string;
  outroText: string;
}

export const DEFAULT_BRAND_KIT: BrandKit = {
  logoUrl: '',
  primaryColor: '#6C5CE7',
  secondaryColor: '#A29BFE',
  accentColor: '#FD79A8',
  fontFamily: 'Inter',
  watermarkPosition: 'none',
  watermarkOpacity: 0.3,
  introText: '',
  outroText: '',
};

export interface SubtitleSettings {
  enabled: boolean;
  style: SubtitleStyle;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  animation: boolean;
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  enabled: false,
  style: 'classic',
  fontSize: 24,
  color: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.6,
  position: 'bottom',
  animation: true,
};

export interface ProjectMeta {
  name: string;
  author: string;
  language: string;
  durationTarget: number;
  timingMode: 'strict' | 'flexible';
  secondsPerScene: number;
  visualStyle: string;
  frameOptimization: boolean;
  framesPerChapter: number;
  defaultEmotion: string;
  voiceName?: string;
  modelTier: 'prototyping' | 'production';
  aspectRatio: AspectRatio;
  brandKit: BrandKit;
  subtitles: SubtitleSettings;
}

export interface MediaAsset {
  status: 'pending' | 'generating' | 'completed' | 'error';
  url: string | null;
  duration?: number;
}

export interface AnimationSettings {
  type: 'static' | 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right';
  intensity: number;
}

export interface TextOverlay {
  enabled: boolean;
  text: string;
  position: 'top' | 'center' | 'bottom';
  style: 'title' | 'subtitle' | 'lower_third';
}

export interface Scene {
  id: string;
  name: string;
  script: string;
  image_prompt: string;
  duration: number;
  audio: MediaAsset;
  image: MediaAsset;
  animation: AnimationSettings;
  notes: string;
  voiceName?: string;
  transition: TransitionType;
  textOverlay?: TextOverlay;
}

export interface BackgroundMusic {
  id: string;
  name: string;
  url: string | null;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  status: 'none' | 'generating' | 'ready' | 'error';
  prompt?: string;
}

export interface AssetResource {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'audio';
  createdAt: string;
}

export interface Project {
  meta: ProjectMeta;
  scenes: Scene[];
  backgroundMusic: BackgroundMusic;
  resources: {
    images: AssetResource[];
    audios: AssetResource[];
  };
}

export const DEFAULT_MUSIC: BackgroundMusic = {
  id: crypto.randomUUID(),
  name: '',
  url: null,
  volume: 0.15,
  fadeIn: 2,
  fadeOut: 3,
  loop: true,
  status: 'none',
};

export const DEFAULT_META: ProjectMeta = {
  name: 'Nuevo Proyecto',
  author: '',
  language: 'es',
  durationTarget: 120,
  timingMode: 'flexible',
  secondsPerScene: 8,
  visualStyle: 'Cinematic, photorealistic, 8k resolution, dramatic lighting',
  frameOptimization: true,
  framesPerChapter: 3,
  defaultEmotion: 'professional',
  voiceName: 'Kore',
  modelTier: 'prototyping',
  aspectRatio: '16:9',
  brandKit: DEFAULT_BRAND_KIT,
  subtitles: DEFAULT_SUBTITLE_SETTINGS,
};

export const DEFAULT_PROJECT: Project = {
  meta: DEFAULT_META,
  scenes: [],
  backgroundMusic: DEFAULT_MUSIC,
  resources: { images: [], audios: [] },
};

// ==================== TEMPLATES ====================

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'education' | 'marketing' | 'social' | 'tutorial';
  meta: Partial<ProjectMeta>;
  sampleTopics: string[];
  color: string;
}

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'educational',
    name: 'Educational Video',
    description: 'Structured lessons with clear explanations and visual aids',
    icon: '🎓',
    category: 'education',
    meta: {
      durationTarget: 180,
      secondsPerScene: 10,
      visualStyle: 'Clean educational diagrams, infographic style, bright colors, minimal background, professional',
      defaultEmotion: 'professional',
      voiceName: 'Kore',
    },
    sampleTopics: ['Photosynthesis', 'The Solar System', 'How Electricity Works'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'marketing',
    name: 'Marketing Promo',
    description: 'Eye-catching promotional videos for products and brands',
    icon: '🚀',
    category: 'marketing',
    meta: {
      durationTarget: 60,
      secondsPerScene: 5,
      visualStyle: 'Bold, vibrant, modern advertising style, gradient backgrounds, product showcase, premium feel',
      defaultEmotion: 'energetic',
      voiceName: 'Puck',
    },
    sampleTopics: ['SaaS Product Launch', 'App Promo Video', 'Brand Story'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'social-short',
    name: 'Social Short',
    description: 'Quick vertical videos for TikTok, Reels, and Shorts',
    icon: '📱',
    category: 'social',
    meta: {
      durationTarget: 30,
      secondsPerScene: 4,
      aspectRatio: '9:16' as AspectRatio,
      visualStyle: 'Trendy, bold text overlays, vibrant colors, eye-catching, social media optimized',
      defaultEmotion: 'energetic',
      voiceName: 'Fenrir',
    },
    sampleTopics: ['5 Facts About Space', '3 Tips for Productivity', 'Did You Know?'],
    color: 'from-rose-500 to-orange-500',
  },
  {
    id: 'tutorial',
    name: 'Step-by-Step Tutorial',
    description: 'Detailed how-to guides with numbered steps',
    icon: '📋',
    category: 'tutorial',
    meta: {
      durationTarget: 240,
      secondsPerScene: 12,
      visualStyle: 'Screen recording style, clean UI mockups, step-by-step annotations, numbered overlays',
      defaultEmotion: 'calm',
      voiceName: 'Aoede',
    },
    sampleTopics: ['How to Use Figma', 'Python for Beginners', 'Excel Formulas Guide'],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'documentary',
    name: 'Mini Documentary',
    description: 'Cinematic narratives with dramatic storytelling',
    icon: '🎬',
    category: 'education',
    meta: {
      durationTarget: 300,
      secondsPerScene: 10,
      visualStyle: 'Cinematic, photorealistic, dramatic lighting, 8k resolution, film grain, documentary style',
      defaultEmotion: 'dramatic',
      modelTier: 'production',
      voiceName: 'Charon',
    },
    sampleTopics: ['Rise and Fall of the Roman Empire', 'The Deep Ocean', 'History of AI'],
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'explainer',
    name: 'Explainer Video',
    description: 'Simple animated explanations for complex concepts',
    icon: '💡',
    category: 'marketing',
    meta: {
      durationTarget: 90,
      secondsPerScene: 6,
      visualStyle: 'Flat illustration, 2D animation style, pastel colors, friendly characters, whiteboard style',
      defaultEmotion: 'happy',
      voiceName: 'Leda',
    },
    sampleTopics: ['How Blockchain Works', 'What is Cloud Computing?', 'How DNS Works'],
    color: 'from-indigo-500 to-violet-500',
  },
];

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};

export const EXPORT_QUALITIES: Record<ExportQuality, { label: string; scale: number }> = {
  '720p': { label: '720p (HD)', scale: 0.667 },
  '1080p': { label: '1080p (Full HD)', scale: 1 },
  '4k': { label: '4K (Ultra HD)', scale: 2 },
};
