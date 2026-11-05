import React, { useState, useEffect, useMemo } from 'react';
import { WALLPAPERS, CURATED_PACKS } from './data/wallpapers';
import { Wallpaper, WallpaperCategory, CuratedPack } from './types/wallpaper';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { WallpaperCard } from './components/WallpaperCard';
import { WallpaperLightbox } from './components/WallpaperLightbox';
import { PackDrawer } from './components/PackDrawer';
import { PackBuilderModal } from './components/PackBuilderModal';
import { CuratedPacksSection } from './components/CuratedPacksSection';
import { Footer } from './components/Footer';
import { downloadSingleWallpaper, downloadWallpaperPack } from './utils/zipDownloader';

export default function App() {
  // Theme state: dark default for wallpaper platforms
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('wallora_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wallora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wallora_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Navigation tabs
  const [currentTab, setCurrentTab] = useState<'explorar' | 'packs' | 'creador'>('explorar');

  // Pack state (persists in localStorage)
  const [packItems, setPackItems] = useState<Wallpaper[]>(() => {
    try {
      const saved = localStorage.getItem('wallora_user_pack');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        return WALLPAPERS.filter(w => ids.includes(w.id));
      }
    } catch (e) {
      // ignore
    }
    // Default starter pack: 2 curated items so the user immediately sees how packs work!
    return [WALLPAPERS[0], WALLPAPERS[1]];
  });

  useEffect(() => {
    localStorage.setItem('wallora_user_pack', JSON.stringify(packItems.map(w => w.id)));
  }, [packItems]);

  // Pack Drawer and Modal states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isDrawerDownloading, setIsDrawerDownloading] = useState(false);

  // Lightbox inspector state
  const [activeLightboxWallpaper, setActiveLightboxWallpaper] = useState<Wallpaper | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WallpaperCategory>('todos');
  const [selectedDevice, setSelectedDevice] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'downloads'>('popular');

  // Pack management actions
  const togglePackItem = (wallpaper: Wallpaper) => {
    setPackItems(prev => {
      const exists = prev.some(item => item.id === wallpaper.id);
      if (exists) {
        return prev.filter(item => item.id !== wallpaper.id);
      } else {
        return [...prev, wallpaper];
      }
    });
  };

  const removePackItem = (id: string) => {
    setPackItems(prev => prev.filter(item => item.id !== id));
  };

  const clearPack = () => {
    setPackItems([]);
  };

  const handleReorderPack = (newItems: Wallpaper[]) => {
    setPackItems(newItems);
  };

  const handleLoadRecommended = () => {
    setPackItems(WALLPAPERS.slice(0, 4));
  };

  const handleLoadCuratedPack = (pack: CuratedPack) => {
    const items = WALLPAPERS.filter(w => pack.wallpaperIds.includes(w.id));
    setPackItems(items);
    setIsBuilderOpen(true);
  };

  const handleQuickDownloadFromDrawer = async () => {
    if (packItems.length === 0) return;
    setIsDrawerDownloading(true);
    try {
      await downloadWallpaperPack('Mi_Coleccion_Wallora', packItems);
    } finally {
      setIsDrawerDownloading(false);
    }
  };

  const handleQuickDownloadSingle = (wallpaper: Wallpaper) => {
    downloadSingleWallpaper(wallpaper);
  };

  const handleDownloadCuratedPackDirectly = async (pack: CuratedPack) => {
    const items = WALLPAPERS.filter(w => pack.wallpaperIds.includes(w.id));
    if (items.length === 0) return;
    await downloadWallpaperPack(pack.title, items);
  };

  // Filtered Wallpapers
  const filteredWallpapers = useMemo(() => {
    let result = [...WALLPAPERS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.author.toLowerCase().includes(q) ||
        w.tags.some(t => t.toLowerCase().includes(q)) ||
        w.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'todos') {
      result = result.filter(w => w.category === selectedCategory);
    }

    if (selectedDevice !== 'all') {
      result = result.filter(w => w.deviceType === selectedDevice);
    }

    if (sortBy === 'popular') {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'recent') {
      result.reverse();
    }

    return result;
  }, [searchQuery, selectedCategory, selectedDevice, sortBy]);

  const scrollToGallery = () => {
    const el = document.getElementById('galeria-wallpapers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 transition-colors">
      
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'creador') {
            setIsBuilderOpen(true);
          } else if (tab === 'packs') {
            const el = document.getElementById('seccion-packs');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else if (tab === 'explorar') {
            scrollToGallery();
          }
        }}
        packCount={packItems.length}
        onOpenPackDrawer={() => setIsBuilderOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {/* Split Hero Section */}
        <Hero
          featuredWallpaper={WALLPAPERS[0]}
          isInPack={packItems.some(item => item.id === WALLPAPERS[0].id)}
          onTogglePack={togglePackItem}
          onOpenLightbox={(wall) => setActiveLightboxWallpaper(wall)}
          onStartPackCreator={() => setIsBuilderOpen(true)}
          onScrollToGallery={scrollToGallery}
        />

        {/* Curated Pre-made Packs Section */}
        <div id="seccion-packs">
          <CuratedPacksSection
            packs={CURATED_PACKS}
            allWallpapers={WALLPAPERS}
            onLoadPackToBuilder={handleLoadCuratedPack}
            onDownloadPackDirectly={handleDownloadCuratedPackDirectly}
          />
        </div>

        {/* Gallery / Explorar Section */}
        <section id="galeria-wallpapers" className="py-12 max-w-7xl mx-auto px-6">
          
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mb-2">
              Explorar Fondos de Pantalla
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Haz clic en cualquier imagen para inspeccionar la paleta cromática o pulsa "+ Al Pack" para seleccionarla en tu lote.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="mb-8">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
              sortBy={sortBy}
              onSelectSort={setSortBy}
              totalResults={filteredWallpapers.length}
            />
          </div>

          {/* Wallpapers Masonry/Bento Grid */}
          {filteredWallpapers.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No se encontraron fondos con el criterio seleccionado.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                  setSelectedDevice('all');
                }}
                className="mt-3 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 rounded-md hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
              {filteredWallpapers.map((wallpaper) => (
                <WallpaperCard
                  key={wallpaper.id}
                  wallpaper={wallpaper}
                  isInPack={packItems.some(item => item.id === wallpaper.id)}
                  onTogglePack={togglePackItem}
                  onOpenLightbox={(w) => setActiveLightboxWallpaper(w)}
                  onQuickDownload={handleQuickDownloadSingle}
                />
              ))}
            </div>
          )}

        </section>
      </main>

      {/* Floating Bottom Pack Drawer */}
      <PackDrawer
        packItems={packItems}
        onOpenBuilder={() => setIsBuilderOpen(true)}
        onClearPack={clearPack}
        onQuickDownloadZip={handleQuickDownloadFromDrawer}
        isDownloadingZip={isDrawerDownloading}
      />

      {/* Fullscreen Lightbox Modal */}
      <WallpaperLightbox
        wallpaper={activeLightboxWallpaper}
        onClose={() => setActiveLightboxWallpaper(null)}
        isInPack={activeLightboxWallpaper ? packItems.some(i => i.id === activeLightboxWallpaper.id) : false}
        onTogglePack={togglePackItem}
        onSelectTag={(tag) => {
          setSearchQuery(tag);
          scrollToGallery();
        }}
      />

      {/* Dedicated Custom Pack Builder Workstation */}
      <PackBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        packItems={packItems}
        onRemoveItem={removePackItem}
        onReorder={handleReorderPack}
        onLoadRecommended={handleLoadRecommended}
        onBrowseGallery={() => {
          setIsBuilderOpen(false);
          scrollToGallery();
        }}
      />

      {/* Clean Minimal Footer */}
      <Footer />

    </div>
  );
}
