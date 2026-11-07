import sourceDefinitions from '../data/wallpaper-sources.json'
import type { Wallpaper } from '../types/wallpaper'

interface WallpaperSource {
  owner: string
  repo: string
  branch: string
  category?: string
  animeOnly?: boolean
}

interface CatalogFile {
  sourceRepo: string
  path: string
  size?: number
}

interface WallpaperCatalog {
  files: CatalogFile[]
}

const sources: WallpaperSource[] = sourceDefinitions

function shouldSkipWallpaperPath(path: string) {
  const normalized = path.replace(/\\/g, '/').toLowerCase()
  const basename = normalized.split('/').pop() ?? ''

  if (normalized.includes('/__macosx/')) return true
  if (normalized.includes('/desktop/wallpapers/') || normalized.startsWith('desktop/wallpapers/')) return true
  if (/\d{3,5}x\d{3,5}/.test(basename)) return true
  if (/^windows(?:[._ -]?\d+)?(?:_logo|_joke|_pink)?\.(png|jpe?g|webp)$/i.test(basename)) return true

  return false
}

export async function getWallpapers(signal?: AbortSignal): Promise<Wallpaper[]> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}wallpaper-catalog.json`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`No se pudo cargar el índice local de fondos (HTTP ${response.status}).`)
  }

  const catalog: WallpaperCatalog = await response.json()
  return catalog.files.flatMap(item => {
    const source = sources.find(
      candidate => `${candidate.owner}/${candidate.repo}` === item.sourceRepo,
    )
    if (!source || shouldSkipWallpaperPath(item.path)) {
      return []
    }
    if (source.animeOnly && !/anime|waifu/i.test(item.path)) {
      return []
    }

    return [{
      id: item.sourceRepo === 'dharmx/walls'
        ? item.path
        : `${item.sourceRepo}:${item.path}`,
      title: item.path
        .split('/')
        .pop()!
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]/g, ' '),
      category: source.category ?? (item.path.includes('/')
        ? item.path.split('/')[0]
        : 'Otros'),
      path: item.path,
      size: item.size,
      url:
        `https://raw.githubusercontent.com/${item.sourceRepo}/${source.branch}/` +
        item.path.split('/').map(encodeURIComponent).join('/'),
      sourceRepo: item.sourceRepo,
      sourceUrl: `https://github.com/${item.sourceRepo}`,
    }]
  })
}
