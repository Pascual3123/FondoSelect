import type { Wallpaper } from '../types/wallpaper'

interface Props {
  wallpaper: Wallpaper
  selected: boolean
  onToggle: () => void
}

export default function WallpaperCard({
  wallpaper,
  selected,
  onToggle,
}: Props) {
  return (
    <article className="wallpaper">
      <div className="image-wrap">
        <img
          src={wallpaper.url}
          alt={wallpaper.title}
          loading="lazy"
          decoding="async"
        />
        <button
          className={selected ? 'add selected' : 'add'}
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={`${selected ? 'Quitar' : 'Añadir'} ${wallpaper.title}`}
        >
          {selected ? '✓ En Pack' : '+ Al Pack'}
        </button>
      </div>
      <h3 title={wallpaper.title}>{wallpaper.title}</h3>
      <p className="muted text-xs">
        {wallpaper.category}
        {wallpaper.size
          ? ` · ${(wallpaper.size / 1024 / 1024).toFixed(1)} MB`
          : ''}
        {' · Original'}
      </p>
    </article>
  )
}
