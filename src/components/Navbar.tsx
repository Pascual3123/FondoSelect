import React from 'react';
import { Sun, Moon, Layers, Download } from 'lucide-react';

interface NavbarProps {
  currentTab: 'explorar' | 'packs' | 'creador';
  onSelectTab: (tab: 'explorar' | 'packs' | 'creador') => void;
  packCount: number;
  onOpenPackDrawer: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  packCount,
  onOpenPackDrawer,
  isDark,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#070709]/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('explorar')}
          className="text-left group flex items-center gap-2 cursor-pointer focus-visible:outline-none"
        >
          <span className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 whitespace-nowrap shrink-0 transition-colors">
            Wallora
          </span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            4K
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onSelectTab('explorar')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'explorar'
                ? 'text-zinc-950 dark:text-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Explorar Fondos
          </button>
          <button
            onClick={() => onSelectTab('packs')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'packs'
                ? 'text-zinc-950 dark:text-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Pre-Packs
          </button>
          <button
            onClick={() => onSelectTab('creador')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'creador'
                ? 'text-zinc-950 dark:text-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Creador de Packs
          </button>
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="./wallora-codigo-fuente.zip"
            download="wallora-codigo-fuente.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            title="Descargar ZIP con todo el código del proyecto para tu Git"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar Código .ZIP</span>
          </a>

          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema de color"
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenPackDrawer}
            className="relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Mi Pack</span>
            <span className="font-mono tabular-nums px-1.5 py-0.2 text-[11px] font-semibold bg-white/20 dark:bg-black/10 rounded">
              {packCount}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
