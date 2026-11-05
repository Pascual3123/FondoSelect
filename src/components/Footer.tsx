import React from 'react';
import { ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#070709] py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Wallora
              </span>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                / Plataforma de Fondos en Pack
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Fondos de pantalla en ultra alta definición curados para amantes del diseño limpio y la personalización por lotes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <a href="#explorar" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Explorar
            </a>
            <a href="#packs" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Pre-Packs
            </a>
            <a href="#creador" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Armar Pack
            </a>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <span>Subir</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} Wallora. Imágenes en alta resolución bajo licencia de uso libre.</p>
          <div className="flex items-center gap-4">
            <span>Resoluciones 4K & 8K nativas</span>
            <span aria-hidden="true">·</span>
            <span>Empaquetado .ZIP sin pérdida</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
