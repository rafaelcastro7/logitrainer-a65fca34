import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

interface PendingApprovalScreenProps {
  status: string;
  onSignOut: () => void;
}

export default function PendingApprovalScreen({ status, onSignOut }: PendingApprovalScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {status === 'rejected' ? 'Acceso Denegado' : 'Cuenta Pendiente de Aprobación'}
          </h1>
          <p className="text-muted-foreground">
            {status === 'rejected' 
              ? 'Tu solicitud de acceso ha sido rechazada. Contacta al administrador para más información.'
              : 'Tu cuenta ha sido registrada exitosamente. Un administrador revisará tu solicitud pronto.'}
          </p>
        </div>

        <Button variant="outline" onClick={onSignOut} className="gap-2">
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
