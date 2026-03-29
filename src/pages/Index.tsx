import { useState, useCallback, useEffect, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useProjects } from '@/hooks/useProjects';
import { useAutoSave, getAutoSavedProject, clearAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import StudioLayout from '@/components/studio/StudioLayout';
import WelcomeScreen from '@/components/studio/WelcomeScreen';
import DashboardView from '@/components/studio/DashboardView';
import EditorView from '@/components/studio/EditorView';
import PreviewView from '@/components/studio/PreviewView';
import AssetsView from '@/components/studio/AssetsView';
import ApiManagementView from '@/components/studio/ApiManagementView';
import ProductionAnalytics from '@/components/studio/ProductionAnalytics';
import MultiSourceImport from '@/components/studio/MultiSourceImport';
import ExportHub from '@/components/studio/ExportHub';
import AboutView from '@/components/studio/AboutView';
import StockMediaPanel from '@/components/studio/StockMediaPanel';
import OnboardingTour from '@/components/studio/OnboardingTour';
import AuthDialog from '@/components/studio/AuthDialog';
import ProjectsDialog from '@/components/studio/ProjectsDialog';
import AdminApprovalPanel from '@/components/studio/AdminApprovalPanel';
import PendingApprovalScreen from '@/components/studio/PendingApprovalScreen';
import EbookGenerator from '@/components/studio/EbookGenerator';
import LandingPageBuilder from '@/components/studio/LandingPageBuilder';
import AdCreativeGenerator from '@/components/studio/AdCreativeGenerator';
import PresentationGenerator from '@/components/studio/PresentationGenerator';
import ContentCalendar from '@/components/studio/ContentCalendar';
import EmailSequenceBuilder from '@/components/studio/EmailSequenceBuilder';
import ReferralPanel from '@/components/studio/ReferralPanel';
import AIChatAssistant from '@/components/studio/AIChatAssistant';
import FunnelBuilder from '@/components/studio/FunnelBuilder';
import VSLScriptGenerator from '@/components/studio/VSLScriptGenerator';
import OfferBuilder from '@/components/studio/OfferBuilder';
import LeadMagnetGenerator from '@/components/studio/LeadMagnetGenerator';
import WebinarSimulator from '@/components/studio/WebinarSimulator';
import ResearchAIPanel from '@/components/studio/ResearchAIPanel';
import AgentOrchestratorPanel from '@/components/studio/AgentOrchestratorPanel';
import { Scene, Project, DEFAULT_PROJECT, VideoTemplate } from '@/types/project';
import { generateScript, generateImage, generateTTS, trackUsage, getUserApiKeys } from '@/services/apiService';
import { type Priority } from '@/services/smartRouter';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { Loader2, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const {
    project, activeTab, setActiveTab,
    updateMeta, setScenes, updateScene, removeScene, addScene, reorderScenes,
    loadProject, resetProject, undo, redo, canUndo, canRedo,
    updateBackgroundMusic,
  } = useProject();
  const { user, loading: authLoading, signUp, signIn, signOut, approvalStatus, isApproved } = useAuth();
  const { isAdmin } = useAdmin(user);
  const { savedProjects, loading: projectsLoading, currentProjectId, setCurrentProjectId, saveProject, deleteProject, generateShareLink, loadSharedProject } = useProjects(user);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isMusicGenerating, setIsMusicGenerating] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [routerPriority, setRouterPriority] = useState<Priority>('cost');
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasProject = project.scenes.length > 0;
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('logitrainer-onboarded');
  });

  // Load connected providers
  useEffect(() => {
    if (user) {
      getUserApiKeys().then(keys => {
        const active = new Set(Object.entries(keys).filter(([, v]) => v.is_active).map(([k]) => k));
        setConnectedProviders(active);
      });
    }
  }, [user]);

  useAutoSave(project, hasProject);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const params = new URLSearchParams(window.location.search);
    const sharedToken = params.get('shared');
    if (sharedToken) {
      loadSharedProject(sharedToken).then(p => {
        if (p) {
          loadProject(p);
          toast.success(t.sharedProjectLoaded);
          setActiveTab('editor');
        }
      });
      return;
    }

    const autoSaved = getAutoSavedProject();
    if (autoSaved && autoSaved.scenes?.length > 0) {
      loadProject(autoSaved);
      toast.info(t.autoSaveRecovered);
    }
  }, [initialized]);

  const handleSave = useCallback(async () => {
    if (!user) { setAuthOpen(true); return; }
    setIsSaving(true);
    await saveProject(project);
    clearAutoSave();
    setLastSaved(new Date());
    setIsSaving(false);
  }, [user, project, saveProject]);

  const handleLoadProject = useCallback((p: Project, id: string) => {
    loadProject(p);
    setCurrentProjectId(id);
    setActiveTab('editor');
  }, [loadProject, setCurrentProjectId, setActiveTab]);

  const handleNewProject = useCallback(() => {
    resetProject();
    setCurrentProjectId(null);
    clearAutoSave();
    toast.info(t.newProjectCreated);
  }, [resetProject, setCurrentProjectId, t]);

  const shortcutHandlers = useMemo(() => ({
    onSave: () => handleSave(),
    onUndo: undo,
    onRedo: redo,
    onNewProject: handleNewProject,
    onPreview: () => setActiveTab('preview'),
  }), [handleSave, undo, redo, handleNewProject, setActiveTab]);
  useKeyboardShortcuts(shortcutHandlers);

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
        transition: 'fade' as const,
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

  const handleGenerateAllAudios = useCallback(async () => {
    const pendingScenes = project.scenes.filter(s => s.audio.status !== 'completed' && s.script.trim());
    if (pendingScenes.length === 0) {
      toast.info(t.toastAllAudiosReady);
      return;
    }

    toast.info(t.toastBatchAudios(pendingScenes.length));
    for (const scene of pendingScenes) {
      await handleRegenerateAudio(scene.id);
      await new Promise(r => setTimeout(r, 1500));
    }
  }, [project.scenes, handleRegenerateAudio, t]);

  const handleGenerateMusic = useCallback(async (prompt: string) => {
    setIsMusicGenerating(true);
    updateBackgroundMusic({ status: 'generating', prompt });
    toast.info(t.generatingMusic);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, duration: 30 }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Music generation failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      updateBackgroundMusic({
        url: audioUrl,
        name: prompt.slice(0, 50),
        status: 'ready',
        prompt,
      });
      toast.success('🎵 ' + (t.ready || 'Ready'));
    } catch (error) {
      console.error('Music generation error:', error);
      updateBackgroundMusic({ status: 'error' });
      toast.error(error instanceof Error ? error.message : t.musicError);
    } finally {
      setIsMusicGenerating(false);
    }
  }, [updateBackgroundMusic, t]);

  const handleDuplicateScene = useCallback((scene: Scene) => {
    const newScene: Scene = {
      ...scene,
      id: crypto.randomUUID(),
      name: `${scene.name} ${t.copy}`,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
      transition: scene.transition || 'fade',
    };
    addScene(newScene);
    toast.info(t.toastDuplicated);
  }, [addScene, t]);

  const handleApplyTemplate = useCallback((template: VideoTemplate) => {
    if (template.meta) {
      updateMeta(template.meta);
    }
  }, [updateMeta]);

  const handleConnectProvider = useCallback((providerId: string) => {
    toast.info(t.toastConnectProvider(providerId));
  }, [t]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/8 rounded-2xl blur-2xl scale-[2] animate-pulse-glow" />
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/10">
            <Film className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/60" />
            <span className="text-sm font-display font-bold text-foreground">LogiTrainer Studio</span>
          </div>
          <span className="text-[10px] text-muted-foreground/40">Loading workspace...</span>
        </div>
      </div>
    );
  }

  // Show pending approval screen for non-approved authenticated users
  if (user && !isApproved && approvalStatus && approvalStatus !== 'approved') {
    return <PendingApprovalScreen status={approvalStatus} onSignOut={signOut} />;
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('logitrainer-onboarded', 'true');
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && (
        <OnboardingTour
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
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
        onNewProject={handleNewProject}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
        onReorderScenes={(newScenes) => setScenes(newScenes)}
        onUpdateScene={updateScene}
        onRegenerateImage={handleRegenerateImage}
        onRegenerateAudio={handleRegenerateAudio}
        onDuplicateScene={handleDuplicateScene}
        onRemoveScene={removeScene}
        isAdmin={isAdmin}
        onGenerateAllImages={handleGenerateAllImages}
        onGenerateAllAudios={handleGenerateAllAudios}
        lastSaved={lastSaved}
        isSaving={isSaving}
      >
        {!hasProject && activeTab === 'dashboard' ? (
          <WelcomeScreen
            onStart={handleGenerate}
            isGenerating={isGenerating}
            onApplyTemplate={handleApplyTemplate}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                meta={project.meta}
                onUpdateMeta={updateMeta}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                scenesCount={project.scenes.length}
                backgroundMusic={project.backgroundMusic}
                onUpdateMusic={updateBackgroundMusic}
                onGenerateMusic={handleGenerateMusic}
                isMusicGenerating={isMusicGenerating}
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
                onGenerateAllAudios={handleGenerateAllAudios}
                projectLanguage={project.meta.language}
                project={project}
                onLoadProject={loadProject}
              />
            )}
            {activeTab === 'preview' && (
              <PreviewView scenes={project.scenes} backgroundMusic={project.backgroundMusic} aspectRatio={project.meta.aspectRatio} />
            )}
            {activeTab === 'assets' && (
              <div className="max-w-5xl mx-auto space-y-6 p-6">
                <AssetsView scenes={project.scenes} />
                <StockMediaPanel
                  onSelectImage={(url, name) => {
                    toast.success(`📸 ${name} ready to use`);
                  }}
                />
                <MultiSourceImport
                  onImportImage={(url, name) => {
                    toast.success(`🖼️ ${name} listo para usar en escenas`);
                  }}
                />
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="max-w-5xl mx-auto p-6">
                <ProductionAnalytics
                  scenesCount={project.scenes.length}
                  completedImages={project.scenes.filter(s => s.image.status === 'completed').length}
                  completedAudios={project.scenes.filter(s => s.audio.status === 'completed').length}
                  connectedProviders={connectedProviders}
                  priority={routerPriority}
                  onChangePriority={setRouterPriority}
                />
              </div>
            )}
            {activeTab === 'export' && (
              <ExportHub project={project} scenes={project.scenes} />
            )}
            {activeTab === 'apis' && (
              <ApiManagementView onConnectProvider={handleConnectProvider} isAuthenticated={!!user} />
            )}
            {activeTab === 'about' && (
              <AboutView onNavigate={setActiveTab} />
            )}
            {activeTab === 'admin' && (
              <AdminApprovalPanel user={user} />
            )}
            {activeTab === 'ebooks' && <EbookGenerator />}
            {activeTab === 'landing' && <LandingPageBuilder />}
            {activeTab === 'ads' && <AdCreativeGenerator />}
            {activeTab === 'presentations' && <PresentationGenerator />}
            {activeTab === 'content-calendar' && <ContentCalendar />}
            {activeTab === 'email-sequences' && <EmailSequenceBuilder />}
            {activeTab === 'referrals' && <ReferralPanel user={user} />}
            {activeTab === 'funnels' && <FunnelBuilder />}
            {activeTab === 'vsl-scripts' && <VSLScriptGenerator />}
            {activeTab === 'offers' && <OfferBuilder />}
            {activeTab === 'lead-magnets' && <LeadMagnetGenerator />}
            {activeTab === 'webinar' && <WebinarSimulator />}
            {activeTab === 'research' && <ResearchAIPanel />}
            {activeTab === 'ai-chat' && <AIChatAssistant />}
            {activeTab === 'agents' && <AgentOrchestratorPanel />}
          </>
        )}
        {activeTab !== 'ai-chat' && <AIChatAssistant />}
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
