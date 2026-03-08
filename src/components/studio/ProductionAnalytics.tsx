import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Zap, DollarSign, Clock, Gauge,
  Activity, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Cpu, Image, Mic, FileText, Music
} from 'lucide-react';
import { getUsageSummary, getUsageHistory, API_PROVIDERS } from '@/services/apiService';
import { routeTask, estimateProjectCost, type Priority, type TaskType } from '@/services/smartRouter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProductionAnalyticsProps {
  scenesCount: number;
  completedImages: number;
  completedAudios: number;
  connectedProviders: Set<string>;
  priority: Priority;
  onChangePriority: (p: Priority) => void;
}

const taskIcons: Record<string, React.ElementType> = {
  script: FileText, image: Image, tts: Mic, music: Music, research: Zap,
};

export default function ProductionAnalytics({
  scenesCount, completedImages, completedAudios,
  connectedProviders, priority, onChangePriority,
}: ProductionAnalyticsProps) {
  const usage = getUsageSummary();
  const history = getUsageHistory();
  const [showRoutes, setShowRoutes] = useState<TaskType | null>(null);

  const estimate = useMemo(
    () => estimateProjectCost(scenesCount, connectedProviders, priority),
    [scenesCount, connectedProviders, priority]
  );

  const imageProgress = scenesCount > 0 ? (completedImages / scenesCount) * 100 : 0;
  const audioProgress = scenesCount > 0 ? (completedAudios / scenesCount) * 100 : 0;
  const overallProgress = scenesCount > 0 ? ((completedImages + completedAudios) / (scenesCount * 2)) * 100 : 0;

  // Cost trend (last 5 vs previous 5)
  const recentCost = history.slice(-5).reduce((s, r) => s + r.tokens, 0);
  const prevCost = history.slice(-10, -5).reduce((s, r) => s + r.tokens, 0);
  const costTrend = prevCost > 0 ? ((recentCost - prevCost) / prevCost) * 100 : 0;

  const priorities: { value: Priority; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'speed', label: '⚡ Velocidad', icon: Zap, desc: 'Modelos más rápidos' },
    { value: 'quality', label: '🔥 Calidad', icon: Gauge, desc: 'Mejor resultado' },
    { value: 'cost', label: '💰 Economía', icon: DollarSign, desc: 'Menor costo' },
  ];

  const taskTypes: { type: TaskType; label: string }[] = [
    { type: 'script', label: 'Scripts' },
    { type: 'image', label: 'Imágenes' },
    { type: 'tts', label: 'TTS' },
    { type: 'music', label: 'Música' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Production Analytics</h2>
          <p className="text-xs text-muted-foreground">Observabilidad unificada · Inspirado en Viewtinet</p>
        </div>
      </div>

      {/* Priority Selector (Traffic QoS) */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🚦 Smart Router — Prioridad</h3>
        <div className="grid grid-cols-3 gap-2">
          {priorities.map(p => (
            <button
              key={p.value}
              onClick={() => onChangePriority(p.value)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-xl border text-xs transition-all",
                priority === p.value
                  ? "bg-primary/15 border-primary/40 text-primary font-medium shadow-sm"
                  : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <span className="text-lg">{p.label.split(' ')[0]}</span>
              <span className="font-medium">{p.label.split(' ')[1]}</span>
              <span className="text-[10px] text-muted-foreground">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-4 h-4 text-primary/60" />
            <Badge variant="outline" className="text-[9px] h-4">live</Badge>
          </div>
          <p className="text-2xl font-bold text-gradient-primary">{usage.totalCalls}</p>
          <p className="text-[11px] text-muted-foreground">API Calls</p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4 text-primary/60" />
            {costTrend !== 0 && (
              <span className={cn("text-[10px] flex items-center gap-0.5", costTrend > 0 ? "text-destructive" : "text-success")}>
                {costTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(Math.round(costTrend))}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gradient-primary">{usage.totalTokens.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Tokens</p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-4 h-4 text-primary/60" />
          </div>
          <p className="text-2xl font-bold text-gradient-primary">{connectedProviders.size + 1}</p>
          <p className="text-[11px] text-muted-foreground">Proveedores</p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-4 h-4 text-primary/60" />
          </div>
          <p className="text-2xl font-bold text-gradient-primary">{estimate.totalRelativeCost}</p>
          <p className="text-[11px] text-muted-foreground">Costo relativo est.</p>
        </div>
      </div>

      {/* Production Progress */}
      {scenesCount > 0 && (
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Progreso de Producción
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Image className="w-3 h-3" /> Imágenes
                </span>
                <span className="font-medium">{completedImages}/{scenesCount}</span>
              </div>
              <Progress value={imageProgress} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mic className="w-3 h-3" /> Audio/TTS
                </span>
                <span className="font-medium">{completedAudios}/{scenesCount}</span>
              </div>
              <Progress value={audioProgress} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> General
                </span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* Smart Router Recommendations */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Smart Router — Rutas Óptimas
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {taskTypes.map(({ type, label }) => {
            const best = routeTask(type, priority, connectedProviders)[0];
            const TaskIcon = taskIcons[type] || Zap;
            return (
              <button
                key={type}
                onClick={() => setShowRoutes(showRoutes === type ? null : type)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all text-center",
                  showRoutes === type
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/20 border-border/20 hover:bg-muted/40"
                )}
              >
                <TaskIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{label}</span>
                {best ? (
                  <span className="text-[10px] text-muted-foreground truncate w-full">{best.providerName}</span>
                ) : (
                  <span className="text-[10px] text-warning">Sin proveedor</span>
                )}
              </button>
            );
          })}
        </div>

        {showRoutes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-2 pt-2"
          >
            <p className="text-xs text-muted-foreground">
              Ranking para <strong>{showRoutes}</strong> (prioridad: {priority}):
            </p>
            {routeTask(showRoutes, priority, connectedProviders).map((r, i) => (
              <div key={r.modelId} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs",
                i === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
              )}>
                <span className="font-bold text-primary w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.modelName}</p>
                  <p className="text-[10px] text-muted-foreground">{r.providerName}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                  <span title="Velocidad">⚡{r.estimatedSpeed}</span>
                  <span title="Calidad">🔥{r.estimatedQuality}</span>
                  <span title="Costo">💰{r.estimatedCost}</span>
                  <Badge variant="outline" className="text-[9px] h-4">{r.score}</Badge>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Provider Usage Breakdown */}
      {Object.keys(usage.byProvider).length > 0 && (
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Uso por Proveedor
          </h3>
          <div className="space-y-2">
            {Object.entries(usage.byProvider).map(([id, data]) => {
              const prov = API_PROVIDERS.find(p => p.id === id);
              const pct = usage.totalCalls > 0 ? (data.calls / usage.totalCalls) * 100 : 0;
              return (
                <div key={id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{prov?.name || id}</span>
                    <span className="text-muted-foreground">{data.calls} calls · {data.tokens.toLocaleString()} tokens</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {connectedProviders.size === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">Solo Lovable AI activo. Conecta más proveedores en <strong>APIs</strong> para desbloquear TTS, imágenes HD y más modelos.</p>
        </div>
      )}
    </div>
  );
}
