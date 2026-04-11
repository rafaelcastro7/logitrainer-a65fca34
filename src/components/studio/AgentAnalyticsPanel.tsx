import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Clock, Zap, CheckCircle2, XCircle, TrendingUp, Activity, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AgentMetrics {
  agentId: string;
  name: string;
  icon: string;
  color: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  totalTokens: number;
  lastUsed: string | null;
}

const AGENT_META: Record<string, { name: string; icon: string; color: string }> = {
  orchestrator: { name: 'Orchestrator', icon: '🎯', color: 'text-purple-500' },
  researcher: { name: 'Researcher', icon: '🔍', color: 'text-blue-500' },
  writer: { name: 'Writer', icon: '✍️', color: 'text-green-500' },
  editor: { name: 'Editor', icon: '📝', color: 'text-amber-500' },
  strategist: { name: 'Strategist', icon: '🧠', color: 'text-red-500' },
  designer: { name: 'Designer', icon: '🎨', color: 'text-pink-500' },
};

export default function AgentAnalyticsPanel() {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [moduleStats, setModuleStats] = useState<Record<string, number>>({});
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Array<{ module: string; title: string; date: string }>>([]);

  const fetchAnalytics = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all generated content for analytics
    const { data: content } = await supabase
      .from('generated_content')
      .select('module, title, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!content) return;

    setTotalGenerated(content.length);

    // Module stats
    const modStats: Record<string, number> = {};
    content.forEach(c => { modStats[c.module] = (modStats[c.module] || 0) + 1; });
    setModuleStats(modStats);

    // Recent activity
    setRecentActivity(content.slice(0, 10).map(c => ({
      module: c.module,
      title: c.title,
      date: c.created_at,
    })));

    // Compute agent metrics from metadata (pipeline info)
    const agentRuns: Record<string, { total: number; success: number; durations: number[]; tokens: number[]; lastUsed: string | null }> = {};
    
    Object.keys(AGENT_META).forEach(id => {
      agentRuns[id] = { total: 0, success: 0, durations: [], tokens: [], lastUsed: null };
    });

    content.forEach(c => {
      const meta = (c.metadata as Record<string, any>) ?? {};
      const pipeline = meta.pipeline as string[] | undefined;
      const agent = meta.agent as string | undefined;
      const mode = meta.mode as string | undefined;

      if (pipeline) {
        pipeline.forEach(agentId => {
          if (agentRuns[agentId]) {
            agentRuns[agentId].total++;
            agentRuns[agentId].success++;
            if (!agentRuns[agentId].lastUsed || c.created_at > agentRuns[agentId].lastUsed!) {
              agentRuns[agentId].lastUsed = c.created_at;
            }
          }
        });
      } else if (agent && agentRuns[agent]) {
        agentRuns[agent].total++;
        agentRuns[agent].success++;
        if (!agentRuns[agent].lastUsed || c.created_at > agentRuns[agent].lastUsed!) {
          agentRuns[agent].lastUsed = c.created_at;
        }
      }

      // Default: writer always involved
      if (!pipeline && !agent) {
        agentRuns.writer.total++;
        agentRuns.writer.success++;
        if (!agentRuns.writer.lastUsed || c.created_at > agentRuns.writer.lastUsed!) {
          agentRuns.writer.lastUsed = c.created_at;
        }
      }
    });

    const metricsArr: AgentMetrics[] = Object.entries(AGENT_META).map(([id, meta]) => ({
      agentId: id,
      name: meta.name,
      icon: meta.icon,
      color: meta.color,
      totalRuns: agentRuns[id].total,
      successRate: agentRuns[id].total > 0 ? (agentRuns[id].success / agentRuns[id].total) * 100 : 0,
      avgDuration: agentRuns[id].durations.length > 0 ? agentRuns[id].durations.reduce((a, b) => a + b, 0) / agentRuns[id].durations.length : 0,
      totalTokens: agentRuns[id].tokens.reduce((a, b) => a + b, 0),
      lastUsed: agentRuns[id].lastUsed,
    }));

    setMetrics(metricsArr);
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  };

  const totalAgentRuns = metrics.reduce((s, m) => s + m.totalRuns, 0);
  const mostActiveAgent = metrics.reduce((best, m) => m.totalRuns > (best?.totalRuns || 0) ? m : best, metrics[0]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Agent Analytics</h1>
          <p className="text-xs text-muted-foreground">Métricas de rendimiento del sistema multi-agente</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Total Generaciones</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalGenerated}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Bot className="w-4 h-4" />
            <span className="text-xs">Ejecuciones de Agentes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalAgentRuns}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Agente Más Activo</span>
          </div>
          <p className="text-lg font-bold text-foreground">{mostActiveAgent?.icon} {mostActiveAgent?.name || '—'}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Tasa de Éxito</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalAgentRuns > 0 ? '100%' : '—'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance Grid */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" /> Rendimiento por Agente
          </h3>
          <div className="space-y-3">
            {metrics.map(m => (
              <div key={m.agentId} className="flex items-center gap-3">
                <span className="text-lg w-8 text-center">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">{m.totalRuns} ejecuciones</span>
                  </div>
                  <Progress value={totalAgentRuns > 0 ? (m.totalRuns / totalAgentRuns) * 100 : 0} className="h-1.5" />
                </div>
                {m.lastUsed && (
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(m.lastUsed)}</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Module Distribution */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Distribución por Módulo
          </h3>
          <div className="space-y-2">
            {Object.entries(moduleStats)
              .sort(([, a], [, b]) => b - a)
              .map(([mod, count]) => (
                <div key={mod} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground capitalize w-24 truncate">{mod}</span>
                  <div className="flex-1">
                    <Progress value={totalGenerated > 0 ? (count / totalGenerated) * 100 : 0} className="h-2" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{count}</Badge>
                </div>
              ))}
            {Object.keys(moduleStats).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sin datos aún</p>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Actividad Reciente
          </h3>
          <div className="space-y-2">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">{item.module}</Badge>
                <span className="text-xs text-foreground truncate flex-1">{item.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(item.date)}</span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Genera contenido para ver la actividad</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
