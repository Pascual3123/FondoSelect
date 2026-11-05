import { useEffect, useState } from 'react'
import { getWallpapers } from '../lib/github'
import type { Wallpaper } from '../types/wallpaper'

export function useWallpapers() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    getWallpapers(controller.signal)
      .then(setWallpapers)
      .catch(error => {
        if (!controller.signal.aborted) setError(String(error.message))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { wallpapers, loading, error }
}
