import { Zap, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', speed: '⚡', desc: 'Rápido y económico' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', speed: '🔥', desc: 'Máxima calidad' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', speed: '⚡', desc: 'Buen balance' },
  { id: 'openai/gpt-5', name: 'GPT-5', speed: '🔥', desc: 'Razonamiento premium' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', speed: '⚡', desc: 'Rápido y preciso' },
];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ModelSelector({ value, onChange, label }: ModelSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> {label || 'Modelo IA'}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs bg-muted/30 border-border/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODELS.map(m => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <span className="flex items-center gap-2">
                <span>{m.speed}</span>
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground">— {m.desc}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
