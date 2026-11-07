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
const genericFilenameWords = new Set([
  'wallpaper',
  'wallpapers',
  'image',
  'images',
  'img',
  'photo',
  'photos',
  'picture',
  'pictures',
  'download',
  'original',
  'untitled',
  'screenshot',
  'screen',
  'background',
  'desktop',
  'mobile',
  'anime',
  'art',
  'abstract',
  'animated',
  'backgrounds',
  'banner',
  'episode',
  'color',
  'colors',
  'landscape',
  'nature',
  'minimal',
  'nord',
  'dark',
  'light',
  'wide',
  'result',
  'illust',
  'wallpaperflare',
  'wallhaven',
  'p',
  'hd',
  'uhd',
  '4k',
  '8k',
  'final',
  'copy',
  'new',
])

function shouldSkipWallpaperPath(path: string) {
  const normalized = path.replace(/\\/g, '/').toLowerCase()
  const basename = normalized.split('/').pop() ?? ''
  const filename = basename.replace(/\.[^.]+$/, '').replace(/(?<=\p{L})\d+$/u, '')
  const words = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(word => word.length > 1 && !/\d/.test(word))

  if (basename.startsWith('.')) return true
  if (normalized.includes('/__macosx/')) return true
  if (normalized.includes('/desktop/wallpapers/') || normalized.startsWith('desktop/wallpapers/')) return true
  if (/\d{3,5}x\d{3,5}/.test(basename)) return true
  if (/^windows(?:[._ -]?\d+)?(?:_logo|_joke|_pink)?\.(png|jpe?g|webp)$/i.test(basename)) return true
  if (!words.some(word => !genericFilenameWords.has(word))) return true

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
        .replace(/(?<=\p{L})\d+$/u, '')
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
