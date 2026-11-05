import React, { useState } from 'react';
import { X, Trash2, ArrowUp, ArrowDown, Download, CheckCircle2, Sparkles, FolderArchive, Plus } from 'lucide-react';
import { Wallpaper } from '../types/wallpaper';
import { downloadWallpaperPack } from '../utils/zipDownloader';

interface PackBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  packItems: Wallpaper[];
  onRemoveItem: (id: string) => void;
  onReorder: (newItems: Wallpaper[]) => void;
  onLoadRecommended: () => void;
  onBrowseGallery: () => void;
}

export const PackBuilderModal: React.FC<PackBuilderModalProps> = ({
  isOpen,
  onClose,
  packItems,
  onRemoveItem,
  onReorder,
  onLoadRecommended,
  onBrowseGallery
}) => {
  const [packName, setPackName] = useState('Mi Colección Wallora');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: ''
  });
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= packItems.length) return;
    const updated = [...packItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onReorder(updated);
  };

  const handleStartDownload = async () => {
    if (packItems.length === 0) return;
    setIsExporting(true);
    setIsFinished(false);

    try {
      await downloadWallpaperPack(packName, packItems, (current, total, message) => {
        setExportProgress({ current, total, message });
      });
      setIsFinished(true);
      setTimeout(() => {
        setIsExporting(false);
        setIsFinished(false);
      }, 3500);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col text-zinc-900 dark:text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Creador de Packs</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Organiza tus fondos seleccionados y descarga un único archivo comprimido
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Pack Name Field */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
              Nombre del Pack (.ZIP)
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="Ej: Minimal Studio 2026..."
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
            />
          </div>

          {/* Wallpapers List */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Fondos en este Pack ({packItems.length})
              </span>
              <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                Calidad Nativa 4K UHD
              </span>
            </div>

            {packItems.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Tu pack está vacío actualmente.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    onClick={onLoadRecommended}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cargar Selección Recomendada (4 Fondos)</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onBrowseGallery();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Ir a Explorar Galería</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {packItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 transition-colors"
                  >
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-medium text-zinc-400 w-5 text-center">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-10 object-cover rounded-md border border-zinc-200 dark:border-zinc-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <span className="font-mono tabular-nums">{item.resolution}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.fileSize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls (Reorder & Remove) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Subir posición"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === packItems.length - 1}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Bajar posición"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        title="Quitar del pack"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Packaging Progress Box */}
          {isExporting && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-900 dark:text-zinc-100">
                  {exportProgress.message || 'Procesando archivo...'}
                </span>
                <span className="font-mono tabular-nums text-zinc-500">
                  {exportProgress.current} / {exportProgress.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-950 dark:bg-zinc-100 transition-all duration-200"
                  style={{
                    width: exportProgress.total ? `${(exportProgress.current / exportProgress.total) * 100}%` : '50%'
                  }}
                />
              </div>
            </div>
          )}

          {/* Success Notification */}
          {isFinished && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Pack descargado con éxito! Revisa tu carpeta de Descargas.</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <span>Incluye manifiesto de autores y licencias CC0 en texto plano.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleStartDownload}
              disabled={packItems.length === 0 || isExporting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting ? 'Generando ZIP...' : `Descargar Pack Completo (${packItems.length})`}
              </span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
