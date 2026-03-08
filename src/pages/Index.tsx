import { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import StudioLayout from '@/components/studio/StudioLayout';
import DashboardView from '@/components/studio/DashboardView';
import EditorView from '@/components/studio/EditorView';
import PreviewView from '@/components/studio/PreviewView';
import AssetsView from '@/components/studio/AssetsView';
import { Scene } from '@/types/project';
import { toast } from 'sonner';

export default function Index() {
  const { project, activeTab, setActiveTab, updateMeta, setScenes, updateScene, removeScene, addScene } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (topic: string) => {
    setIsGenerating(true);
    toast.info('Generando estructura del video...');

    // Demo: create sample scenes since AI is not connected yet
    setTimeout(() => {
      const demoScenes: Scene[] = [
        {
          id: crypto.randomUUID(),
          name: 'Introducción',
          script: `Bienvenidos a este video sobre ${topic}. Hoy exploraremos los aspectos más fascinantes de este tema.`,
          image_prompt: `A cinematic establishing shot representing ${topic}, ${project.meta.visualStyle}`,
          duration: project.meta.secondsPerScene,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'zoom_in', intensity: 0.3 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: 'Contexto Histórico',
          script: `Para entender ${topic}, debemos remontarnos a sus orígenes y comprender el contexto que lo hizo posible.`,
          image_prompt: `Historical context visualization for ${topic}, vintage documentary style, ${project.meta.visualStyle}`,
          duration: project.meta.secondsPerScene,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'pan_left', intensity: 0.4 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: 'Desarrollo Principal',
          script: `El aspecto más importante de ${topic} es su impacto en la sociedad moderna y cómo ha transformado nuestra forma de entender el mundo.`,
          image_prompt: `Modern impact visualization of ${topic}, dynamic composition, ${project.meta.visualStyle}`,
          duration: project.meta.secondsPerScene,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'zoom_out', intensity: 0.5 },
          notes: '',
        },
        {
          id: crypto.randomUUID(),
          name: 'Conclusión',
          script: `En resumen, ${topic} representa uno de los temas más relevantes de nuestra era. Esperamos que este video haya sido informativo y útil.`,
          image_prompt: `Inspiring conclusion scene for ${topic}, hopeful mood, golden hour lighting, ${project.meta.visualStyle}`,
          duration: project.meta.secondsPerScene,
          audio: { status: 'pending', url: null },
          image: { status: 'pending', url: null },
          animation: { type: 'zoom_in', intensity: 0.3 },
          notes: '',
        },
      ];

      setScenes(demoScenes);
      setIsGenerating(false);
      setActiveTab('editor');
      toast.success(`¡${demoScenes.length} escenas generadas!`);
    }, 1500);
  };

  return (
    <StudioLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <DashboardView
          meta={project.meta}
          onUpdateMeta={updateMeta}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}
      {activeTab === 'editor' && (
        <EditorView
          scenes={project.scenes}
          onUpdateScene={updateScene}
          onRemoveScene={removeScene}
          onAddScene={addScene}
        />
      )}
      {activeTab === 'preview' && (
        <PreviewView scenes={project.scenes} />
      )}
      {activeTab === 'assets' && (
        <AssetsView scenes={project.scenes} />
      )}
    </StudioLayout>
  );
}
