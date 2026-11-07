import JSZip from 'jszip'
import type { Wallpaper } from '../types/wallpaper'

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export type WallpaperResolution = 'original' | '4k' | '2k' | 'fhd' | 'mobile'

const resolutionBounds: Record<Exclude<WallpaperResolution, 'original'>, [number, number]> = {
  '4k': [3840, 2160],
  '2k': [2560, 1440],
  fhd: [1920, 1080],
  mobile: [1440, 2560],
}

export async function downloadWallpaper(
  wallpaper: Wallpaper,
  resolution: WallpaperResolution = 'original',
) {
  const response = await fetch(wallpaper.url)
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${wallpaper.title} (${response.status}).`)
  }
  const source = await response.blob()

  if (resolution === 'original') {
    saveBlob(source, wallpaper.path.split('/').pop() || 'wallpaper')
    return
  }

  const bitmap = await createImageBitmap(source)
  const [maxWidth, maxHeight] = resolutionBounds[resolution]
  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
  if (scale === 1) {
    bitmap.close()
    saveBlob(source, wallpaper.path.split('/').pop() || 'wallpaper')
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('El navegador no pudo preparar la imagen para esta resolución.')
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(source.type)
    ? source.type
    : 'image/jpeg'
  const resized = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob
        ? resolve(blob)
        : reject(new Error('El navegador no pudo convertir la imagen.')),
      mimeType,
      mimeType === 'image/jpeg' || mimeType === 'image/webp' ? 0.94 : undefined,
    )
  })
  const originalName = wallpaper.path.split('/').pop() || 'wallpaper'
  const extension = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '.jpg'
  const baseName = originalName.includes('.') ? originalName.slice(0, originalName.lastIndexOf('.')) : originalName
  const outputExtension = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp'
  saveBlob(resized, `${baseName}-${resolution}${extension.toLowerCase() === outputExtension ? extension : outputExtension}`)
}

export async function downloadPack(
  wallpapers: Wallpaper[],
  name: string,
  onProgress: (percent: number, message: string) => void,
) {
  if (!wallpapers.length) throw new Error('Añade al menos un fondo.')

  const zip = new JSZip()
  const sources = [...new Map(
    wallpapers.map(wallpaper => [wallpaper.sourceRepo, wallpaper.sourceUrl]),
  )]

  for (let i = 0; i < wallpapers.length; i++) {
    const wallpaper = wallpapers[i]
    onProgress(
      Math.round((i / wallpapers.length) * 80),
      `Descargando ${i + 1}/${wallpapers.length}: ${wallpaper.title}`,
    )

    const response = await fetch(wallpaper.url)
    if (!response.ok) {
      throw new Error(`No se pudo descargar: ${wallpaper.title}`)
    }

    zip.file(
      `${wallpaper.sourceRepo}/${wallpaper.path}`,
      await response.arrayBuffer(),
    )
    onProgress(
      Math.round(((i + 1) / wallpapers.length) * 80),
      `Recibidos ${i + 1}/${wallpapers.length} archivos`,
    )
  }

  zip.file(
    'README_PACK_INFO.txt',
    [
      `FondoSelect — ${name}`,
      `Fecha: ${new Date().toISOString()}`,
      'Fuentes:',
      ...sources.map(([repository, url]) => `- ${repository}: ${url}`),
      'Autoría individual: no verificada; consulta la fuente original.',
      'No se garantiza licencia CC0 para estas imágenes.',
      'Comprueba los permisos de cada imagen antes de redistribuirla.',
      '',
      ...wallpapers.map(w => `${w.title}\n${w.url}\n`),
    ].join('\n'),
  )

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'STORE' },
    metadata => onProgress(
      Math.round(80 + metadata.percent * 0.2),
      'Generando ZIP sin modificar las imágenes…',
    ),
  )

  const filename = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
  saveBlob(blob, `${filename || 'FondoSelect-Pack'}.zip`)
  onProgress(100, '¡ZIP generado! Descarga iniciada.')
}
