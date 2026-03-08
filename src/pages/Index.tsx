import { useState, useCallback } from 'react';
import { useProject } from '@/hooks/useProject';
import StudioLayout from '@/components/studio/StudioLayout';
import WelcomeScreen from '@/components/studio/WelcomeScreen';
import DashboardView from '@/components/studio/DashboardView';
import EditorView from '@/components/studio/EditorView';
import PreviewView from '@/components/studio/PreviewView';
import AssetsView from '@/components/studio/AssetsView';
import { Scene } from '@/types/project';
import { toast } from 'sonner';

export default function Index() {
  const {
    project, activeTab, setActiveTab,
    updateMeta, setScenes, updateScene, removeScene, addScene, reorderScenes,
  } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const hasProject = project.scenes.length > 0;

  const handleGenerate = useCallback(async (topic: string) => {
    setIsGenerating(true);
    toast.info('Generando estructura del video...', { duration: 2000 });

    // Demo: simulate AI generation
    setTimeout(() => {
      const style = project.meta.visualStyle;
      const dur = project.meta.secondsPerScene;

      const demoScenes: Scene[] = [
        {
          id: crypto.randomUUID(),
          name: '🎬 Introducción',
          script: `Bienvenidos a este video sobre ${topic}. Hoy exploraremos los aspectos más fascinantes de este tema, desde sus orígenes hasta su impacto en el mundo actual.`,
          image_prompt: `A cinematic establishing shot representing ${topic}, wide angle, dramatic lighting, ${style}`,
          duration: dur,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'zoom_in', intensity: 0.3 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: '📚 Contexto Histórico',
          script: `Para entender ${topic}, debemos remontarnos a sus orígenes. La historia nos muestra cómo este fenómeno surgió y se desarrolló a lo largo del tiempo, transformando sociedades enteras.`,
          image_prompt: `Historical context visualization for ${topic}, vintage documentary style, old photographs mixed with illustrations, ${style}`,
          duration: dur,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'pan_left', intensity: 0.4 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: '🔬 Análisis Detallado',
          script: `Ahora profundicemos en los aspectos más importantes de ${topic}. Los expertos coinciden en que hay varios factores clave que debemos considerar para comprender este tema en su totalidad.`,
          image_prompt: `Detailed analysis visualization of ${topic}, infographic style with data points and diagrams, modern clean design, ${style}`,
          duration: dur,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'zoom_out', intensity: 0.5 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: '🌍 Impacto Global',
          script: `El impacto de ${topic} en la sociedad moderna es innegable. Desde la economía hasta la cultura, su influencia se extiende por todos los rincones del planeta.`,
          image_prompt: `Global impact of ${topic}, world map visualization, interconnected nodes and networks, ${style}`,
          duration: dur,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'pan_right', intensity: 0.3 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: '🔮 Futuro y Conclusión',
          script: `En conclusión, ${topic} seguirá siendo un tema fundamental en los próximos años. Esperamos que este video haya sido útil para comprender mejor este fascinante tema. ¡Gracias por acompañarnos!`,
          image_prompt: `Futuristic conclusion for ${topic}, hopeful mood, golden hour lighting, looking toward the horizon, ${style}`,
          duration: dur,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'zoom_in', intensity: 0.3 },
          notes: '',
        },
      ];

      setScenes(demoScenes);
      setIsGenerating(false);
      setActiveTab('editor');
      toast.success(`¡${demoScenes.length} escenas generadas para "${topic}"!`, { duration: 3000 });
    }, 2000);
  }, [project.meta, setScenes, setActiveTab]);

  const handleDuplicateScene = useCallback((scene: Scene) => {
    const newScene: Scene = {
      ...scene,
      id: crypto.randomUUID(),
      name: `${scene.name} (copia)`,
      audio: { status: 'pending', url: null },
      image: { status: 'pending', url: null },
    };
    addScene(newScene);
    toast.info('Escena duplicada');
  }, [addScene]);

  return (
    <StudioLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      scenes={project.scenes}
      hasProject={hasProject}
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
            />
          )}
          {activeTab === 'preview' && (
            <PreviewView scenes={project.scenes} />
          )}
          {activeTab === 'assets' && (
            <AssetsView scenes={project.scenes} />
          )}
        </>
      )}
    </StudioLayout>
  );
}
