import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, Music, Film, Subtitles, Package,
  FileJson, FileAudio, Loader2, CheckCircle2, Copy, Share2
} from 'lucide-react';
import { Scene, BackgroundMusic, Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportHubProps {
  project: Project;
  scenes: Scene[];
}

type ExportFormat = 'srt' | 'txt' | 'audio_zip' | 'project_json' | 'markdown' | 'csv';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'subtitles' | 'script' | 'assets' | 'project';
  badge?: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'srt', label: 'SRT Subtitles', description: 'Subtitle file for YouTube, Vimeo, etc.', icon: Subtitles, category: 'subtitles', badge: 'Popular' },
  { id: 'txt', label: 'Script TXT', description: 'Plain text script for all scenes', icon: FileText, category: 'script' },
  { id: 'markdown', label: 'Script Markdown', description: 'Formatted script with scene headers', icon: FileText, category: 'script' },
  { id: 'csv', label: 'Scene Data CSV', description: 'Spreadsheet with all scene metadata', icon: FileText, category: 'script' },
  { id: 'audio_zip', label: 'Audio Pack', description: 'Download all generated audio files', icon: FileAudio, category: 'assets' },
  { id: 'project_json', label: 'Project Backup', description: 'Full project file for import/backup', icon: Package, category: 'project' },
];

