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
  resources: {
    images: AssetResource[];
    audios: AssetResource[];
  };
}

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
};

export const DEFAULT_PROJECT: Project = {
  meta: DEFAULT_META,
  scenes: [],
  resources: { images: [], audios: [] },
};
