import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, AudioLines, Search, Film, ImagePlus,
  CheckCircle2, Circle, Lock, Zap, Server, BarChart3,
  ExternalLink, Shield
} from 'lucide-react';
import { API_PROVIDERS, getUsageSummary, getUsageHistory } from '@/services/apiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, AudioLines, Search, Film, ImagePlus,
};

interface ApiManagementViewProps {
  onConnectProvider?: (providerId: string) => void;
}

export default function ApiManagementView({ onConnectProvider }: ApiManagementViewProps) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>('lovable-ai');
  const { t } = useTranslation();
  const usage = getUsageSummary();
  const history = getUsageHistory();

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: t.active, color: 'bg-success/20 text-success', dot: 'bg-success' },
    available: { label: t.available, color: 'bg-warning/20 text-warning', dot: 'bg-warning' },
    coming_soon: { label: t.comingSoon, color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  };

  const capabilityLabels: Record<string, string> = {
    script_generation: t.capScript,
    image_generation: t.capImage,
    tts: t.capTTS,
    text_analysis: t.capAnalysis,
    research: t.capResearch,
    video_generation: t.capVideo,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{t.apiManagement}</h2>
          <Badge variant="outline" className="text-xs">
            {API_PROVIDERS.filter(p => p.status === 'active').length} {t.active.toLowerCase()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel rounded-lg p-4 text-center">
          <Zap className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">{usage.totalCalls}</p>
          <p className="text-[11px] text-muted-foreground">{t.apiCalls}</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <BarChart3 className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">{usage.totalTokens.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{t.tokensUsed}</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1.5 text-success/60" />
          <p className="text-xl font-bold text-gradient-primary">
            {API_PROVIDERS.filter(p => p.status === 'active').length}
          </p>
          <p className="text-[11px] text-muted-foreground">{t.activeProviders}</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <Shield className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">
            {API_PROVIDERS.reduce((s, p) => s + p.models.length, 0)}
          </p>
          <p className="text-[11px] text-muted-foreground">{t.availableModels}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{t.apiProviders}</h3>

        {API_PROVIDERS.map(provider => {
          const Icon = iconMap[provider.icon] || Sparkles;
          const status = statusConfig[provider.status];
          const isExpanded = expandedProvider === provider.id;
          const providerUsage = usage.byProvider[provider.id];

          return (
            <motion.div
              key={provider.id}
              layout
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  provider.status === 'active' ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <Icon className={cn("w-5 h-5", provider.status === 'active' ? "text-primary" : "text-muted-foreground")} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{provider.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] h-5", status.color)}>
                      <div className={cn("w-1.5 h-1.5 rounded-full mr-1", status.dot)} />
                      {status.label}
                    </Badge>
                    {!provider.requiresKey && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-primary/10 text-primary">
                        {t.noApiKey}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{provider.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {providerUsage && (
                    <span className="text-xs text-muted-foreground">
                      {providerUsage.calls} {t.calls.toLowerCase()}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {provider.capabilities.map(cap => (
                      <span key={cap} className="text-[11px]" title={capabilityLabels[cap]}>
                        {capabilityLabels[cap]?.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-5 pb-5 border-t border-border/30 space-y-4"
                >
                  <div className="pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t.capabilities}</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.capabilities.map(cap => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {capabilityLabels[cap] || cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t.models}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {provider.models.map(model => (
                        <div key={model.id} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
                          <Circle className="w-2 h-2 text-primary shrink-0 fill-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{model.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{model.id}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{model.speed}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {provider.status === 'available' && provider.requiresKey && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => onConnectProvider?.(provider.id)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t.connect} {provider.name}
                      </Button>
                    </div>
                  )}

                  {provider.status === 'coming_soon' && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t.providerComingSoon}</span>
                    </div>
                  )}

                  {provider.status === 'active' && providerUsage && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t.sessionUsage}</h4>
                      <div className="flex gap-4 text-xs">
                        <span>{t.calls}: <strong>{providerUsage.calls}</strong></span>
                        <span>{t.tokens}: <strong>{providerUsage.tokens.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{t.recentActivity}</h3>
          <div className="glass-panel rounded-xl divide-y divide-border/20">
            {history.slice(-10).reverse().map((record, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <span className="text-muted-foreground w-16">
                  {new Date(record.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {record.type === 'script' ? '📝' : record.type === 'image' ? '🖼️' : '🎙️'}
                  {record.type}
                </Badge>
                <span className="text-muted-foreground flex-1 truncate font-mono">{record.model}</span>
                <span className="text-muted-foreground">{record.tokens} tokens</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
