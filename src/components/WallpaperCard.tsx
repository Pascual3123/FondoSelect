import React, { useState } from 'react';
import { Plus, Check, Heart, Eye, Download } from 'lucide-react';
import { Wallpaper } from '../types/wallpaper';

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  isInPack: boolean;
  onTogglePack: (wallpaper: Wallpaper) => void;
  onOpenLightbox: (wallpaper: Wallpaper) => void;
  onQuickDownload: (wallpaper: Wallpaper) => void;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  wallpaper,
  isInPack,
  onTogglePack,
  onOpenLightbox,
  onQuickDownload
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(wallpaper.likes);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const isMobileAspect = wallpaper.aspectRatio === '9:16';

  return (
    <div className={`group relative flex flex-col rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 transition-all duration-300 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 ${
      isMobileAspect ? 'sm:row-span-2' : ''
    }`}>
      {/* Image Container */}
      <div 
        onClick={() => onOpenLightbox(wallpaper)}
        className={`relative w-full overflow-hidden bg-zinc-900 cursor-pointer ${
          isMobileAspect ? 'aspect-9/16' : 'aspect-16/9'
        }`}
      >
        {/* Placeholder / gradient fallback while loading */}
        {!imageLoaded && (
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${wallpaper.palette[0] || '#18181b'}, ${wallpaper.palette[1] || '#27272a'})`
            }}
          />
        )}

        <img
          src={wallpaper.imageUrl}
          alt={wallpaper.title}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-103 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Subtle Dark Gradient Overlay for legible controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Top Badges & Actions (Hover reveal) */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[11px] font-mono tracking-wider font-semibold text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded">
            {wallpaper.resolution.includes('2160 × 3840') ? 'MOBILE 4K' : '4K UHD'}
          </span>

          <button
            onClick={handleLike}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
              liked
                ? 'bg-rose-500 text-white'
                : 'bg-black/50 hover:bg-black/80 text-white/90'
            }`}
            title="Me gusta"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Hover Action: Eye / Inspect */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full pointer-events-auto hover:bg-black/80 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa</span>
          </span>
        </div>

        {/* Bottom Actions Overlay on hover */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickDownload(wallpaper);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-md backdrop-blur-md transition-colors cursor-pointer"
            title="Descargar wallpaper original"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>

          {/* Primary Pack button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePack(wallpaper);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md backdrop-blur-md transition-all cursor-pointer shadow-sm ${
              isInPack
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-white text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            {isInPack ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>En Pack</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Al Pack</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card Content & Metadata below image */}
      <div className="p-3.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {wallpaper.title}
          </h4>
          <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
            {wallpaper.fileSize}
          </span>
        </div>

        {/* Clean unboxed metadata (§1.A Zero-Pill) */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="truncate">{wallpaper.author}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums shrink-0">{likeCount} likes</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums shrink-0">{wallpaper.downloads} descargas</span>
        </div>

        {/* Clean subtle tags list */}
        {wallpaper.tags && wallpaper.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {wallpaper.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
