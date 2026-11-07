import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const sources = JSON.parse(
  readFileSync(join(root, 'src/data/wallpaper-sources.json'), 'utf8'),
)
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'wallpaper-catalog-'))
const files = []
const revisions = {}
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

function shouldSkipCatalogPath(path) {
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

try {
  for (const source of sources) {
    const repository = `${source.owner}/${source.repo}`
    const checkout = join(temporaryDirectory, source.repo)
    const remote = `https://github.com/${repository}.git`

    execFileSync('git', [
      'clone',
      '--filter=blob:none',
      '--no-checkout',
      '--depth=1',
      '--branch',
      source.branch,
      remote,
      checkout,
    ], { stdio: 'inherit' })

    const revision = execFileSync(
      'git',
      ['-C', checkout, 'rev-parse', 'HEAD'],
      { encoding: 'utf8' },
    ).trim()
    revisions[repository] = revision

    const tree = execFileSync(
      'git',
      ['-C', checkout, 'ls-tree', '-r', 'HEAD'],
      { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
    )

    for (const line of tree.split('\n')) {
      const separator = line.indexOf('\t')
      if (separator < 0) continue

      const metadata = line.slice(0, separator).trim().split(/\s+/)
      const path = line.slice(separator + 1)
      if (metadata[1] !== 'blob' || !/\.(png|jpe?g|webp)$/i.test(path) || shouldSkipCatalogPath(path)) continue

      files.push({
        sourceRepo: repository,
        path,
      })
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    sources: revisions,
    files,
  }
  writeFileSync(
    join(root, 'public/wallpaper-catalog.json'),
    `${JSON.stringify(catalog)}\n`,
  )
  console.log(`Updated catalog with ${files.length} images from ${sources.length} repositories.`)
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
