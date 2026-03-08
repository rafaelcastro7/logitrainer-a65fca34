import { useState, useCallback, useEffect } from 'react';
import { useProject } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import StudioLayout from '@/components/studio/StudioLayout';
import WelcomeScreen from '@/components/studio/WelcomeScreen';
import DashboardView from '@/components/studio/DashboardView';
import EditorView from '@/components/studio/EditorView';
import PreviewView from '@/components/studio/PreviewView';
import AssetsView from '@/components/studio/AssetsView';
import ApiManagementView from '@/components/studio/ApiManagementView';
import AboutView from '@/components/studio/AboutView';
import AuthDialog from '@/components/studio/AuthDialog';
import ProjectsDialog from '@/components/studio/ProjectsDialog';
import { Scene, Project, DEFAULT_PROJECT } from '@/types/project';
import { generateScript, generateImage, generateTTS, trackUsage } from '@/services/apiService';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

export default function Index() {
  const {
    project, activeTab, setActiveTab,
    updateMeta, setScenes, updateScene, removeScene, addScene, reorderScenes,
  } = useProject();
  const { user, signUp, signIn, signOut } = useAuth();
  const { savedProjects, loading: projectsLoading, currentProjectId, setCurrentProjectId, saveProject, deleteProject, generateShareLink, loadSharedProject } = useProjects(user);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const hasProject = project.scenes.length > 0;
  const { t } = useTranslation();

  // Load shared project from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedToken = params.get('shared');
    if (sharedToken) {
      loadSharedProject(sharedToken).then(p => {
        if (p) {
          setScenes(p.scenes);
          if (p.meta) {
            Object.entries(p.meta).forEach(([key, value]) => {
              updateMeta({ [key]: value });
            });
          }
          toast.success('Shared project loaded');
          setActiveTab('editor');
        }
      });
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) { setAuthOpen(true); return; }
    await saveProject(project);
  }, [user, project, saveProject]);

  const handleLoadProject = useCallback((p: Project, id: string) => {
    setScenes(p.scenes || []);
    if (p.meta) {
      Object.entries(p.meta).forEach(([key, value]) => {
        updateMeta({ [key]: value });
      });
    }
    setCurrentProjectId(id);
    setActiveTab('editor');
  }, [setScenes, updateMeta, setCurrentProjectId, setActiveTab]);

  const handleGenerate = useCallback(async (topic: string) => {
    setIsGenerating(true);
    toast.info(t.toastGenerating, { duration: 3000 });

    try {
      const result = await generateScript({
        topic,
        language: project.meta.language,
        durationTarget: project.meta.durationTarget,
        scenesCount: Math.floor(project.meta.durationTarget / project.meta.secondsPerScene),
        visualStyle: project.meta.visualStyle,
        modelTier: project.meta.modelTier,
      });

      trackUsage({
        provider: 'lovable-ai',
        model: result.usage.model,
        type: 'script',
        tokens: result.usage.total_tokens || result.usage.prompt_tokens + result.usage.completion_tokens,
        timestamp: Date.now(),
      });

      const scenes: Scene[] = result.scenes.map(s => ({
        id: crypto.randomUUID(),
        name: s.name,
        script: s.script,
        image_prompt: s.image_prompt,
        duration: s.duration || project.meta.secondsPerScene,
        audio: { status: 'pending', url: null },
        image: { status: 'pending', url: null },
        animation: { type: 'zoom_in', intensity: 0.3 },
        notes: '',
      }));

      setScenes(scenes);
      setActiveTab('editor');
      toast.success(t.toastScenesGenerated(scenes.length, result.usage.model));
    } catch (error) {
      console.error('Script generation error:', error);
      toast.error(error instanceof Error ? error.message : t.toastErrorScript);
    } finally {
      setIsGenerating(false);
    }
  }, [project.meta, setScenes, setActiveTab, t]);

  const handleRegenerateImage = useCallback(async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    updateScene(sceneId, { image: { status: 'generating', url: null } });
    toast.info(t.toastGeneratingImage(scene.name));

    try {
      const result = await generateImage({
        prompt: scene.image_prompt,
        modelTier: project.meta.modelTier,
      });

      trackUsage({
        provider: 'lovable-ai',
        model: result.usage.model,
        type: 'image',
        tokens: result.usage.prompt_tokens + result.usage.completion_tokens,
        timestamp: Date.now(),
      });

      updateScene(sceneId, { image: { status: 'completed', url: result.imageUrl } });
      toast.success(t.toastImageGenerated(scene.name));
    } catch (error) {
      console.error('Image generation error:', error);
      updateScene(sceneId, { image: { status: 'error', url: null } });
      toast.error(error instanceof Error ? error.message : t.toastErrorImage);
    }
  }, [project.scenes, project.meta.modelTier, updateScene, t]);

  const handleRegenerateAudio = useCallback(async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene || !scene.script.trim()) {
      toast.error(t.toastNeedScript);
      return;
    }

    updateScene(sceneId, { audio: { status: 'generating', url: null } });
    toast.info(t.toastGeneratingAudio(scene.name));

    try {
      const result = await generateTTS({
        text: scene.script,
        voiceName: scene.voiceName || project.meta.voiceName,
        emotion: project.meta.defaultEmotion,
      });

      trackUsage({
        provider: result.provider,
        model: result.provider === 'elevenlabs' ? 'eleven_multilingual_v2' : 'gemini-tts',
        type: 'tts',
        tokens: scene.script.length,
        timestamp: Date.now(),
      });

      if (result.audioBase64) {
        const audioUrl = `data:audio/mpeg;base64,${result.audioBase64}`;
        updateScene(sceneId, { audio: { status: 'completed', url: audioUrl } });
        toast.success(t.toastAudioGenerated(result.provider));
      } else {
        updateScene(sceneId, { audio: { status: 'completed', url: null } });
        toast.info(result.message || t.toastAudioFallback);
      }
    } catch (error) {
      console.error('TTS error:', error);
      updateScene(sceneId, { audio: { status: 'error', url: null } });
      toast.error(error instanceof Error ? error.message : 'TTS error');
    }
  }, [project.scenes, project.meta, updateScene, t]);

  const handleGenerateAllImages = useCallback(async () => {
    const pendingScenes = project.scenes.filter(s => s.image.status !== 'completed');
    if (pendingScenes.length === 0) {
      toast.info(t.toastAllImagesReady);
      return;
    }

    toast.info(t.toastBatchImages(pendingScenes.length));
    for (const scene of pendingScenes) {
      await handleRegenerateImage(scene.id);
      await new Promise(r => setTimeout(r, 1000));
    }
  }, [project.scenes, handleRegenerateImage, t]);

  const handleDuplicateScene = useCallback((scene: Scene) => {
    const newScene: Scene = {
      ...scene,
      id: crypto.randomUUID(),
      name: `${scene.name} ${t.copy}`,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
    };
    addScene(newScene);
    toast.info(t.toastDuplicated);
  }, [addScene, t]);

  const handleConnectProvider = useCallback((providerId: string) => {
    toast.info(t.toastConnectProvider(providerId));
  }, [t]);

  return (
    <>
      <StudioLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scenes={project.scenes}
        hasProject={hasProject}
        user={user}
        onSave={handleSave}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={signOut}
      >
        {!hasProject && activeTab === 'dashboard' ? (
          <WelcomeScreen onStart={handleGenerate} isGenerating={isGenerating} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                meta={project.meta}
                onUpdateMeta={updateMeta}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                scenesCount={project.scenes.length}
              />
            )}
            {activeTab === 'editor' && (
              <EditorView
                scenes={project.scenes}
                onUpdateScene={updateScene}
                onRemoveScene={removeScene}
                onAddScene={addScene}
                onReorder={reorderScenes}
                onDuplicateScene={handleDuplicateScene}
                onRegenerateImage={handleRegenerateImage}
                onRegenerateAudio={handleRegenerateAudio}
                onGenerateAllImages={handleGenerateAllImages}
              />
            )}
            {activeTab === 'preview' && (
              <PreviewView scenes={project.scenes} />
            )}
            {activeTab === 'assets' && (
              <AssetsView scenes={project.scenes} />
            )}
            {activeTab === 'apis' && (
              <ApiManagementView onConnectProvider={handleConnectProvider} />
            )}
            {activeTab === 'about' && (
              <AboutView onNavigate={setActiveTab} />
            )}
          </>
        )}
      </StudioLayout>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      <ProjectsDialog
        open={projectsOpen}
        onOpenChange={setProjectsOpen}
        projects={savedProjects}
        currentProjectId={currentProjectId}
        onLoad={handleLoadProject}
        onDelete={deleteProject}
        onShare={generateShareLink}
        loading={projectsLoading}
      />
    </>
  );
}
