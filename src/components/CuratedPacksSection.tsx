import React from 'react';
import { Download, Layers, Sparkles, FolderArchive } from 'lucide-react';
import { CuratedPack, Wallpaper } from '../types/wallpaper';

interface CuratedPacksSectionProps {
  packs: CuratedPack[];
  allWallpapers: Wallpaper[];
  onLoadPackToBuilder: (pack: CuratedPack) => void;
  onDownloadPackDirectly: (pack: CuratedPack) => void;
}

export const CuratedPacksSection: React.FC<CuratedPacksSectionProps> = ({
  packs,
  allWallpapers,
  onLoadPackToBuilder,
  onDownloadPackDirectly
}) => {
  return (
    <section className="py-12 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Heading (§1.B Anti-slop: clean editorial title, no code comments) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Packs Preconfigurados</span>
              <span aria-hidden="true">·</span>
              <span>Listos para Descargar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Pre-Packs Temáticos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Packs preconfigurados por temática y paleta cromática. Descárgalos al instante en .ZIP o cárgalos en tu creador para añadir tus propios favoritos.
          </p>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packs.map((pack) => {
            const packWallpapers = allWallpapers.filter(w => pack.wallpaperIds.includes(w.id));

            return (
              <div
                key={pack.id}
                className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 p-4 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
              >
                <div>
                  {/* Visual Stack Cover */}
                  <div className="relative aspect-16/10 w-full rounded-lg overflow-hidden bg-zinc-950 mb-3.5">
                    <img
                      src={pack.coverImage}
                      alt={pack.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/60 backdrop-blur-md text-white">
                      <FolderArchive className="w-3 h-3" />
                      <span>{pack.itemCount} Fondos</span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 text-white">
                      <span className="text-[11px] font-mono text-zinc-300">
                        {pack.totalSize}
                      </span>
                    </div>
                  </div>

                  {/* Pack Title & Description */}
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                    {pack.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {pack.description}
                  </p>
                </div>

                {/* Footer and Actions */}
                <div className="pt-4 mt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onLoadPackToBuilder(pack)}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Personalizar</span>
                  </button>

                  <button
                    onClick={() => onDownloadPackDirectly(pack)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-md transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar .ZIP</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
