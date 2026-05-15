import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, AudioLines, Search, Film, ImagePlus,
  CheckCircle2, Circle, Lock, Zap, Server, BarChart3,
  ExternalLink, Shield, Key, Trash2, Eye, EyeOff,
  Loader2, ToggleLeft, ToggleRight, AlertCircle, Copy
} from 'lucide-react';
import { API_PROVIDERS, getUsageSummary, getUsageHistory, getUserApiKeys, saveUserApiKey, deleteUserApiKey, toggleUserApiKey } from '@/services/apiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, AudioLines, Search, Film, ImagePlus, Cpu: Server,
};

interface ApiManagementViewProps {
  onConnectProvider?: (providerId: string) => void;
  isAuthenticated?: boolean;
}

export default function ApiManagementView({ onConnectProvider, isAuthenticated }: ApiManagementViewProps) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>('lovable-ai');
  const [keyDialog, setKeyDialog] = useState<{ open: boolean; providerId: string; providerName: string } | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userKeys, setUserKeys] = useState<Record<string, { api_key: string; is_active: boolean }>>({});
  const [loadingKeys, setLoadingKeys] = useState(true);
  const { t } = useTranslation();
  const usage = getUsageSummary();
  const history = getUsageHistory();

  useEffect(() => {
    if (isAuthenticated) {
      loadKeys();
    } else {
      setLoadingKeys(false);
    }
  }, [isAuthenticated]);

  const loadKeys = async () => {
    setLoadingKeys(true);
    try {
      const keys = await getUserApiKeys();
      setUserKeys(keys);
    } catch (e) {
      console.error('Failed to load API keys:', e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleSaveKey = async () => {
    if (!keyDialog || !apiKeyInput.trim()) return;
    setSaving(true);
    try {
      await saveUserApiKey(keyDialog.providerId, apiKeyInput.trim());
      await loadKeys();
      toast.success(`✅ ${keyDialog.providerName} conectado`);
      setKeyDialog(null);
      setApiKeyInput('');
      setShowKey(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (providerId: string, providerName: string) => {
    try {
      await deleteUserApiKey(providerId);
      await loadKeys();
      toast.success(`🗑️ ${providerName} desconectado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const handleToggleKey = async (providerId: string, currentActive: boolean) => {
    try {
      await toggleUserApiKey(providerId, !currentActive);
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const getProviderStatus = (provider: typeof API_PROVIDERS[0]) => {
    if (provider.id === 'lovable-ai') return 'active';
    if (userKeys[provider.id]?.is_active) return 'connected';
    if (userKeys[provider.id]) return 'inactive';
    return provider.status;
  };

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: '✅ Activo', color: 'bg-success/20 text-success', dot: 'bg-success' },
    connected: { label: '🟢 Conectado', color: 'bg-success/20 text-success', dot: 'bg-success' },
    inactive: { label: '⏸️ Pausado', color: 'bg-warning/20 text-warning', dot: 'bg-warning' },
    available: { label: '🔑 Requiere API Key', color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
    coming_soon: { label: '🔜 Próximamente', color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  };

  const capabilityLabels: Record<string, string> = {
    script_generation: '📝 Scripts',
    image_generation: '🖼️ Imágenes',
    tts: '🎙️ TTS',
    text_analysis: '🔍 Análisis',
    research: '🔎 Research',
    video_generation: '🎬 Video',
    music_generation: '🎵 Música',
  };

  const connectedCount = Object.values(userKeys).filter(k => k.is_active).length + 1; // +1 for Lovable AI
  const totalModels = API_PROVIDERS.reduce((s, p) => {
    const st = getProviderStatus(p);
    return s + (st === 'active' || st === 'connected' ? p.models.length : 0);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Centro de APIs</h2>
          <Badge variant="outline" className="text-xs">
            {connectedCount} conectados
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel rounded-lg p-4 text-center">
          <Key className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">{connectedCount}</p>
          <p className="text-[11px] text-muted-foreground">Proveedores Activos</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <Shield className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">{totalModels}</p>
          <p className="text-[11px] text-muted-foreground">Modelos Disponibles</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <Zap className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">{usage.totalCalls}</p>
          <p className="text-[11px] text-muted-foreground">Llamadas API</p>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <BarChart3 className="w-4 h-4 mx-auto mb-1.5 text-primary/60" />
          <p className="text-xl font-bold text-gradient-primary">{usage.totalTokens.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Tokens Usados</p>
        </div>
      </div>

      {/* Info banner */}
      {!isAuthenticated && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">Inicia sesión para guardar tus API keys de forma segura. Lovable AI funciona sin login.</p>
        </div>
      )}

      {/* Providers */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Proveedores de IA</h3>

        {API_PROVIDERS.map(provider => {
          const Icon = iconMap[provider.icon] || Sparkles;
          const providerStatus = getProviderStatus(provider);
          const status = statusConfig[providerStatus];
          const isExpanded = expandedProvider === provider.id;
          const providerUsage = usage.byProvider[provider.id];
          const hasKey = !!userKeys[provider.id];

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
                  providerStatus === 'active' || providerStatus === 'connected' ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <Icon className={cn("w-5 h-5", providerStatus === 'active' || providerStatus === 'connected' ? "text-primary" : "text-muted-foreground")} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{provider.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] h-5", status.color)}>
                      {status.label}
                    </Badge>
                    {!provider.requiresKey && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-primary/10 text-primary">
                        Sin API Key
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{provider.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {providerUsage && (
                    <span className="text-xs text-muted-foreground">
                      {providerUsage.calls} calls
                    </span>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 border-t border-border/30 space-y-4"
                  >
                    {/* Capabilities */}
                    <div className="pt-4">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Capacidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.capabilities.map(cap => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {capabilityLabels[cap] || cap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Models */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Modelos ({provider.models.length})</h4>
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

                    {/* API Key Management */}
                    {provider.requiresKey && provider.status !== 'coming_soon' && (
                      <div className="pt-2 space-y-3">
                        {hasKey ? (
                          <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                            <Key className="w-4 h-4 text-success shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium">API Key configurada</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                ••••••••{userKeys[provider.id]?.api_key.slice(-4)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={(e) => { e.stopPropagation(); handleToggleKey(provider.id, userKeys[provider.id]?.is_active); }}
                                title={userKeys[provider.id]?.is_active ? 'Pausar' : 'Activar'}
                              >
                                {userKeys[provider.id]?.is_active
                                  ? <ToggleRight className="w-4 h-4 text-success" />
                                  : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                                }
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKeyDialog({ open: true, providerId: provider.id, providerName: provider.name });
                                  setApiKeyInput(userKeys[provider.id]?.api_key || '');
                                }}
                              >
                                <Key className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDeleteKey(provider.id, provider.name); }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                toast.error('Inicia sesión para guardar API keys');
                                return;
                              }
                              setKeyDialog({ open: true, providerId: provider.id, providerName: provider.name });
                              setApiKeyInput('');
                            }}
                          >
                            <Key className="w-3.5 h-3.5" />
                            Conectar {provider.name}
                          </Button>
                        )}

                        {provider.docsUrl && (
                          <a
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Obtener API Key →
                          </a>
                        )}
                      </div>
                    )}

                    {provider.status === 'coming_soon' && (
                      <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Próximamente disponible</span>
                      </div>
                    )}

                    {/* Usage */}
                    {(providerStatus === 'active' || providerStatus === 'connected') && providerUsage && (
                      <div className="pt-2">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Uso en sesión</h4>
                        <div className="flex gap-4 text-xs">
                          <span>Llamadas: <strong>{providerUsage.calls}</strong></span>
                          <span>Tokens: <strong>{providerUsage.tokens.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Actividad Reciente</h3>
          <div className="glass-panel rounded-xl divide-y divide-border/20">
            {history.slice(-10).reverse().map((record, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <span className="text-muted-foreground w-16">
                  {new Date(record.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {record.type === 'script' ? '📝' : record.type === 'image' ? '🖼️' : record.type === 'tts' ? '🎙️' : record.type === 'music' ? '🎵' : '🔎'}
                  {record.type}
                </Badge>
                <span className="text-muted-foreground flex-1 truncate font-mono">{record.model}</span>
                <span className="text-muted-foreground">{record.tokens} tokens</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Key Dialog */}
      <Dialog open={!!keyDialog?.open} onOpenChange={(open) => { if (!open) { setKeyDialog(null); setApiKeyInput(''); setShowKey(false); } }}>
        <DialogContent className="sm:max-w-md glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gradient-primary">
              <Key className="w-5 h-5 text-primary" />
              {keyDialog?.providerName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {API_PROVIDERS.find(p => p.id === keyDialog?.providerId)?.keyInstructions}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={API_PROVIDERS.find(p => p.id === keyDialog?.providerId)?.keyPlaceholder || 'Ingresa tu API key...'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Shield className="w-4 h-4 shrink-0 text-primary" />
              <span>Tu API key se almacena de forma segura y solo es accesible para tu cuenta.</span>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setKeyDialog(null); setApiKeyInput(''); setShowKey(false); }}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!apiKeyInput.trim() || saving} onClick={handleSaveKey} className="gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {saving ? 'Guardando...' : 'Guardar Key'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
