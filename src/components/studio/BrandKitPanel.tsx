import { useState } from 'react';
import { Palette, Eye, EyeOff, Type, Droplet, Image as ImageIcon, Sparkles, Loader2, Wand2, Download, RotateCcw } from 'lucide-react';
import { BrandKit } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandKitPanelProps {
  brandKit: BrandKit;
  onUpdate: (updates: Partial<BrandKit>) => void;
}

const FONT_OPTIONS = [
  'Inter', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display', 'Montserrat',
  'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Oswald', 'Merriweather',
  'Bebas Neue', 'DM Sans', 'Sora', 'Outfit', 'Clash Display',
];

const WATERMARK_POSITIONS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'top-left', label: '↖ Arriba Izq' },
  { value: 'top-right', label: '↗ Arriba Der' },
  { value: 'bottom-left', label: '↙ Abajo Izq' },
  { value: 'bottom-right', label: '↘ Abajo Der' },
  { value: 'center', label: '⊙ Centro' },
];

const PRESET_PALETTES = [
  { name: 'Royal Purple', primary: '#6C5CE7', secondary: '#A29BFE', accent: '#FD79A8', bg: '#1A1625' },
  { name: 'Ocean Blue', primary: '#0984E3', secondary: '#74B9FF', accent: '#00CEC9', bg: '#0A1628' },
  { name: 'Forest Green', primary: '#00B894', secondary: '#55EFC4', accent: '#FDCB6E', bg: '#0A1F15' },
  { name: 'Sunset Orange', primary: '#E17055', secondary: '#FAB1A0', accent: '#FFEAA7', bg: '#1F1410' },
  { name: 'Midnight', primary: '#2D3436', secondary: '#636E72', accent: '#DFE6E9', bg: '#1A1A1A' },
  { name: 'Coral Pink', primary: '#FF6B6B', secondary: '#FFA8A8', accent: '#FFD93D', bg: '#1F1218' },
  { name: 'Electric Cyan', primary: '#00F5FF', secondary: '#00D4AA', accent: '#FF6B35', bg: '#0A1A1F' },
  { name: 'Gold Premium', primary: '#D4AF37', secondary: '#F5E6B8', accent: '#8B6914', bg: '#1A1710' },
  { name: 'Neon Magenta', primary: '#FF006E', secondary: '#FF4D94', accent: '#8338EC', bg: '#1A0A14' },
];

const BRAND_TONES = ['Profesional', 'Moderno', 'Minimalista', 'Elegante', 'Divertido', 'Corporativo', 'Startup', 'Luxury'];

