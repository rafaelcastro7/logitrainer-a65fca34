import { useState, useCallback, useRef, useEffect } from 'react';
import { Bot, Brain, Search, PenTool, CheckCircle2, Palette, BarChart3, Play, Square, Trash2, Settings2, ChevronDown, ChevronUp, Sparkles, Loader2, Clock, Zap, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';
import ContentHistoryPanel from './ContentHistoryPanel';

// Agent definitions for UI display
const AGENT_DEFS = [
  { id: 'orchestrator', name: 'Orchestrator', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-500/10', role: 'Manager & Task Decomposer', description: 'Analiza tareas complejas, las descompone en sub-tareas y asigna a los agentes especialistas.' },
  { id: 'researcher', name: 'Researcher', icon: Search, color: 'text-blue-500', bgColor: 'bg-blue-500/10', role: 'Market Intelligence', description: 'Investiga mercados, competencia, tendencias y recopila datos específicos con fuentes.' },
  { id: 'writer', name: 'Writer', icon: PenTool, color: 'text-green-500', bgColor: 'bg-green-500/10', role: 'Content Specialist', description: 'Crea contenido premium con storytelling, frameworks de conversión y datos reales.' },
  { id: 'editor', name: 'Editor', icon: CheckCircle2, color: 'text-amber-500', bgColor: 'bg-amber-500/10', role: 'Quality Reviewer', description: 'Revisa y mejora contenido, corrige formato, agrega datos faltantes y asegura calidad.' },
  { id: 'strategist', name: 'Strategist', icon: BarChart3, color: 'text-red-500', bgColor: 'bg-red-500/10', role: 'Marketing Strategy', description: 'Diseña estrategias de marketing, embudos, pricing y planes de implementación.' },
  { id: 'designer', name: 'Designer', icon: Palette, color: 'text-pink-500', bgColor: 'bg-pink-500/10', role: 'Visual & UX Direction', description: 'Proporciona dirección visual, paletas de colores, layouts y recomendaciones de diseño.' },
];

interface AgentLog {
  id: string;
  agentId: string;
  timestamp: Date;
  status: 'running' | 'completed' | 'error' | 'skipped';
  message: string;
  duration?: number;
  tokensUsed?: number;
}

interface OrchestratorTask {
  id: string;
  prompt: string;
  mode: 'orchestrated' | 'pipeline' | 'simple';
  pipeline?: string[];
  agent?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  output: string;
  logs: AgentLog[];
}

export default function AgentOrchestratorPanel() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'orchestrated' | 'pipeline' | 'simple'>('orchestrated');
  const [selectedAgent, setSelectedAgent] = useState('writer');
  const [selectedPipeline, setSelectedPipeline] = useState<string[]>(['researcher', 'writer', 'editor']);
  const [tasks, setTasks] = useState<OrchestratorTask[]>([]);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(true);
  const [agentStatus, setAgentStatus] = useState<Record<string, 'idle' | 'active' | 'done' | 'error'>>({});
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const contentStore = useGeneratedContent('ai-crew');

  const togglePipelineAgent = (agentId: string) => {
    setSelectedPipeline(prev =>
      prev.includes(agentId)
        ? prev.filter(a => a !== agentId)
        : [...prev, agentId]
    );
  };

  const executeTask = useCallback(async () => {
    if (!prompt.trim() || isRunning) return;

    const taskId = crypto.randomUUID();
    const task: OrchestratorTask = {
      id: taskId,
      prompt: prompt.trim(),
      mode,
      pipeline: mode === 'pipeline' ? selectedPipeline : undefined,
      agent: mode === 'simple' ? selectedAgent : undefined,
      status: 'running',
      startTime: new Date(),
      output: '',
      logs: [],
    };

    setTasks(prev => [task, ...prev]);
    setActiveTask(taskId);
    setIsRunning(true);
    setAgentStatus({});

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt.trim() }],
          mode,
          agent: mode === 'simple' ? selectedAgent : undefined,
          pipeline: mode === 'pipeline' ? selectedPipeline : undefined,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullOutput = '';
      let currentAgent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;

          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullOutput += content;

              // Detect agent transitions
              const agentMatch = content.match(/### (🎯|🔍|✍️|📝|🧠|🎨) (\w+)/);
              if (agentMatch) {
                const agentName = agentMatch[2].toLowerCase();
                if (currentAgent && currentAgent !== agentName) {
                  setAgentStatus(prev => ({ ...prev, [currentAgent]: 'done' }));
                }
                currentAgent = agentName;
                setAgentStatus(prev => ({ ...prev, [agentName]: 'active' }));

                setTasks(prev => prev.map(t =>
                  t.id === taskId ? {
                    ...t,
                    logs: [...t.logs, {
                      id: crypto.randomUUID(),
                      agentId: agentName,
                      timestamp: new Date(),
                      status: 'running',
                      message: `${agentMatch[0]} iniciado`,
                    }]
                  } : t
                ));
              }

              setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, output: fullOutput } : t
              ));
            }
          } catch {}
        }
      }

      // Mark all active agents as done
      setAgentStatus(prev => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          if (next[k] === 'active') next[k] = 'done';
        }
        return next;
      });

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed', endTime: new Date() } : t
      ));

      toast.success('✅ Tarea completada por los agentes');
      // Auto-save
      contentStore.saveContent({
        title: prompt.trim().slice(0, 80),
        prompt: prompt.trim(),
        content: fullOutput,
        metadata: { mode, agent: mode === 'simple' ? selectedAgent : undefined, pipeline: mode === 'pipeline' ? selectedPipeline : undefined },
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: 'error', endTime: new Date(), output: t.output + '\n\n⏹️ Detenido por el usuario' } : t
        ));
        toast.info('Ejecución detenida');
      } else {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: 'error', endTime: new Date(), output: t.output + `\n\n❌ Error: ${e.message}` } : t
        ));
        toast.error(e.message);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [prompt, mode, selectedAgent, selectedPipeline, isRunning]);

  const stopExecution = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const clearHistory = () => {
    setTasks([]);
    setActiveTask(null);
    setAgentStatus({});
  };

  const activeTaskData = tasks.find(t => t.id === activeTask);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current && isRunning) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeTaskData?.output, isRunning]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Crew — Orquestador de Agentes</h1>
            <p className="text-xs text-muted-foreground">Sistema multi-agente con especialistas coordinados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {AGENT_DEFS.length} agentes
          </Badge>
          {tasks.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs">
              <Trash2 className="w-3 h-3 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config + Agents */}
        <div className="space-y-4">
          {/* Agent Status Cards */}
          <Collapsible open={expandedAgents} onOpenChange={setExpandedAgents}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Agentes Disponibles
                </span>
                {expandedAgents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {AGENT_DEFS.filter(a => a.id !== 'orchestrator').map(agent => {
                  const Icon = agent.icon;
                  const status = agentStatus[agent.id] || 'idle';
                  const isInPipeline = mode === 'pipeline' && selectedPipeline.includes(agent.id);
                  const isSelected = mode === 'simple' && selectedAgent === agent.id;

                  return (
                    <Card
                      key={agent.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all border",
                        status === 'active' && "border-primary ring-1 ring-primary/30 bg-primary/5",
                        status === 'done' && "border-green-500/30 bg-green-500/5",
                        status === 'error' && "border-destructive/30 bg-destructive/5",
                        isInPipeline && "border-primary/40",
                        isSelected && "border-primary ring-1 ring-primary/30",
                        !isInPipeline && !isSelected && status === 'idle' && "border-border/50 hover:border-border"
                      )}
                      onClick={() => {
                        if (mode === 'pipeline') togglePipelineAgent(agent.id);
                        else if (mode === 'simple') setSelectedAgent(agent.id);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", agent.bgColor)}>
                          {status === 'active' ? (
                            <Loader2 className={cn("w-4 h-4 animate-spin", agent.color)} />
                          ) : (
                            <Icon className={cn("w-4 h-4", agent.color)} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{agent.name}</span>
                            {status === 'active' && <Badge className="text-[9px] h-4 bg-primary/20 text-primary">Activo</Badge>}
                            {status === 'done' && <Badge className="text-[9px] h-4 bg-green-500/20 text-green-600">✓</Badge>}
                            {(isInPipeline || isSelected) && status === 'idle' && (
                              <Badge variant="outline" className="text-[9px] h-4">Seleccionado</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{agent.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Task History */}
          {tasks.length > 0 && (
            <Collapsible open={expandedLogs} onOpenChange={setExpandedLogs}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Historial ({tasks.length})
                  </span>
                  {expandedLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 mt-2">
                  {tasks.slice(0, 10).map(task => (
                    <button
                      key={task.id}
                      onClick={() => setActiveTask(task.id)}
                      className={cn(
                        "w-full text-left p-2 rounded-md text-xs transition-all",
                        activeTask === task.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {task.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        {task.status === 'error' && <span className="text-destructive">✗</span>}
                        <span className="truncate flex-1">{task.prompt.slice(0, 60)}...</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] h-3.5">{task.mode}</Badge>
                        {task.endTime && (
                          <span className="text-[9px] text-muted-foreground">
                            {Math.round((task.endTime.getTime() - task.startTime.getTime()) / 1000)}s
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Center + Right: Input + Output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input Area */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orchestrated">
                    <span className="flex items-center gap-1.5">🎯 Orquestado</span>
                  </SelectItem>
                  <SelectItem value="pipeline">
                    <span className="flex items-center gap-1.5">⛓️ Pipeline</span>
                  </SelectItem>
                  <SelectItem value="simple">
                    <span className="flex items-center gap-1.5">⚡ Agente único</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              {mode === 'pipeline' && (
                <span className="text-[10px] text-muted-foreground">
                  Pipeline: {selectedPipeline.map(id => AGENT_DEFS.find(a => a.id === id)?.name).join(' → ')}
                </span>
              )}
              {mode === 'simple' && (
                <span className="text-[10px] text-muted-foreground">
                  Agente: {AGENT_DEFS.find(a => a.id === selectedAgent)?.name}
                </span>
              )}
            </div>

            <Textarea
              placeholder="Describe la tarea para los agentes... Ej: 'Crea un ebook completo sobre marketing digital con investigación de mercado, contenido premium y revisión de calidad'"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) executeTask();
              }}
            />

            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button onClick={stopExecution} variant="destructive" size="sm" className="gap-1.5">
                  <Square className="w-3 h-3" /> Detener
                </Button>
              ) : (
                <Button onClick={executeTask} size="sm" className="gap-1.5" disabled={!prompt.trim()}>
                  <Play className="w-3 h-3" /> Ejecutar
                </Button>
              )}
              <span className="text-[10px] text-muted-foreground">⌘+Enter para ejecutar</span>
            </div>
          </Card>

          {/* Output Area */}
          {activeTaskData && (
            <Card className="overflow-hidden">
              <div className="p-3 border-b border-border/30 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  {activeTaskData.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                  {activeTaskData.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  <span className="text-xs font-medium text-foreground truncate max-w-[300px]">
                    {activeTaskData.prompt.slice(0, 80)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px]">{activeTaskData.mode}</Badge>
                  {activeTaskData.endTime && (
                    <Badge variant="secondary" className="text-[9px]">
                      {Math.round((activeTaskData.endTime.getTime() - activeTaskData.startTime.getTime()) / 1000)}s
                    </Badge>
                  )}
                </div>
              </div>

              {isRunning && (
                <div className="px-3 py-1.5">
                  <Progress value={undefined} className="h-1" />
                </div>
              )}

              <ScrollArea className="h-[500px]">
                <div ref={outputRef} className="p-4 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeTaskData.output || '_Esperando respuesta de los agentes..._'}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Empty state */}
          {!activeTaskData && (
            <Card className="p-12 text-center">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-medium text-foreground mb-1">AI Crew listo para trabajar</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Describe una tarea y los agentes especializados se coordinarán para producir contenido premium.
                Puedes elegir modo orquestado (automático), pipeline (secuencial) o agente único.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  'Crea un ebook sobre IA para negocios',
                  'Diseña una estrategia de lanzamiento',
                  'Genera anuncios para Instagram',
                  'Investiga el mercado de SaaS',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* History sidebar */}
        <div className="hidden xl:block w-72 shrink-0 space-y-4">
          <ContentHistoryPanel
            items={contentStore.items}
            loading={contentStore.loading}
            selectedItem={contentStore.selectedItem}
            onSelect={(item) => { contentStore.setSelectedItem(item); toast.info(`Cargado: ${item.title}`); }}
            onDelete={contentStore.deleteItem}
            onToggleFavorite={contentStore.toggleFavorite}
            moduleLabel="AI Crew"
          />
        </div>
      </div>
    </div>
  );
}
