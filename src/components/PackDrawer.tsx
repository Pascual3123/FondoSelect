import React from 'react';
import { Layers, Download, X, ArrowUpRight } from 'lucide-react';
import { Wallpaper } from '../types/wallpaper';

interface PackDrawerProps {
  packItems: Wallpaper[];
  onOpenBuilder: () => void;
  onClearPack: () => void;
  onQuickDownloadZip: () => void;
  isDownloadingZip: boolean;
}

export const PackDrawer: React.FC<PackDrawerProps> = ({
  packItems,
  onOpenBuilder,
  onClearPack,
  onQuickDownloadZip,
  isDownloadingZip
}) => {
  if (packItems.length === 0) return null;

  return (
    <aside 
      aria-label="Bandeja de pack personalizado"
      className="fixed bottom-5 inset-x-4 max-w-2xl mx-auto z-40 bg-zinc-950/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-white transition-all animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Preview thumbnail avatars & count */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex -space-x-3 overflow-hidden shrink-0">
            {packItems.slice(0, 4).map((item, idx) => (
              <img
                key={item.id}
                src={item.imageUrl}
                alt={item.title}
                className="w-9 h-9 rounded-lg object-cover ring-2 ring-zinc-900"
                referrerPolicy="no-referrer"
              />
            ))}
            {packItems.length > 4 && (
              <div className="w-9 h-9 rounded-lg bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-300">
                +{packItems.length - 4}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white truncate">
                Pack en Curso
              </span>
              <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                ({packItems.length} fondos)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block truncate">
              Listo para comprimir y descargar en un solo .ZIP
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearPack}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Vaciar pack"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenBuilder}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <span>Organizar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onQuickDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">
              {isDownloadingZip ? 'Comprimiendo...' : 'Descargar ZIP'}
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
};
