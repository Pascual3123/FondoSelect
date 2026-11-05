import React from 'react';
import { Search, X, Monitor, Smartphone, Tag } from 'lucide-react';
import { WallpaperCategory } from '../types/wallpaper';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: WallpaperCategory;
  onSelectCategory: (cat: WallpaperCategory) => void;
  selectedDevice: 'all' | 'desktop' | 'mobile';
  onSelectDevice: (device: 'all' | 'desktop' | 'mobile') => void;
  sortBy: 'popular' | 'recent' | 'downloads';
  onSelectSort: (sort: 'popular' | 'recent' | 'downloads') => void;
  totalResults: number;
}

const CATEGORIES: { id: WallpaperCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'nord', label: 'Nord Frost' },
  { id: 'gruvbox', label: 'Gruvbox' },
  { id: 'minimalista', label: 'Minimalista' },
  { id: 'oled', label: 'OLED Noir' },
  { id: 'paisajes', label: 'Paisajes' },
  { id: 'cyber', label: 'Cyber & Outrun' },
  { id: 'arquitectura', label: 'Arquitectura' },
  { id: 'abstracto', label: 'Abstracto' },
  { id: 'calm', label: 'Calm & Zen' }
];

const POPULAR_TAGS = [
  'nord',
  'gruvbox',
  'minimal',
  'montaña',
  'oled',
  'neon',
  'osaka',
  'synthwave',
  'bosque',
  'playa',
  'espacio',
  'estrellas'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedDevice,
  onSelectDevice,
  sortBy,
  onSelectSort,
  totalResults
}) => {
  return (
    <div className="space-y-3.5">
      {/* Top Search & Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por tags (nord, gruvbox, montaña, neon, minimal)..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Device Format and Sort controls */}
        <div className="flex items-center gap-2">
          {/* Format segmented control */}
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <button
              onClick={() => onSelectDevice('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedDevice === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onSelectDevice('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedDevice === 'desktop'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => onSelectDevice('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedDevice === 'mobile'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Móvil</span>
            </button>
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSelectSort(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
          >
            <option value="popular">Más Populares</option>
            <option value="recent">Nuevos Ingresos</option>
            <option value="downloads">Más Descargados</option>
          </select>
        </div>

      </div>

      {/* Category Tabs Row (Segmented interactive buttons) */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap shrink-0">
          <span className="font-mono tabular-nums">{totalResults}</span> fondos disponibles
        </div>
      </div>

      {/* Clickable Quick Tags Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1 shrink-0 font-medium text-zinc-400 dark:text-zinc-500">
          <Tag className="w-3 h-3" />
          <span>Tags:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {POPULAR_TAGS.map((tag) => {
            const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => onSearchChange(isSelected ? '' : tag)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
