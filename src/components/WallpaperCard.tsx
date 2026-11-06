import type { Wallpaper } from '../types/wallpaper'
import { Download, Heart, Maximize2 } from 'lucide-react'

interface Props {
  wallpaper: Wallpaper
  selected: boolean
  likes: number
  downloads: number
  onToggle: () => void
  onLike: () => void
  onInspect: () => void
  onDownload: () => void
  onImageLoad: (width: number, height: number) => void
}

export default function WallpaperCard({
  wallpaper,
  selected,
  likes,
  downloads,
  onToggle,
  onLike,
  onInspect,
  onDownload,
  onImageLoad,
}: Props) {
  return (
    <article className="wallpaper">
      <div className="image-wrap">
        <img
          src={wallpaper.url}
          alt={wallpaper.title}
          loading="lazy"
          decoding="async"
          onLoad={event => onImageLoad(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
        />
        <div className="wallpaper-tools">
          <span>{wallpaper.width && wallpaper.height ? `${wallpaper.width} × ${wallpaper.height}` : 'Original'}</span>
          <div className="wallpaper-tool-buttons">
            <button className={likes > 0 ? 'liked' : ''} onClick={onLike} aria-label={`Me gusta ${wallpaper.title}`}><Heart size={14} fill={likes > 0 ? 'currentColor' : 'none'} /></button>
            <button onClick={onDownload} aria-label={`Descargar ${wallpaper.title}`}><Download size={14} /></button>
            <button onClick={onInspect} aria-label={`Inspeccionar ${wallpaper.title}`}><Maximize2 size={14} /></button>
          </div>
        </div>
        <button
          className={selected ? 'wallpaper-add selected' : 'wallpaper-add'}
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={`${selected ? 'Quitar' : 'Añadir'} ${wallpaper.title}`}
        >{selected ? '✓ En Pack' : '+ Al Pack'}</button>
      </div>
      <h3 title={wallpaper.title}>{wallpaper.title}</h3>
      <p>
        {wallpaper.category}
        {wallpaper.width && wallpaper.height ? ` · ${wallpaper.width}×${wallpaper.height}` : ''}
        {wallpaper.size ? ` · ${(wallpaper.size / 1024 / 1024).toFixed(1)} MB` : ''}
        {` · ${downloads} descargas · ${likes} likes`}
      </p>
    </article>
  )
}
