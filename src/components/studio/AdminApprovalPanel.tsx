import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, Users, Shield, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

interface AdminApprovalPanelProps {
  user: User | null;
}

export default function AdminApprovalPanel({ user }: AdminApprovalPanelProps) {
  const { isAdmin, pendingUsers, allUsers, approveUser, rejectUser, refetch } = useAdmin(user);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Panel de Administración</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-3 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{allUsers.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold text-yellow-500">{pendingUsers.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-green-500">
              {allUsers.filter(u => u.approval_status === 'approved').length}
            </p>
            <p className="text-[10px] text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending approvals */}
      {pendingUsers.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Solicitudes Pendientes ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {pendingUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(u.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={() => approveUser(u.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => rejectUser(u.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* All users */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Todos los Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1">
              {allUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(u.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      u.approval_status === 'approved' ? 'default' :
                      u.approval_status === 'rejected' ? 'destructive' : 'secondary'
                    } className="text-[10px]">
                      {u.approval_status === 'approved' ? 'Aprobado' :
                       u.approval_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </Badge>
                    {u.approval_status !== 'approved' && (
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-green-500" onClick={() => approveUser(u.id)}>
                        <CheckCircle2 className="w-3 h-3" />
                      </Button>
                    )}
                    {u.approval_status === 'approved' && (
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive" onClick={() => rejectUser(u.id)}>
                        <XCircle className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
