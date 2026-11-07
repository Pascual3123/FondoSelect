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

function shouldSkipCatalogPath(path) {
  const normalized = path.replace(/\\/g, '/').toLowerCase()
  const basename = normalized.split('/').pop() ?? ''

  if (normalized.includes('/__macosx/')) return true
  if (normalized.includes('/desktop/wallpapers/') || normalized.startsWith('desktop/wallpapers/')) return true
  if (/\d{3,5}x\d{3,5}/.test(basename)) return true
  if (/^windows(?:[._ -]?\d+)?(?:_logo|_joke|_pink)?\.(png|jpe?g|webp)$/i.test(basename)) return true

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
