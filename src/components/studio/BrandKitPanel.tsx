import { useState } from 'react';
import { Palette, Upload, Eye, EyeOff, Type, Droplet, Image as ImageIcon, Sparkles } from 'lucide-react';
import { BrandKit } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BrandKitPanelProps {
  brandKit: BrandKit;
  onUpdate: (updates: Partial<BrandKit>) => void;
}

const FONT_OPTIONS = [
  'Inter', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display', 'Montserrat',
  'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Oswald', 'Merriweather',
];

const WATERMARK_POSITIONS = [
  { value: 'none', label: 'None' },
  { value: 'top-left', label: '↖ Top Left' },
  { value: 'top-right', label: '↗ Top Right' },
  { value: 'bottom-left', label: '↙ Bottom Left' },
  { value: 'bottom-right', label: '↘ Bottom Right' },
];

const PRESET_PALETTES = [
  { name: 'Royal Purple', primary: '#6C5CE7', secondary: '#A29BFE', accent: '#FD79A8' },
  { name: 'Ocean Blue', primary: '#0984E3', secondary: '#74B9FF', accent: '#00CEC9' },
  { name: 'Forest Green', primary: '#00B894', secondary: '#55EFC4', accent: '#FDCB6E' },
  { name: 'Sunset Orange', primary: '#E17055', secondary: '#FAB1A0', accent: '#FFEAA7' },
  { name: 'Midnight', primary: '#2D3436', secondary: '#636E72', accent: '#DFE6E9' },
  { name: 'Coral Pink', primary: '#FF6B6B', secondary: '#FFA8A8', accent: '#FFD93D' },
];

export default function BrandKitPanel({ brandKit, onUpdate }: BrandKitPanelProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <section className="glass-panel rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Brand Kit
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          Preview
        </Button>
      </div>

      {/* Color Presets */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1"><Sparkles className="w-3 h-3" /> Quick Palettes</Label>
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
          { key: 'primaryColor' as const, label: 'Primary' },
          { key: 'secondaryColor' as const, label: 'Secondary' },
          { key: 'accentColor' as const, label: 'Accent' },
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
        <Label className="text-xs flex items-center gap-1"><Type className="w-3 h-3" /> Font Family</Label>
        <Select value={brandKit.fontFamily} onValueChange={v => onUpdate({ fontFamily: v })}>
          <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map(f => (
              <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
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
          <Label className="text-xs flex items-center gap-1"><Droplet className="w-3 h-3" /> Watermark</Label>
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
            <Label className="text-xs">Opacity ({Math.round(brandKit.watermarkOpacity * 100)}%)</Label>
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
          <Label className="text-xs">Intro Text</Label>
          <Input
            value={brandKit.introText}
            onChange={e => onUpdate({ introText: e.target.value })}
            placeholder="Welcome to..."
            className="bg-muted/50 border-border/50 h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Outro Text</Label>
          <Input
            value={brandKit.outroText}
            onChange={e => onUpdate({ outroText: e.target.value })}
            placeholder="Thanks for watching!"
            className="bg-muted/50 border-border/50 h-8 text-xs"
          />
        </div>
      </div>

      {/* Brand Preview */}
      {showPreview && (
        <div
          className="rounded-xl p-6 border border-border/30 text-center space-y-3"
          style={{ background: `linear-gradient(135deg, ${brandKit.primaryColor}15, ${brandKit.secondaryColor}15)` }}
        >
          {brandKit.logoUrl && (
            <img src={brandKit.logoUrl} alt="Logo" className="h-10 mx-auto object-contain" />
          )}
          <h4 className="text-lg font-bold" style={{ fontFamily: brandKit.fontFamily, color: brandKit.primaryColor }}>
            {brandKit.introText || 'Your Brand Title'}
          </h4>
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full" style={{ background: brandKit.primaryColor }} />
            <div className="w-6 h-6 rounded-full" style={{ background: brandKit.secondaryColor }} />
            <div className="w-6 h-6 rounded-full" style={{ background: brandKit.accentColor }} />
          </div>
          <p className="text-[11px] text-muted-foreground" style={{ fontFamily: brandKit.fontFamily }}>
            Font: {brandKit.fontFamily}
          </p>
          {brandKit.watermarkPosition !== 'none' && (
            <p className="text-[10px] text-muted-foreground/60">
              Watermark: {brandKit.watermarkPosition} ({Math.round(brandKit.watermarkOpacity * 100)}%)
            </p>
          )}
        </div>
      )}
    </section>
  );
}
