import type { Wallpaper } from '../types/wallpaper'

interface GitTree {
  truncated?: boolean
  tree: {
    path: string
    type: string
    size?: number
  }[]
}

export async function getWallpapers(
  signal?: AbortSignal,
): Promise<Wallpaper[]> {
  const response = await fetch(
    'https://api.github.com/repos/dharmx/walls/git/trees/main?recursive=1',
    { signal },
  )

  if (!response.ok) {
    throw new Error(
      `GitHub respondió ${response.status}. Puede haberse alcanzado el límite público de peticiones; inténtalo más tarde.`,
    )
  }

  const data: GitTree = await response.json()

  if (data.truncated) {
    throw new Error('GitHub devolvió un catálogo incompleto. Es necesario recorrer las subcarpetas por separado.')
  }

  return data.tree
    .filter(item =>
      item.type === 'blob' && /\.(png|jpe?g|webp)$/i.test(item.path),
    )
    .map(item => ({
      id: item.path,
      title: item.path
        .split('/')
        .pop()!
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]/g, ' '),
      category: item.path.includes('/')
        ? item.path.split('/')[0]
        : 'Otros',
      path: item.path,
      size: item.size,
      url:
        'https://raw.githubusercontent.com/dharmx/walls/main/' +
        item.path.split('/').map(encodeURIComponent).join('/'),
    }))
}
