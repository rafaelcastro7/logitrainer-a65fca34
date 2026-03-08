import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';
import { SavedProject } from '@/hooks/useProjects';
import { Trash2, Share2, FolderOpen, Clock, Film } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Project } from '@/types/project';

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: SavedProject[];
  currentProjectId: string | null;
  onLoad: (project: Project, id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  loading: boolean;
}

export default function ProjectsDialog({ open, onOpenChange, projects, currentProjectId, onLoad, onDelete, onShare, loading }: ProjectsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-panel border-border/50 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary text-xl flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> {t.myProjects}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t.loading}</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <Film className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t.noProjectsSaved}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${p.id === currentProjectId ? 'border-primary/50 bg-primary/5' : 'border-border/30 hover:bg-muted/30'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                    {' · '}
                    {(p.data?.scenes?.length || 0)} {t.scenes}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onShare(p.id)} title={t.share}>
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { onLoad(p.data, p.id); onOpenChange(false); }} title={t.load}>
                    <FolderOpen className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)} title={t.delete}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
