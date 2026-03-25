import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Users, Trophy, Share2, CheckCircle2, ArrowUpRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface ReferralPanelProps {
  user: User | null;
}

interface ReferralStats {
  code: string;
  totalReferred: number;
  converted: number;
  pending: number;
}

const TIERS = [
  { name: 'Bronce', min: 0, max: 4, color: 'hsl(30, 60%, 50%)', icon: '🥉' },
  { name: 'Plata', min: 5, max: 14, color: 'hsl(0, 0%, 70%)', icon: '🥈' },
  { name: 'Oro', min: 15, max: 29, color: 'hsl(42, 95%, 55%)', icon: '🥇' },
  { name: 'Diamante', min: 30, max: Infinity, color: 'hsl(280, 75%, 60%)', icon: '💎' },
];

export default function ReferralPanel({ user }: ReferralPanelProps) {
  const [stats, setStats] = useState<ReferralStats>({ code: '', totalReferred: 0, converted: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get or create referral code
    const { data: codeData } = await supabase.rpc('get_or_create_referral_code', { p_user_id: user.id });

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    const converted = referrals?.filter(r => r.status === 'converted').length || 0;
    const pending = referrals?.filter(r => r.status === 'pending' && r.referred_id).length || 0;

    setStats({
      code: (codeData as string) || '',
      totalReferred: converted + pending,
      converted,
      pending,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const referralLink = `${window.location.origin}/?ref=${stats.code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('¡Link de referido copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'LogiTrainer Studio',
        text: '¡Prueba LogiTrainer Studio, la mejor plataforma de marketing con IA!',
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const currentTier = TIERS.find(t => stats.converted >= t.min && stats.converted <= t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progress = nextTier ? ((stats.converted - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-4">
          <Gift className="w-16 h-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Inicia sesión para acceder al programa de referidos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated rounded-2xl p-6 md:p-8 text-center relative overflow-hidden"
      >
        <div className="gradient-mesh absolute inset-0 opacity-50" />
        <div className="relative z-10">
          <div className="text-4xl md:text-5xl mb-3">{currentTier.icon}</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Programa de Referidos</h1>
          <p className="text-muted-foreground mb-1">
            Nivel <span className="font-semibold text-foreground">{currentTier.name}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Invita amigos y desbloquea recompensas exclusivas
          </p>
        </div>
      </motion.div>

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-xl p-5 space-y-3"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Tu Link de Referido
        </h3>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="font-mono text-sm" />
          <Button onClick={handleCopy} variant={copied ? 'default' : 'outline'} size="icon" className="shrink-0">
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button onClick={handleShare} size="icon" className="shrink-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Código: <span className="font-mono text-primary">{stats.code}</span>
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Referidos', value: stats.totalReferred, icon: Users, color: 'text-primary' },
          { label: 'Convertidos', value: stats.converted, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Pendientes', value: stats.pending, icon: ArrowUpRight, color: 'text-yellow-400' },
          { label: 'Nivel', value: currentTier.name, icon: Trophy, color: 'text-accent' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="glass-panel rounded-xl p-4 text-center"
          >
            <stat.icon className={cn('w-5 h-5 mx-auto mb-2', stat.color)} />
            <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-xl p-5 space-y-3"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" />
              Progreso al nivel {nextTier.name}
            </h3>
            <Badge variant="outline">{nextTier.min - stats.converted} referidos más</Badge>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentTier.icon} {currentTier.name}</span>
            <span>{nextTier.icon} {nextTier.name}</span>
          </div>
        </motion.div>
      )}

      {/* Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-panel rounded-xl p-5 space-y-4"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Gift className="w-4 h-4 text-accent" />
          Recompensas por Nivel
        </h3>
        <div className="space-y-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                currentTier.name === tier.name
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/50'
              )}
            >
              <span className="text-2xl">{tier.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{tier.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tier.min === 0 ? '0-4' : tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`} referidos
                </p>
              </div>
              <Badge variant={currentTier.name === tier.name ? 'default' : 'outline'} className="text-xs">
                {tier.name === 'Bronce' && 'Badge exclusivo'}
                {tier.name === 'Plata' && 'Templates premium'}
                {tier.name === 'Oro' && 'AI priority'}
                {tier.name === 'Diamante' && 'Acceso VIP'}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