function generateSRT(scenes: Scene[]): string {
  let srt = '';
  let timeOffset = 0;
  scenes.forEach((scene, i) => {
    if (!scene.script.trim()) return;
    const start = timeOffset;
    const end = timeOffset + scene.duration;
    srt += `${i + 1}\n`;
    srt += `${formatSRTTime(start)} --> ${formatSRTTime(end)}\n`;
    srt += `${scene.script.trim()}\n\n`;
    timeOffset = end;
  });
  return srt.trim();
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function generateTXT(scenes: Scene[]): string {
  return scenes.map((s, i) => `[Scene ${i + 1}: ${s.name}]\n${s.script}`).join('\n\n');
}

function generateMarkdown(scenes: Scene[], projectName: string): string {
  let md = `# ${projectName}\n\n`;
  scenes.forEach((s, i) => {
    md += `## Scene ${i + 1}: ${s.name}\n\n`;
    md += `**Duration:** ${s.duration}s | **Animation:** ${s.animation.type} | **Transition:** ${s.transition}\n\n`;
    md += `${s.script}\n\n`;
    if (s.image_prompt) md += `> 🎨 *Image prompt: ${s.image_prompt}*\n\n`;
    if (s.notes) md += `> 📝 *Notes: ${s.notes}*\n\n`;
    md += `---\n\n`;
  });
  return md;
}

function generateCSV(scenes: Scene[]): string {
  const headers = ['#', 'Name', 'Duration (s)', 'Script', 'Image Prompt', 'Animation', 'Transition', 'Voice', 'Image Status', 'Audio Status', 'Notes'];
  const rows = scenes.map((s, i) => [
    i + 1,
    `"${s.name.replace(/"/g, '""')}"`,
    s.duration,
    `"${s.script.replace(/"/g, '""')}"`,
    `"${s.image_prompt.replace(/"/g, '""')}"`,
    s.animation.type,
    s.transition,
    s.voiceName || 'default',
    s.image.status,
    s.audio.status,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportHub({ project, scenes }: ExportHubProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [recentExports, setRecentExports] = useState<ExportFormat[]>([]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    setExporting(format);
    const name = project.meta.name.replace(/\s+/g, '_');

    try {
      await new Promise(r => setTimeout(r, 300)); // UX delay

      switch (format) {
        case 'srt': {
          const srt = generateSRT(scenes);
          downloadFile(srt, `${name}.srt`, 'text/plain');
          toast.success('📄 SRT subtitles exported');
          break;
        }
        case 'txt': {
          const txt = generateTXT(scenes);
          downloadFile(txt, `${name}_script.txt`, 'text/plain');
          toast.success('📝 Script exported as TXT');
          break;
        }
        case 'markdown': {
          const md = generateMarkdown(scenes, project.meta.name);
          downloadFile(md, `${name}_script.md`, 'text/markdown');
          toast.success('📄 Script exported as Markdown');
          break;
        }
        case 'csv': {
          const csv = generateCSV(scenes);
          downloadFile(csv, `${name}_scenes.csv`, 'text/csv');
          toast.success('📊 Scene data exported as CSV');
          break;
        }
        case 'audio_zip': {
          const audios = scenes.filter(s => s.audio.url);
          if (audios.length === 0) {
            toast.error('No audio files generated yet');
            break;
          }
          // Download individual audio files
          for (const scene of audios) {
            if (scene.audio.url) {
              const a = document.createElement('a');
              a.href = scene.audio.url;
              a.download = `${name}_${scene.name.replace(/\s+/g, '_')}.mp3`;
              a.click();
              await new Promise(r => setTimeout(r, 200));
            }
          }
          toast.success(`🎵 ${audios.length} audio files downloaded`);
          break;
        }
        case 'project_json': {
          const json = JSON.stringify(project, null, 2);
          downloadFile(json, `${name}.logitrainer.json`, 'application/json');
          toast.success('📦 Project backup exported');
          break;
        }
      }
      setRecentExports(prev => [format, ...prev.filter(f => f !== format)].slice(0, 3));
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  }, [project, scenes]);

  const handleCopyScript = useCallback(() => {
    const txt = generateTXT(scenes);
    navigator.clipboard.writeText(txt);
    toast.success('📋 Script copied to clipboard');
  }, [scenes]);

  const categories = [
    { key: 'subtitles', label: '🎬 Subtitles' },
    { key: 'script', label: '📝 Script & Data' },
    { key: 'assets', label: '🎵 Assets' },
    { key: 'project', label: '📦 Project' },
  ];

  const completedAudios = scenes.filter(s => s.audio.status === 'completed').length;
  const completedImages = scenes.filter(s => s.image.status === 'completed').length;
  const totalWords = scenes.reduce((sum, s) => sum + s.script.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Export Hub</h2>
            <p className="text-xs text-muted-foreground">Export your project in multiple formats</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopyScript}>
          <Copy className="w-3 h-3" /> Copy Script
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Scenes', value: scenes.length, icon: Film },
          { label: 'Words', value: totalWords.toLocaleString(), icon: FileText },
          { label: 'Images', value: `${completedImages}/${scenes.length}`, icon: Film },
          { label: 'Audios', value: `${completedAudios}/${scenes.length}`, icon: Music },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel rounded-lg p-3 text-center">
              <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-primary/60" />
              <p className="text-lg font-bold text-gradient-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Export Options by Category */}
      {categories.map(cat => {
        const options = EXPORT_OPTIONS.filter(o => o.category === cat.key);
        if (options.length === 0) return null;
        return (
          <div key={cat.key} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map(opt => {
                const Icon = opt.icon;
                const isExporting = exporting === opt.id;
                const wasRecent = recentExports.includes(opt.id);
                return (
                  <motion.button
                    key={opt.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleExport(opt.id)}
                    disabled={isExporting || scenes.length === 0}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all w-full",
                      wasRecent
                        ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                        : "bg-card/50 border-border/30 hover:bg-muted/40",
                      "disabled:opacity-50"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                      wasRecent ? "bg-primary/15" : "bg-muted/40"
                    )}>
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : wasRecent ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{opt.label}</span>
                        {opt.badge && (
                          <Badge variant="outline" className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20">
                            {opt.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                    </div>
                    <Download className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {scenes.length === 0 && (
        <div className="glass-panel rounded-xl p-8 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium">No scenes to export</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Generate scenes first from the Dashboard</p>
        </div>
      )}
    </div>
  );
}