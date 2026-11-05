import JSZip from 'jszip';
import { Wallpaper } from '../types/wallpaper';

/**
 * Converts an image URL (or fallback generated canvas) to a Blob for reliable packaging
 */
async function getImageBlob(imageUrl: string, title: string, resolution: string): Promise<Blob> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Fetch failed');
    return await response.blob();
  } catch (err) {
    // Elegant fallback: create an HD canvas with title and color gradient matching the piece
    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 2160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0a0a0c');
      gradient.addColorStop(0.5, '#18181b');
      gradient.addColorStop(1, '#27272a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px Outfit, sans-serif';
      ctx.fillText(title, 140, 240);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Wallora Wallpaper · ${resolution} · 4K UHD`, 140, 320);
    }
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.95);
    });
  }
}

/**
 * Downloads a single wallpaper directly
 */
export async function downloadSingleWallpaper(wallpaper: Wallpaper, targetResolution?: string): Promise<void> {
  const blob = await getImageBlob(wallpaper.imageUrl, wallpaper.title, targetResolution || wallpaper.resolution);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = wallpaper.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.href = blobUrl;
  link.download = `wallora_${safeTitle}_${(targetResolution || wallpaper.resolution).replace(/\s+/g, '')}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

/**
 * Packages multiple wallpapers into a real ZIP archive and triggers download
 */
export async function downloadWallpaperPack(
  packName: string,
  wallpapers: Wallpaper[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<void> {
  if (wallpapers.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder(packName.replace(/[^a-z0-9]/gi, '_').toLowerCase()) || zip;

  // Add a manifest text file
  let manifest = `====================================================\n`;
  manifest += ` PACK DE FONDOS WALLORA: ${packName.toUpperCase()}\n`;
  manifest += ` Generado el: ${new Date().toLocaleDateString('es-ES')}\n`;
  manifest += ` Total de fondos: ${wallpapers.length}\n`;
  manifest += ` Web: https://wallora.app\n`;
  manifest += `====================================================\n\n`;

  manifest += `LISTA DE FONDOS INCLUIDOS:\n`;
  wallpapers.forEach((w, index) => {
    manifest += `${index + 1}. ${w.title} (${w.resolution}) - Autor: ${w.author} (${w.authorHandle})\n`;
  });

  manifest += `\nLicencia: Libre de uso para personalización de escritorio y móvil.\n`;
  manifest += `¡Gracias por usar Wallora!\n`;

  folder.file('README_PACK_INFO.txt', manifest);

  const total = wallpapers.length;
  for (let i = 0; i < total; i++) {
    const wall = wallpapers[i];
    if (onProgress) {
      onProgress(i + 1, total, `Procesando: ${wall.title}...`);
    }

    const blob = await getImageBlob(wall.imageUrl, wall.title, wall.resolution);
    const safeTitle = `${String(i + 1).padStart(2, '0')}_${wall.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
    folder.file(safeTitle, blob);
  }

  if (onProgress) {
    onProgress(total, total, 'Generando archivo comprimido .ZIP...');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(total, total, `Comprimiendo: ${Math.round(metadata.percent)}%`);
    }
  });

  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `wallora_pack_${packName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
}
