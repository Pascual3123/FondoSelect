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
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export async function downloadPack(
  wallpapers: Wallpaper[],
  name: string,
  onProgress: (percent: number, message: string) => void,
) {
  if (!wallpapers.length) throw new Error('Añade al menos un fondo.')

  const zip = new JSZip()

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

    zip.file(wallpaper.path, await response.arrayBuffer())
    onProgress(
      Math.round(((i + 1) / wallpapers.length) * 80),
      `Recibidos ${i + 1}/${wallpapers.length} archivos`,
    )
  }

  zip.file(
    'README_PACK_INFO.txt',
    [
      `Wallora — ${name}`,
      `Fecha: ${new Date().toISOString()}`,
      'Fuente: https://github.com/dharmx/walls',
      'Créditos de la colección: dharmx/walls y sus colaboradores.',
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
  saveBlob(blob, `${filename || 'Wallora-Pack'}.zip`)
  onProgress(100, '¡ZIP generado! Descarga iniciada.')
}
