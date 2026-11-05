import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Download, Monitor, Smartphone, Maximize2, Copy, CheckCheck, Share2 } from 'lucide-react';
import { Wallpaper } from '../types/wallpaper';
import { downloadSingleWallpaper } from '../utils/zipDownloader';

interface WallpaperLightboxProps {
  wallpaper: Wallpaper | null;
  onClose: () => void;
  isInPack: boolean;
  onTogglePack: (wallpaper: Wallpaper) => void;
  onSelectTag?: (tag: string) => void;
}

export const WallpaperLightbox: React.FC<WallpaperLightboxProps> = ({
  wallpaper,
  onClose,
  isInPack,
  onTogglePack,
  onSelectTag
}) => {
  const [deviceMockup, setDeviceMockup] = useState<'clean' | 'desktop' | 'mobile'>('clean');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string>('3840 × 2160');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!wallpaper) return null;

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSingleWallpaper(wallpaper, selectedResolution);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Container Box */}
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Viewport / Interactive Simulator */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center p-4 sm:p-8 min-h-[350px] sm:min-h-[460px] overflow-hidden">
          
          {/* Mockup Mode Selector */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-1 rounded-lg">
            <button
              onClick={() => setDeviceMockup('clean')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                deviceMockup === 'clean' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
            <button
              onClick={() => setDeviceMockup('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                deviceMockup === 'desktop' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>MacBook</span>
            </button>
            <button
              onClick={() => setDeviceMockup('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                deviceMockup === 'mobile' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone</span>
            </button>
          </div>

          {/* Clean Viewport */}
          {deviceMockup === 'clean' && (
            <div className="relative max-w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={wallpaper.imageUrl}
                alt={wallpaper.title}
                className="max-w-full max-h-[68vh] object-contain rounded-lg shadow-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Desktop MacBook Mockup Frame */}
          {deviceMockup === 'desktop' && (
            <div className="w-full max-w-2xl bg-zinc-900 rounded-t-xl p-2.5 border-t border-x border-zinc-700 shadow-2xl">
              {/* Menu bar mock */}
              <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-t-md text-[10px] text-zinc-400 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
                  <span className="font-semibold text-zinc-300">Finder</span>
                  <span>Archivo</span>
                  <span>Edición</span>
                </div>
                <span>12:00 PM</span>
              </div>
              <div className="aspect-16/10 w-full overflow-hidden rounded bg-black">
                <img
                  src={wallpaper.imageUrl}
                  alt={wallpaper.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Mobile iPhone Mockup Frame */}
          {deviceMockup === 'mobile' && (
            <div className="relative w-56 aspect-9/19 bg-zinc-900 rounded-[2.5rem] p-2 border-4 border-zinc-700 shadow-2xl overflow-hidden flex flex-col justify-between">
              {/* Dynamic Island */}
              <div className="absolute top-3 inset-x-0 flex justify-center z-20">
                <div className="w-20 h-4 bg-black rounded-full" />
              </div>

              {/* Wallpaper in phone */}
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                <img
                  src={wallpaper.imageUrl}
                  alt={wallpaper.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Lockscreen clock overlay */}
                <div className="absolute top-10 inset-x-0 text-center text-white drop-shadow-md">
                  <span className="text-xs font-medium tracking-wide uppercase">Jueves, 5 de Nov</span>
                  <div className="text-4xl font-bold tracking-tight font-mono">09:41</div>
                </div>

                {/* Home bar */}
                <div className="absolute bottom-2 inset-x-0 flex justify-center">
                  <div className="w-24 h-1 bg-white/80 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata, Palette & Actions Sidebar */}
        <div className="w-full lg:w-96 p-6 sm:p-7 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800/80 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            
            {/* Header info */}
            <div>
              <div className="text-xs text-zinc-500 font-medium mb-1">
                <span>Categoría: {wallpaper.category.toUpperCase()}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {wallpaper.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Por <span className="text-zinc-200 font-medium">{wallpaper.author}</span> ({wallpaper.authorHandle})
              </p>
            </div>

            {/* Spec Sheet Table */}
            <div className="space-y-2 py-3 border-y border-zinc-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Resolución Nativa</span>
                <span className="font-mono tabular-nums text-zinc-200">{wallpaper.resolution}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Relación de Aspecto</span>
                <span className="font-mono tabular-nums text-zinc-200">{wallpaper.aspectRatio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Tamaño de Archivo</span>
                <span className="font-mono tabular-nums text-zinc-200">{wallpaper.fileSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Descargas Totales</span>
                <span className="font-mono tabular-nums text-zinc-200">{wallpaper.downloads.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Licencia</span>
                <span className="text-zinc-300">Uso Personal Libre (CC0)</span>
              </div>
            </div>

            {/* Extracted Color Palette */}
            <div>
              <span className="text-xs font-medium text-zinc-400 block mb-2">
                Paleta Cromática Extraída
              </span>
              <div className="grid grid-cols-4 gap-2">
                {wallpaper.palette.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => copyToClipboard(hex)}
                    className="group relative flex flex-col items-center gap-1 p-1 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-all cursor-pointer"
                    title={`Copiar ${hex}`}
                  >
                    <div 
                      className="w-full h-7 rounded shadow-inner" 
                      style={{ backgroundColor: hex }} 
                    />
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white">
                      {copiedHex === hex ? 'Copiado!' : hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags section */}
            {wallpaper.tags && wallpaper.tags.length > 0 && (
              <div>
                <span className="text-xs font-medium text-zinc-400 block mb-2">
                  Tags Asociados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {wallpaper.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (onSelectTag) {
                          onSelectTag(tag);
                          onClose();
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                      title={`Filtrar por #${tag}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Source info if from GitHub */}
            {wallpaper.sourceRepo && (
              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                <span>Fuente de la galería:</span>
                <a
                  href={wallpaper.sourceRepo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-300 hover:text-white underline font-mono"
                >
                  github.com/dharmx/walls
                </a>
              </div>
            )}

            {/* Single Download Resolution Selection */}
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-2">
                Seleccionar Resolución
              </label>
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="3840 × 2160">4K Ultra HD (3840 × 2160) - Máxima Calidad</option>
                <option value="2560 × 1440">2K QHD (2560 × 1440) - Monitores 1440p</option>
                <option value="1920 × 1080">Full HD (1920 × 1080) - Estándar</option>
                <option value="2160 × 3840">Móvil Vertical (2160 × 3840) - Smartphones</option>
              </select>
            </div>

          </div>

          {/* Primary Action Buttons */}
          <div className="pt-6 space-y-2 border-t border-zinc-800/80">
            {/* Add to Pack Button (Hero feature) */}
            <button
              onClick={() => onTogglePack(wallpaper)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-sm ${
                isInPack
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950'
              }`}
            >
              {isInPack ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Añadido a tu Pack Personal</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Añadir a mi Pack Personalizado</span>
                </>
              )}
            </button>

            {/* Direct download single button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Descargando...' : 'Descargar Fondo Individual'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