export default function BrandKitPanel({ brandKit, onUpdate }: BrandKitPanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);
  const [brandDescription, setBrandDescription] = useState('');
  const [selectedTone, setSelectedTone] = useState('Profesional');

  const handleAIBrandGeneration = async () => {
    if (!brandDescription.trim()) return toast.error('Describe tu marca');
    setIsGeneratingBrand(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-content', {
        body: {
          type: 'chat',
          prompt: `Generate a complete brand kit for this brand: "${brandDescription}". Tone: ${selectedTone}. Return ONLY valid JSON (no markdown): { "primaryColor": "#hex", "secondaryColor": "#hex", "accentColor": "#hex", "fontFamily": "one of: ${FONT_OPTIONS.join(', ')}", "introText": "short brand tagline", "outroText": "closing tagline" }`,
        },
      });
      if (error) throw error;
      const content = data?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        onUpdate({
          primaryColor: parsed.primaryColor || brandKit.primaryColor,
          secondaryColor: parsed.secondaryColor || brandKit.secondaryColor,
          accentColor: parsed.accentColor || brandKit.accentColor,
          fontFamily: FONT_OPTIONS.includes(parsed.fontFamily) ? parsed.fontFamily : brandKit.fontFamily,
          introText: parsed.introText || brandKit.introText,
          outroText: parsed.outroText || brandKit.outroText,
        });
        toast.success('Brand kit generado con IA');
      }
    } catch (e: any) {
      toast.error('Error generando brand kit');
    } finally {
      setIsGeneratingBrand(false);
    }
  };

  const handleExportBrandKit = () => {
    const data = JSON.stringify(brandKit, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-kit.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Brand kit exportado');
  };

  return (
    <section className="glass-panel rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Brand Kit
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleExportBrandKit}>
            <Download className="w-3 h-3" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            Preview
          </Button>
        </div>
      </div>

      {/* AI Brand Generator */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
        <Label className="text-xs flex items-center gap-1 font-semibold">
          <Wand2 className="w-3 h-3 text-primary" /> Generar con IA
        </Label>
        <Textarea
          value={brandDescription}
          onChange={e => setBrandDescription(e.target.value)}
          placeholder="Describe tu marca: nombre, industria, valores, público objetivo..."
          className="bg-background/50 border-border/30 text-xs min-h-[50px] resize-none"
        />
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {BRAND_TONES.map(tone => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
                  selectedTone === tone
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {tone}
              </button>
            ))}
          </div>
          <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={handleAIBrandGeneration} disabled={isGeneratingBrand}>
            {isGeneratingBrand ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generar
          </Button>
        </div>
      </div>

      {/* Color Presets */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1"><Sparkles className="w-3 h-3" /> Paletas rápidas</Label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_PALETTES.map(palette => (
            <button
              key={palette.name}
              onClick={() => onUpdate({
                primaryColor: palette.primary,
                secondaryColor: palette.secondary,
                accentColor: palette.accent,
              })}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border text-[11px] transition-all hover:border-primary/30",
                brandKit.primaryColor === palette.primary
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/20 border-border/30"
              )}
            >
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-full" style={{ background: palette.primary }} />
                <div className="w-3 h-3 rounded-full" style={{ background: palette.secondary }} />
                <div className="w-3 h-3 rounded-full" style={{ background: palette.accent }} />
              </div>
              <span className="truncate">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'primaryColor' as const, label: 'Primario' },
          { key: 'secondaryColor' as const, label: 'Secundario' },
          { key: 'accentColor' as const, label: 'Acento' },
        ].map(color => (
          <div key={color.key} className="space-y-1.5">
            <Label className="text-[11px]">{color.label}</Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={brandKit[color.key]}
                onChange={e => onUpdate({ [color.key]: e.target.value })}
                className="w-7 h-7 rounded-md border border-border/30 cursor-pointer"
              />
              <Input
                value={brandKit[color.key]}
                onChange={e => onUpdate({ [color.key]: e.target.value })}
                className="bg-muted/50 border-border/50 h-7 text-[10px] font-mono"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Font */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><Type className="w-3 h-3" /> Tipografía</Label>
        <Select value={brandKit.fontFamily} onValueChange={v => onUpdate({ fontFamily: v })}>
          <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map(f => (
              <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Logo URL</Label>
        <Input
          value={brandKit.logoUrl}
          onChange={e => onUpdate({ logoUrl: e.target.value })}
          placeholder="https://example.com/logo.png"
          className="bg-muted/50 border-border/50 h-8 text-xs"
        />
      </div>

      {/* Watermark */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Droplet className="w-3 h-3" /> Marca de agua</Label>
          <Select
            value={brandKit.watermarkPosition}
            onValueChange={v => onUpdate({ watermarkPosition: v as BrandKit['watermarkPosition'] })}
          >
            <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WATERMARK_POSITIONS.map(p => (
                <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {brandKit.watermarkPosition !== 'none' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Opacidad ({Math.round(brandKit.watermarkOpacity * 100)}%)</Label>
            <Slider
              value={[brandKit.watermarkOpacity]}
              onValueChange={([v]) => onUpdate({ watermarkOpacity: v })}
              min={0.05} max={1} step={0.05}
            />
          </div>
        )}
      </div>

      {/* Intro/Outro */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Texto Intro</Label>
          <Input
            value={brandKit.introText}
            onChange={e => onUpdate({ introText: e.target.value })}
            placeholder="Bienvenido a..."
            className="bg-muted/50 border-border/50 h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Texto Outro</Label>
          <Input
            value={brandKit.outroText}
            onChange={e => onUpdate({ outroText: e.target.value })}
            placeholder="¡Gracias por ver!"
            className="bg-muted/50 border-border/50 h-8 text-xs"
          />
        </div>
      </div>

      {/* Brand Preview - Enhanced */}
      {showPreview && (
        <div className="rounded-xl overflow-hidden border border-border/30">
          {/* Header preview */}
          <div className="p-4 text-center" style={{ background: `linear-gradient(135deg, ${brandKit.primaryColor}, ${brandKit.secondaryColor})` }}>
            {brandKit.logoUrl && (
              <img src={brandKit.logoUrl} alt="Logo" className="h-8 mx-auto object-contain mb-2" />
            )}
            <h4 className="text-lg font-bold text-white" style={{ fontFamily: brandKit.fontFamily }}>
              {brandKit.introText || 'Tu Marca'}
            </h4>
          </div>
          {/* Body preview */}
          <div className="p-4 space-y-3 bg-background/80">
            <div className="flex items-center justify-center gap-3">
              {[brandKit.primaryColor, brandKit.secondaryColor, brandKit.accentColor].map((c, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-lg shadow-md mx-auto" style={{ background: c }} />
                  <span className="text-[9px] text-muted-foreground font-mono mt-1 block">{c}</span>
                </div>
              ))}
            </div>
            <div className="text-center space-y-1" style={{ fontFamily: brandKit.fontFamily }}>
              <p className="text-sm font-bold" style={{ color: brandKit.primaryColor }}>Heading Example</p>
              <p className="text-xs text-muted-foreground">Body text in {brandKit.fontFamily}</p>
              <button
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white mt-2"
                style={{ background: brandKit.accentColor }}
              >
                CTA Button
              </button>
            </div>
          </div>
          {/* Footer preview */}
          <div className="px-4 py-2 text-center border-t border-border/20" style={{ background: `${brandKit.primaryColor}10` }}>
            <p className="text-[10px] text-muted-foreground" style={{ fontFamily: brandKit.fontFamily }}>
              {brandKit.outroText || '© 2024 Tu Marca'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
