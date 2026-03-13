import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, Zap, DollarSign, Clock, Gauge,
  Activity, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Cpu, Image, Mic, FileText, Music, PieChart, Layers, Target
} from 'lucide-react';
import { getUsageSummary, getUsageHistory, API_PROVIDERS } from '@/services/apiService';
import { routeTask, estimateProjectCost, type Priority, type TaskType } from '@/services/smartRouter';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(220, 70%, 55%)',
  'hsl(280, 65%, 60%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
];

type ViewMode = 'overview' | 'router' | 'usage';

export default function ProductionAnalytics({
  scenesCount, completedImages, completedAudios,
  connectedProviders, priority, onChangePriority,
}: ProductionAnalyticsProps) {
  const usage = getUsageSummary();
  const history = getUsageHistory();
  const [showRoutes, setShowRoutes] = useState<TaskType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const estimate = useMemo(
    () => estimateProjectCost(scenesCount, connectedProviders, priority),
    [scenesCount, connectedProviders, priority]
  );

  const imageProgress = scenesCount > 0 ? (completedImages / scenesCount) * 100 : 0;
  const audioProgress = scenesCount > 0 ? (completedAudios / scenesCount) * 100 : 0;
  const overallProgress = scenesCount > 0 ? ((completedImages + completedAudios) / (scenesCount * 2)) * 100 : 0;

  // Cost trend
  const recentCost = history.slice(-5).reduce((s, r) => s + r.tokens, 0);
  const prevCost = history.slice(-10, -5).reduce((s, r) => s + r.tokens, 0);
  const costTrend = prevCost > 0 ? ((recentCost - prevCost) / prevCost) * 100 : 0;

  // Chart data: usage over time (last 20 entries grouped)
  const timelineData = useMemo(() => {
    if (history.length === 0) return [];
    const grouped: Record<string, { tokens: number; calls: number; label: string }> = {};
    history.slice(-20).forEach((entry, i) => {
      const key = `${i}`;
      const time = new Date(entry.timestamp);
      const label = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { tokens: 0, calls: 0, label };
      grouped[key].tokens += entry.tokens;
      grouped[key].calls += 1;
    });
    return Object.values(grouped);
  }, [history]);

  // Pie chart data: usage by type
  const typeDistribution = useMemo(() => {
    const byType: Record<string, number> = {};
    history.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + entry.tokens;
    });
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [history]);

  // Bar chart: provider comparison
  const providerData = useMemo(() => {
    return Object.entries(usage.byProvider).map(([id, data]) => {
      const prov = API_PROVIDERS.find(p => p.id === id);
      return { name: prov?.name || id, calls: data.calls, tokens: data.tokens };
    });
  }, [usage]);

  const priorities: { value: Priority; label: string; emoji: string; desc: string }[] = [
    { value: 'speed', label: 'Velocidad', emoji: '⚡', desc: 'Modelos más rápidos' },
    { value: 'quality', label: 'Calidad', emoji: '🔥', desc: 'Mejor resultado' },
    { value: 'cost', label: 'Economía', emoji: '💰', desc: 'Menor costo' },
  ];

  const taskTypes: { type: TaskType; label: string }[] = [
    { type: 'script', label: 'Scripts' },
    { type: 'image', label: 'Imágenes' },
    { type: 'tts', label: 'TTS' },
    { type: 'music', label: 'Música' },
  ];

  const views: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Vista General', icon: Activity },
    { id: 'router', label: 'Smart Router', icon: Zap },
    { id: 'usage', label: 'Uso Detallado', icon: BarChart3 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Production Analytics</h2>
            <p className="text-xs text-muted-foreground">Monitoreo en tiempo real de tu pipeline de producción</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/20">
          {views.map(v => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === v.id
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live KPIs Grid - Always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Cpu, label: 'API Calls', value: usage.totalCalls, trend: null },
          { icon: TrendingUp, label: 'Tokens', value: usage.totalTokens.toLocaleString(), trend: costTrend },
          { icon: Layers, label: 'Proveedores', value: connectedProviders.size + 1, trend: null },
          { icon: DollarSign, label: 'Costo Relativo', value: estimate.totalRelativeCost, trend: null },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-primary/60" />
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] h-4">live</Badge>
                  {kpi.trend !== null && kpi.trend !== 0 && (
                    <span className={cn("text-[10px] flex items-center gap-0.5", kpi.trend > 0 ? "text-destructive" : "text-green-500")}>
                      {kpi.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(Math.round(kpi.trend))}%
                    </span>
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-gradient-primary">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Production Progress */}
            {scenesCount > 0 && (
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Progreso de Producción
                  <Badge variant="outline" className="text-[10px] ml-auto">{Math.round(overallProgress)}%</Badge>
                </h3>

                <div className="space-y-3">
                  {[
                    { icon: Image, label: 'Imágenes', completed: completedImages, total: scenesCount, progress: imageProgress },
                    { icon: Mic, label: 'Audio/TTS', completed: completedAudios, total: scenesCount, progress: audioProgress },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Icon className="w-3 h-3" /> {item.label}
                          </span>
                          <span className="font-medium">{item.completed}/{item.total}</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    );
                  })}

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> General
                      </span>
                      <span className="font-medium">{Math.round(overallProgress)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Token Usage Timeline Chart */}
            {timelineData.length > 0 && (
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Uso de Tokens en el Tiempo
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground) / 0.3)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground) / 0.3)" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border) / 0.3)',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="tokens"
                        stroke="hsl(var(--primary))"
                        fill="url(#tokenGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Type Distribution Pie + Provider Bars */}
            {(typeDistribution.length > 0 || providerData.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeDistribution.length > 0 && (
                  <div className="glass-panel rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-primary" />
                      Distribución por Tipo
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={typeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {typeDistribution.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border) / 0.3)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {providerData.length > 0 && (
                  <div className="glass-panel rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Uso por Proveedor
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={providerData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
                          <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground) / 0.3)" />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground) / 0.3)" width={80} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border) / 0.3)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          />
                          <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'router' && (
          <motion.div
            key="router"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Priority Selector */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                🚦 Smart Router — Prioridad de Routing
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {priorities.map(p => (
                  <button
                    key={p.value}
                    onClick={() => onChangePriority(p.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 rounded-xl border text-xs transition-all",
                      priority === p.value
                        ? "bg-primary/15 border-primary/40 text-primary font-medium shadow-md ring-1 ring-primary/20"
                        : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Routes */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Rutas Óptimas por Tarea
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {taskTypes.map(({ type, label }) => {
                  const best = routeTask(type, priority, connectedProviders)[0];
                  const TaskIcon = taskIcons[type] || Zap;
                  return (
                    <button
                      key={type}
                      onClick={() => setShowRoutes(showRoutes === type ? null : type)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all text-center",
                        showRoutes === type
                          ? "bg-primary/10 border-primary/30 shadow-sm"
                          : "bg-muted/20 border-border/20 hover:bg-muted/40"
                      )}
                    >
                      <TaskIcon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium">{label}</span>
                      {best ? (
                        <span className="text-[10px] text-muted-foreground truncate w-full">{best.providerName}</span>
                      ) : (
                        <span className="text-[10px] text-orange-500">Sin proveedor</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showRoutes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 pt-2 overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground">
                      Ranking para <strong>{showRoutes}</strong> (prioridad: {priority}):
                    </p>
                    {routeTask(showRoutes, priority, connectedProviders).map((r, i) => (
                      <motion.div
                        key={r.modelId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-xs",
                          i === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
                        )}
                      >
                        <span className="font-bold text-primary w-6 text-center">#{i + 1}</span>
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
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {viewMode === 'usage' && (
          <motion.div
            key="usage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Detailed Provider Usage */}
            {Object.keys(usage.byProvider).length > 0 ? (
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Desglose por Proveedor
                </h3>
                <div className="space-y-3">
                  {Object.entries(usage.byProvider).map(([id, data]) => {
                    const prov = API_PROVIDERS.find(p => p.id === id);
                    const pct = usage.totalCalls > 0 ? (data.calls / usage.totalCalls) * 100 : 0;
                    return (
                      <div key={id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{prov?.name || id}</span>
                          <span className="text-muted-foreground">{data.calls} calls · {data.tokens.toLocaleString()} tokens</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-8 text-center space-y-3">
                <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No hay datos de uso todavía</p>
                <p className="text-xs text-muted-foreground/60">Genera contenido para ver estadísticas detalladas aquí</p>
              </div>
            )}

            {/* Recent Activity Log */}
            {history.length > 0 && (
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Actividad Reciente
                </h3>
                <div className="space-y-1 max-h-64 overflow-auto">
                  {history.slice(-15).reverse().map((entry, i) => {
                    const Icon = taskIcons[entry.type] || Zap;
                    const time = new Date(entry.timestamp);
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 text-xs transition-colors">
                        <Icon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="font-medium capitalize flex-1">{entry.type}</span>
                        <span className="text-muted-foreground">{entry.model}</span>
                        <span className="text-muted-foreground tabular-nums">{entry.tokens.toLocaleString()} tok</span>
                        <span className="text-muted-foreground/50 tabular-nums">
                          {time.getHours()}:{String(time.getMinutes()).padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts */}
      {connectedProviders.size === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
          <p className="text-xs text-orange-600 dark:text-orange-400">Solo Lovable AI activo. Conecta más proveedores en <strong>APIs</strong> para desbloquear TTS, imágenes HD y más modelos.</p>
        </div>
      )}
    </div>
  );
}
