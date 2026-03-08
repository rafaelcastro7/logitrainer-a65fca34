import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-border/50">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary text-xl">
            {mode === 'login' ? t.authLogin : t.authSignup}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t.authName}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="bg-muted/50 border-border/50" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">{t.authEmail}</Label>
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t.authPassword}</Label>
            <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted/50 border-border/50" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full gap-2 glow-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {mode === 'login' ? t.authLogin : t.authSignup}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
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
