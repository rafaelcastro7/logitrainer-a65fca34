import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import { LogIn, UserPlus, Loader2, Sparkles, Film } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { Separator } from '@/components/ui/separator';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
}

export default function AuthDialog({ open, onOpenChange, onSignIn, onSignUp }: AuthDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password, name);
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel-elevated border-border/30 overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-accent to-primary" />
        
        <DialogHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/10 flex items-center justify-center">
              <Film className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-gradient-primary text-xl">
            {mode === 'login' ? t.authLogin : t.authSignup}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'login' ? 'Welcome back to LogiTrainer Studio' : 'Create your account to get started'}
          </p>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 h-11 bg-card/60 border-border/30 hover:bg-muted/50 transition-all"
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continuar con Google
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-border/20" />
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">o</span>
          <Separator className="flex-1 bg-border/20" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t.authName}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="bg-muted/30 border-border/30 h-10" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t.authEmail}</Label>
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted/30 border-border/30 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t.authPassword}</Label>
            <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted/30 border-border/30 h-10" />
          </div>
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full gap-2 h-10 glow-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {mode === 'login' ? t.authLogin : t.authSignup}
          </Button>
          <p className="text-xs text-center text-muted-foreground/70">
            {mode === 'login' ? t.authNoAccount : t.authHasAccount}{' '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-primary hover:underline font-medium">
              {mode === 'login' ? t.authSignup : t.authLogin}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
