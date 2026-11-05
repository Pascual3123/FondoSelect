import React, { useState } from 'react';
import { Layers, Plus, Check, Monitor, Smartphone, Sparkles, Download } from 'lucide-react';
import { Wallpaper } from '../types/wallpaper';

interface HeroProps {
  featuredWallpaper: Wallpaper;
  isInPack: boolean;
  onTogglePack: (wallpaper: Wallpaper) => void;
  onOpenLightbox: (wallpaper: Wallpaper) => void;
  onStartPackCreator: () => void;
  onScrollToGallery: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  featuredWallpaper,
  isInPack,
  onTogglePack,
  onOpenLightbox,
  onStartPackCreator,
  onScrollToGallery
}) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <section className="pt-8 pb-12 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Split Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>Curaduría de Fotografía & Render 3D</span>
              <span aria-hidden="true">·</span>
              <span>Ultra HD & OLED</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.1] text-balance">
              Fondos de pantalla en alta resolución. Descarga por packs a tu medida.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Explora una selección limpia de piezas en 4K y 9:16 vertical. Selecciona los fondos que te gusten, organízalos en un pack y descárgalos agrupados en un solo archivo .ZIP.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartPackCreator}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Armar Mi Pack Personalizado</span>
              </button>

              <button
                onClick={onScrollToGallery}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <span>Explorar Galería</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Showcase Container */}
          <div className="lg:col-span-6">
            <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950/5 dark:bg-zinc-900/40 p-3 sm:p-4 transition-all">
              
              {/* Preview mode toggle bar */}
              <div className="flex items-center justify-between pb-3 px-1 text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">Destacado de la Semana</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{featuredWallpaper.resolution}</span>
                </div>

                <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800/70 p-0.5 rounded-md">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      previewMode === 'desktop'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      previewMode === 'mobile'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Móvil</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Mockup Viewport */}
              <div className="relative w-full overflow-hidden rounded-xl bg-zinc-950 flex items-center justify-center">
                {previewMode === 'desktop' ? (
                  <div className="relative w-full aspect-16/9 overflow-hidden">
                    <img
                      src={featuredWallpaper.imageUrl}
                      alt={featuredWallpaper.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div className="w-full py-3 flex items-center justify-center bg-zinc-900/60">
                    <div className="relative w-44 aspect-9/16 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl">
                      <img
                        src={featuredWallpaper.imageUrl}
                        alt={featuredWallpaper.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 inset-x-0 flex justify-center">
                        <div className="w-14 h-3 bg-zinc-950 rounded-full" />
                      </div>
                      <div className="absolute bottom-3 inset-x-0 flex justify-center">
                        <div className="w-16 h-1 bg-white/70 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay information bar */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-wrap items-end justify-between gap-3 text-white">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md">
                      {featuredWallpaper.title}
                    </h3>
                    <p className="text-xs text-zinc-300">
                      Fotografía por {featuredWallpaper.author} ({featuredWallpaper.authorHandle})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenLightbox(featuredWallpaper)}
                      className="px-3 py-1.5 text-xs font-medium bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-md text-white transition-colors cursor-pointer"
                    >
                      Inspeccionar
                    </button>
                    <button
                      onClick={() => onTogglePack(featuredWallpaper)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        isInPack
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm'
                      }`}
                    >
                      {isInPack ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>En tu Pack</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir al Pack</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 4-column KPI & Value Strip below hero split (§5 #13) */}
        <div className="mt-12 pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div>
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              3840×2160
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Resolución nativa 4K UHD y 8K
            </p>
          </div>

          <div>
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              100% Libre
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Sin marcas de agua ni compresión
            </p>
          </div>

          <div>
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              Pack .ZIP
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Agrupa 2 a 20 fondos en un clic
            </p>
          </div>

          <div>
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              Multi-Dispositivo
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Monitores, MacBooks e iPhone/Android
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
