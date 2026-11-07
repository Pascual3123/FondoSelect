import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  CircleAlert,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Heart,
  Image,
  Laptop,
  Menu,
  Moon,
  Package,
  Search,
  Smartphone,
  Sun,
  X,
} from 'lucide-react'
import PackBuilder from './components/PackBuilder'
import WallpaperCard from './components/WallpaperCard'
import AuthDialog from './components/AuthDialog'
import DownloadGate from './components/DownloadGate'
import { useWallpapers } from './hooks/useWallpapers'
import { downloadPack, downloadWallpaper, type WallpaperResolution } from './lib/download'
import { supabase } from './lib/supabase'
import type { Wallpaper } from './types/wallpaper'
import type { User } from '@supabase/supabase-js'

type Preset = {
  name: string
  description: string
  keywords: string[]
  colors: string[]
}

const presets: Preset[] = [
  { name: 'Nord Frostbite', description: 'Azules fríos, niebla y calma nórdica.', keywords: ['nord', 'blue', 'snow', 'ice', 'winter', 'mountain'], colors: ['#2E3440', '#4C566A', '#88C0D0'] },
  { name: 'Gruvbox Ricing', description: 'Tonos retro, cálidos y llenos de carácter.', keywords: ['gruvbox', 'retro', 'amber', 'orange', 'brown', 'vintage'], colors: ['#282828', '#D79921', '#B16286'] },
  { name: 'OLED Noir Studio', description: 'Contraste profundo para pantallas OLED.', keywords: ['monochrome', 'black', 'dark', 'night', 'space', 'noir'], colors: ['#000000', '#171717', '#3B3B3B'] },
  { name: 'Minimalismo Esencial', description: 'Formas limpias, espacio y serenidad.', keywords: ['minimal', 'simple', 'abstract', 'geometry', 'white'], colors: ['#F0EDE7', '#AAA59D', '#393A3B'] },
  { name: 'Tokyo Neon', description: 'Luces urbanas y energía synthwave.', keywords: ['outrun', 'japan', 'neon', 'cyber', 'city', 'synthwave'], colors: ['#181426', '#FF4F9A', '#7C6CFF'] },
]

const categoryLabels: Record<string, string> = {
  anime: 'Anime',
  architecture: 'Arquitectura',
  abstract: 'Abstracto',
  dark: 'OLED Noir',
  monochrome: 'OLED Noir',
  landscape: 'Paisajes',
  mountain: 'Paisajes',
  aerial: 'Paisajes',
  minimal: 'Minimalista',
  nord: 'Nord Frost',
  gruvbox: 'Gruvbox',
  nature: 'Calm & Zen',
  calm: 'Calm & Zen',
  outrun: 'Cyber & Outrun',
  digital: 'Cyber & Outrun',
  space: 'Espacio',
  city: 'Ciudad',
  art: 'Arte',
}

const quickTags = ['nord', 'gruvbox', 'montaña', 'minimal', 'neon', 'osaka', 'playa', 'bosque', 'espacio']
const tagAliases: Record<string, string[]> = {
  montaña: ['montaña', 'mountain', 'mont'],
  playa: ['playa', 'beach', 'coast', 'sea'],
  bosque: ['bosque', 'forest', 'woods', 'tree'],
  espacio: ['espacio', 'space', 'galaxy', 'planet'],
}

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function presetItems(preset: Preset, wallpapers: Wallpaper[]) {
  const found = wallpapers.filter(wallpaper => {
    const text = normalized(`${wallpaper.title} ${wallpaper.category} ${wallpaper.path}`)
    return preset.keywords.some(keyword => text.includes(normalized(keyword)))
  })
  return (found.length ? found : wallpapers).slice(0, 8)
}

function formatSize(bytes?: number) {
  if (!bytes) return 'Tamaño original'
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function App() {
  const { wallpapers, loading, error } = useWallpapers()
  const [selected, setSelected] = useState<Wallpaper[]>([])
  const [builderOpen, setBuilderOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [format, setFormat] = useState('Todos')
  const [sort, setSort] = useState('popular')
  const [activeTag, setActiveTag] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [detail, setDetail] = useState<Wallpaper | null>(null)
  const [detailMode, setDetailMode] = useState<'original' | 'macbook' | 'iphone'>('original')
  const [likes, setLikes] = useState<Record<string, number>>({})
  const [downloads, setDownloads] = useState<Record<string, number>>({})
  const [dimensions, setDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [packName, setPackName] = useState('Mi Colección FondoSelect')
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null)
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)
  const [visibleCount, setVisibleCount] = useState(48)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [copied, setCopied] = useState('')
  const [resolution, setResolution] = useState<WallpaperResolution>('original')
  const [user, setUser] = useState<User | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [downloadGateOpen, setDownloadGateOpen] = useState(false)
  const [packRestored, setPackRestored] = useState(false)
  const [pendingDownload, setPendingDownload] = useState<{ kind: 'image' | 'pack'; items: Wallpaper[]; name: string; resolution: WallpaperResolution; claimId: string } | null>(null)
  const claimRequestInProgress = useRef(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setIsPremium(false)
    })
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) throw sessionError
      setUser(data.session?.user ?? null)
    }).catch(sessionError => {
      if (!active) return
      setNotice(`No se pudo restaurar la sesión: ${sessionError instanceof Error ? sessionError.message : 'Error desconocido.'}`)
      setNoticeError(true)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !user) return
    const client = supabase
    let active = true
    const checkoutReturned = new URLSearchParams(window.location.search).get('premium') === 'success'
    const loadEntitlement = async () => {
      for (let attempt = 0; attempt < (checkoutReturned ? 6 : 1); attempt++) {
        const { data, error: entitlementError } = await client
          .from('user_entitlements')
          .select('plan,status,current_period_end')
          .eq('user_id', user.id)
          .single()
        if (!active) return
        if (entitlementError) throw entitlementError
        const premium = data.plan === 'premium'
          && ['active', 'trialing'].includes(data.status)
          && (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now())
        setIsPremium(premium)
        if (premium && checkoutReturned) {
          const url = new URL(window.location.href)
          url.searchParams.delete('premium')
          window.history.replaceState({}, '', url)
        }
        if (premium || !checkoutReturned) return
        await new Promise(resolve => window.setTimeout(resolve, 2000))
      }
    }
    void loadEntitlement().catch(entitlementError => {
      if (!active) return
      setNotice(`No se pudo consultar tu plan: ${entitlementError instanceof Error ? entitlementError.message : 'Error desconocido.'}`)
      setNoticeError(true)
    })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (loading || error || packRestored) return
    try {
      const savedIds: unknown = JSON.parse(sessionStorage.getItem('fondoselect:selected') ?? '[]')
      if (Array.isArray(savedIds) && savedIds.every(id => typeof id === 'string')) {
        const ids = new Set(savedIds)
        setSelected(wallpapers.filter(wallpaper => ids.has(wallpaper.id)))
      }
    } catch (storageError) {
      console.error('Unable to restore the selected pack', storageError)
      setNotice('No se pudo restaurar el pack guardado en esta pestaña.')
      setNoticeError(true)
    } finally {
      setPackRestored(true)
    }
  }, [error, loading, packRestored, wallpapers])

  useEffect(() => {
    if (!packRestored) return
    try {
      sessionStorage.setItem('fondoselect:selected', JSON.stringify(selected.map(item => item.id)))
    } catch (storageError) {
      console.error('Unable to save the selected pack', storageError)
      setNotice('No se pudo guardar el pack en esta pestaña.')
      setNoticeError(true)
    }
  }, [packRestored, selected])

  const withDimensions = (wallpaper: Wallpaper) => ({
    ...wallpaper,
    ...dimensions[wallpaper.id],
  })

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(wallpapers.map(wallpaper =>
      categoryLabels[normalized(wallpaper.category)] ?? wallpaper.category.replace(/[-_]/g, ' '),
    ))).sort((a, b) => a.localeCompare(b))],
    [wallpapers],
  )

  const filtered = useMemo(() => {
    const needle = normalized(search.trim())
    return wallpapers.filter(wallpaper => {
      const text = normalized(`${wallpaper.title} ${wallpaper.category} ${wallpaper.path}`)
      const categoryName = categoryLabels[normalized(wallpaper.category)] ?? wallpaper.category.replace(/[-_]/g, ' ')
      const matchesCategory = category === 'Todos' || normalized(categoryName) === normalized(category)
      const matchesSearch = !needle || text.includes(needle)
      const matchesTag = !activeTag || (tagAliases[activeTag] ?? [activeTag]).some(tag => text.includes(normalized(tag)))
      const size = dimensions[wallpaper.id]
      const mobileHint = /mobile|phone|portrait|vertical|9x16|9-16/i.test(wallpaper.path)
      const desktopHint = /desktop|landscape|wide|16x9|16-9/i.test(wallpaper.path)
      const isMobile = size ? size.height > size.width : mobileHint
      const isDesktop = size ? size.width >= size.height : desktopHint || !mobileHint
      const matchesFormat = format === 'Todos' || (format === 'Móvil' ? isMobile : isDesktop)
      return matchesCategory && matchesSearch && matchesTag && matchesFormat
    }).sort((a, b) => {
      if (sort === 'popular') return (likes[b.id] ?? 0) - (likes[a.id] ?? 0) || a.title.localeCompare(b.title)
      if (sort === 'downloads') return (downloads[b.id] ?? 0) - (downloads[a.id] ?? 0) || a.title.localeCompare(b.title)
      return a.title.localeCompare(b.title)
    })
  }, [wallpapers, search, category, format, activeTag, sort, likes, downloads, dimensions])

  const toggleWallpaper = (wallpaper: Wallpaper) => {
    const alreadySelected = selected.some(item => item.id === wallpaper.id)
    if (!alreadySelected && !isPremium && selected.length >= 20) {
      setNotice('El plan gratuito permite hasta 20 imágenes por pack. Premium no tiene límite.')
      setNoticeError(true)
      return
    }
    setSelected(current => alreadySelected
      ? current.filter(item => item.id !== wallpaper.id)
      : [...current, wallpaper])
  }

  const customizePreset = (preset: Preset) => {
    const items = presetItems(preset, wallpapers)
    const selectedIds = new Set(selected.map(item => item.id))
    const additions = items.filter(item => !selectedIds.has(item.id))
    const availableSlots = isPremium ? additions.length : Math.max(0, 20 - selected.length)
    setSelected(current => {
      const ids = new Set(current.map(item => item.id))
      const newItems = additions.filter(item => !ids.has(item.id))
      return [...current, ...newItems.slice(0, availableSlots)]
    })
    if (!isPremium && additions.length > availableSlots) {
      setNotice('El plan gratuito permite hasta 20 imágenes por pack. Algunas imágenes no se añadieron.')
      setNoticeError(true)
    }
    setPackName(`Colección ${preset.name}`)
    setBuilderOpen(true)
  }

  const executeDownload = async (
    kind: 'image' | 'pack',
    items: Wallpaper[],
    name: string,
    claimId: string,
    selectedResolution: WallpaperResolution = 'original',
  ) => {
    if (!supabase || !user) {
      if (supabase) {
        const { error: releaseError } = await supabase.rpc('finish_download', {
          p_claim_id: claimId,
          p_success: false,
        })
        if (releaseError) console.error('Failed to release download claim', releaseError)
      }
      setNotice('Inicia sesión para descargar.')
      setNoticeError(true)
      setAuthOpen(true)
      return
    }

    let downloaded = false
    try {
      if (kind === 'pack') {
        setProgress({ percent: 0, message: 'Preparando tu pack…' })
        await downloadPack(items, name, (percent, message) => setProgress({ percent, message }))
      } else {
        await downloadWallpaper(items[0], selectedResolution)
      }
      downloaded = true
      const { error: finishError } = await supabase.rpc('finish_download', {
        p_claim_id: claimId,
        p_success: true,
      })
      if (finishError) throw new Error(`La descarga se completó, pero no se pudo registrar: ${finishError.message}`)
      setDownloads(current => {
        const next = { ...current }
        items.forEach(item => { next[item.id] = (next[item.id] ?? 0) + 1 })
        return next
      })
      setNotice(kind === 'pack'
        ? 'Tu ZIP está listo. La descarga comenzó.'
        : selectedResolution === 'original'
          ? 'Descarga iniciada en su resolución original.'
          : 'Descarga preparada sin ampliar la imagen original.')
      setNoticeError(false)
    } catch (downloadError) {
      let message = downloadError instanceof Error ? downloadError.message : 'No se pudo completar la descarga.'
      if (!downloaded) {
        try {
          const { error: releaseError } = await supabase.rpc('finish_download', {
            p_claim_id: claimId,
            p_success: false,
          })
          if (releaseError) throw releaseError
        } catch (releaseError) {
          console.error('Failed to release download claim', releaseError)
          message += ' No se pudo liberar la reserva; contacta con soporte si el límite queda bloqueado.'
        }
      }
      setNotice(message)
      setNoticeError(true)
    } finally {
      if (kind === 'pack') window.setTimeout(() => setProgress(null), 1200)
    }
  }

  const requestDownload = (
    kind: 'image' | 'pack',
    items: Wallpaper[],
    name: string,
    selectedResolution: WallpaperResolution = 'original',
  ) => {
    if (!supabase) {
      setNotice('El inicio de sesión aún no está configurado. Inténtalo más tarde.')
      setNoticeError(true)
      return
    }
    if (!user) {
      setAuthOpen(true)
      return
    }
    if (kind === 'pack' && !items.length) {
      setNotice('Añade al menos un fondo.')
      setNoticeError(true)
      return
    }
    if (claimRequestInProgress.current) return
    claimRequestInProgress.current = true
    void (async () => {
      try {
        const { data: claim, error: claimError } = await supabase.rpc('claim_download', {
          p_kind: kind,
          p_image_count: items.length,
        })
        if (claimError) {
          const message = claimError.message.includes('daily_pack_limit_reached')
            ? 'Alcanzaste el límite gratuito de 2 packs al día. Vuelve mañana o pásate a Premium.'
            : claimError.message.includes('free_pack_image_limit')
              ? 'El plan gratuito permite hasta 20 imágenes por pack. Premium no tiene límite.'
              : claimError.message
          setNotice(message)
          setNoticeError(true)
          return
        }

        if (!claim || typeof claim.claim_id !== 'string' || typeof claim.is_premium !== 'boolean') {
          throw new Error('El servidor devolvió una reserva de descarga inválida.')
        }
        if (!claim.is_premium) {
          setPendingDownload({ kind, items, name, resolution: selectedResolution, claimId: claim.claim_id })
          setDownloadGateOpen(true)
          return
        }
        void executeDownload(kind, items, name, claim.claim_id, selectedResolution)
      } catch (requestError) {
        setNotice(requestError instanceof Error ? requestError.message : 'No se pudo autorizar la descarga.')
        setNoticeError(true)
      } finally {
        claimRequestInProgress.current = false
      }
    })()
  }

  const continueDownload = () => {
    if (!pendingDownload) return
    setDownloadGateOpen(false)
    void executeDownload(
      pendingDownload.kind,
      pendingDownload.items,
      pendingDownload.name,
      pendingDownload.claimId,
      pendingDownload.resolution,
    )
    setPendingDownload(null)
  }

  const cancelDownload = () => {
    const claimId = pendingDownload?.claimId
    setDownloadGateOpen(false)
    setPendingDownload(null)
    if (claimId && supabase) {
      void Promise.resolve(supabase.rpc('finish_download', { p_claim_id: claimId, p_success: false }).then(({ error: releaseError }) => {
        if (releaseError) throw releaseError
      })).catch(releaseError => {
          setNotice(`No se pudo liberar la reserva de descarga: ${releaseError instanceof Error ? releaseError.message : 'Error desconocido.'}`)
          setNoticeError(true)
      })
    }
  }

  const startDownload = (items: Wallpaper[], name: string) => {
    requestDownload('pack', items, name)
  }

  const downloadSingle = async (wallpaper: Wallpaper, selectedResolution: WallpaperResolution = 'original') => {
    requestDownload('image', [wallpaper], wallpaper.title, selectedResolution)
  }

  const premiumAction = async () => {
    if (!supabase) {
      setNotice('Premium aún no está configurado. Inténtalo más tarde.')
      setNoticeError(true)
      return
    }
    if (!user) {
      setAuthOpen(true)
      return
    }
    const functionName = isPremium ? 'create-customer-portal' : 'create-checkout-session'
    try {
      const { data, error: billingError } = await supabase.functions.invoke(functionName)
      if (billingError) throw billingError
      if (typeof data?.url !== 'string') {
        throw new Error('La respuesta de facturación no incluyó un enlace válido.')
      }
      window.location.assign(data.url)
    } catch (billingError) {
      setNotice(`No se pudo abrir la gestión de Premium: ${billingError instanceof Error ? billingError.message : 'Error desconocido.'}`)
      setNoticeError(true)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setNotice(`No se pudo cerrar sesión: ${signOutError.message}`)
      setNoticeError(true)
    }
  }

  const moveItem = (index: number, direction: number) => {
    setSelected(current => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const featured = wallpapers[0] ? withDimensions(wallpapers[0]) : undefined

  return (
    <main className={theme === 'dark' ? 'app theme-dark' : 'app theme-light'}>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="FondoSelect, inicio">FondoSelect<span>4K</span></a>
        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'} aria-label="Navegación principal">
          <a href="#explorar" onClick={() => setMobileMenu(false)}>Explorar fondos</a>
          <a href="#prepacks" onClick={() => setMobileMenu(false)}>Pre-packs</a>
          <a href="#creador" onClick={() => { setBuilderOpen(true); setMobileMenu(false) }}>Creador de packs</a>
        </nav>
        <div className="top-actions">
          <button className="icon-button theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="account-top-button" onClick={user ? signOut : () => setAuthOpen(true)} title={user?.email}>
            {user ? 'Salir' : 'Entrar'}
          </button>
          <button className="premium-top-button" onClick={() => void premiumAction()}>
            {isPremium ? 'Gestionar Premium' : 'Premium · $2.50/mes'}
          </button>
          <button className="pack-button" onClick={() => setBuilderOpen(true)}><Package size={16} /> Mi pack <span>{selected.length}</span></button>
          <button className="icon-button menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir navegación">{mobileMenu ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </header>

      <section className="hero section-shell" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> UNA COLECCIÓN PARA CADA PANTALLA</p>
          <h1>Fondos extraordinarios.<br /><span>A tu manera.</span></h1>
          <p className="hero-description">Descubre fondos en alta resolución y arma un pack personalizado para llevar tus favoritos contigo.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#explorar">Armar mi pack <ArrowUpDown size={16} /></a>
            <a className="button-secondary" href="#prepacks">Explorar pre-packs <ChevronRight size={16} /></a>
          </div>
          <p className="source-note"><span className="status-dot" /> Imágenes remotas de <a href="https://github.com/dharmx/walls" target="_blank" rel="noreferrer">dharmx/walls</a></p>
        </div>
        <div className="hero-visual">
          {featured ? (
            <div className={`featured-frame ${device === 'mobile' ? 'featured-mobile' : ''}`}>
              <img
                src={featured.url}
                alt={featured.title}
                onLoad={event => {
                  const { naturalWidth, naturalHeight } = event.currentTarget
                  setDimensions(current => ({
                    ...current,
                    [featured.id]: { width: naturalWidth, height: naturalHeight },
                  }))
                }}
              />
              <div className="feature-overlay">
                <div><span className="feature-kicker">SELECCIÓN DE LA COLECCIÓN</span><strong>{featured.title}</strong><span>{featured.category} <i>·</i> {formatSize(featured.size)}</span></div>
                <button className="feature-add" onClick={() => toggleWallpaper(featured)} aria-label="Añadir fondo destacado al pack">{selected.some(item => item.id === featured.id) ? <Check size={18} /> : <span>+</span>}</button>
              </div>
            </div>
          ) : <div className="featured-placeholder"><Image size={36} /><span>Preparando la galería</span></div>}
          <div className="device-switch" aria-label="Vista de la maqueta">
            <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Laptop size={15} /> Desktop</button>
            <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={15} /> Móvil</button>
          </div>
        </div>
      </section>

      <section className="metrics section-shell" aria-label="Características">
        <div><span className="metric-index">01</span><strong>Alta resolución</strong><small>El archivo original, sin alterar</small></div>
        <div><span className="metric-index">02</span><strong>Fuente abierta</strong><small>Catálogo desde GitHub</small></div>
        <div><span className="metric-index">03</span><strong>Pack .ZIP</strong><small>Tus imágenes, juntas en un archivo</small></div>
        <div><span className="metric-index">04</span><strong>Multi-dispositivo</strong><small>Explora escritorio y móvil</small></div>
      </section>

      <section className="prepacks section-shell" id="prepacks">
        <div className="section-heading">
          <div><p className="eyebrow">SELECCIONES CURADAS</p><h2>Un buen lugar para empezar.</h2></div>
          <p className="section-aside">Elige una colección y ajústala a tu gusto.<br />Cada pack se arma con fondos del catálogo.</p>
        </div>
        <div className="preset-grid">
          {presets.map((preset, index) => {
            const items = presetItems(preset, wallpapers)
            return (
              <article className="preset-card" key={preset.name}>
                <button className="preset-cover" onClick={() => customizePreset(preset)} aria-label={`Personalizar ${preset.name}`}>
                  <div className={`preset-collage collage-${index}`}>
                    {items.slice(0, 3).map((item, imageIndex) => <img key={item.id} src={item.url} alt="" style={{ zIndex: 3 - imageIndex }} loading="lazy" />)}
                  </div>
                  <span className="preset-count">{items.length} fondos</span>
                </button>
                <div className="preset-info"><div><h3>{preset.name}</h3><p>{preset.description}</p><div className="preset-swatches">{preset.colors.map(color => <span key={color} style={{ backgroundColor: color }} />)}</div></div><div className="preset-actions">
                  <button className="text-button" onClick={() => customizePreset(preset)}>Personalizar <ChevronRight size={14} /></button>
                  <button className="icon-button small-icon" onClick={() => startDownload(items, preset.name)} disabled={!items.length} aria-label={`Descargar ${preset.name}`}><Download size={15} /></button>
                </div></div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="explore section-shell" id="explorar">
        <div className="section-heading explore-heading">
          <div><p className="eyebrow">BIBLIOTECA ABIERTA</p><h2>Encuentra tu próximo fondo.</h2></div>
          <div className="catalog-count">{filtered.length.toLocaleString()} <span>fondos en la selección</span></div>
        </div>
        <div className="filter-toolbar">
          <label className="search-field"><Search size={17} /><input value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(48) }} placeholder="Buscar por nombre, estilo o categoría" /><kbd>⌘ K</kbd></label>
          <label className="select-wrap"><span>Formato</span><select value={format} onChange={event => setFormat(event.target.value)}><option>Todos</option><option>Desktop</option><option>Móvil</option></select><ChevronDown size={14} /></label>
          <label className="select-wrap"><span>Ordenar</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Más populares</option><option value="newest">Nombre (A–Z)</option><option value="downloads">Más descargados</option></select><ChevronDown size={14} /></label>
        </div>
        <div className="category-list">
          {categories.map(item => <button key={item} className={category === item ? 'category-chip active' : 'category-chip'} onClick={() => { setCategory(item); setVisibleCount(48) }}>{item}</button>)}
        </div>
        <div className="tag-row"><span>Explora por estilo</span>{quickTags.map(tag => <button key={tag} className={activeTag === tag ? 'tag-chip active' : 'tag-chip'} onClick={() => { setActiveTag(activeTag === tag ? '' : tag); setSearch('') }}>#{tag}</button>)}</div>
        <p className="session-note">Los favoritos y las descargas se cuentan solo durante esta visita.</p>

        {loading && <div className="loading-state"><span className="loader" />Conectando con el catálogo de dharmx/walls…</div>}
        {error && <div className="error-state"><strong>No pudimos cargar los fondos.</strong><span>{error}</span><button onClick={() => window.location.reload()}>Intentar de nuevo</button></div>}
        {!loading && !error && !filtered.length && <div className="empty-state"><Search size={24} /><strong>No encontramos fondos con esos filtros.</strong><span>Prueba otra palabra o categoría.</span><button onClick={() => { setSearch(''); setCategory('Todos'); setActiveTag(''); setFormat('Todos') }}>Limpiar filtros</button></div>}
        <div className="wallpaper-grid">
          {filtered.slice(0, visibleCount).map(wallpaper => (
            <WallpaperCard
              key={wallpaper.id}
              wallpaper={withDimensions(wallpaper)}
              selected={selected.some(item => item.id === wallpaper.id)}
              likes={likes[wallpaper.id] ?? 0}
              downloads={downloads[wallpaper.id] ?? 0}
              onToggle={() => toggleWallpaper(wallpaper)}
              onLike={() => setLikes(current => ({ ...current, [wallpaper.id]: current[wallpaper.id] ? 0 : 1 }))}
              onInspect={() => { setDetail(withDimensions(wallpaper)); setDetailMode('original'); setResolution('original') }}
              onDownload={() => downloadSingle(wallpaper)}
              onImageLoad={(width, height) => setDimensions(current => current[wallpaper.id]?.width === width && current[wallpaper.id]?.height === height
                ? current
                : { ...current, [wallpaper.id]: { width, height } })}
            />
          ))}
        </div>
        {!loading && filtered.length > visibleCount && <button className="load-more" onClick={() => setVisibleCount(count => count + 48)}>Mostrar más fondos <ArrowDownWideNarrow size={16} /></button>}
      </section>

      <footer className="footer section-shell"><a className="brand" href="#inicio">FondoSelect<span>4K</span></a><p>Una mejor forma de encontrar y llevar tus fondos favoritos.</p><span>Imágenes servidas directamente desde GitHub · <a href="https://github.com/dharmx/walls" target="_blank" rel="noreferrer">dharmx/walls</a></span></footer>

      {selected.length > 0 && !builderOpen && <aside className="pack-drawer">
        <div className="drawer-thumbs">{selected.slice(0, 4).map(item => <img key={item.id} src={item.url} alt="" />)}{selected.length > 4 && <span>+{selected.length - 4}</span>}</div>
        <div className="drawer-copy"><strong>Tu pack está tomando forma</strong><span>{selected.length} {selected.length === 1 ? 'fondo' : 'fondos'} seleccionados</span></div>
        <button className="drawer-open" onClick={() => setBuilderOpen(true)}>Abrir pack <ChevronRight size={16} /></button>
        <button className="icon-button drawer-download" onClick={() => startDownload(selected, packName)} aria-label="Descargar pack"><Download size={17} /></button>
      </aside>}

      {builderOpen && <PackBuilder items={selected} name={packName} busy={progress !== null} maxItems={isPremium ? null : 20} onName={setPackName} onRemove={id => setSelected(current => current.filter(item => item.id !== id))} onMove={moveItem} onClose={() => setBuilderOpen(false)} onDownload={() => startDownload(selected, packName)} />}

      {detail && <WallpaperDetail
        wallpaper={detail}
        mode={detailMode}
        copied={copied}
        inPack={selected.some(item => item.id === detail.id)}
        resolution={resolution}
        onResolution={setResolution}
        onMode={setDetailMode}
        onClose={() => { setDetail(null); setCopied('') }}
        onCopy={async color => {
          try {
            await navigator.clipboard.writeText(color)
            setCopied(color)
            window.setTimeout(() => setCopied(''), 1500)
          } catch {
            setNotice('No se pudo copiar el color. Revisa los permisos del navegador.')
            setNoticeError(true)
          }
        }}
        onTag={tag => { setActiveTag(tag); setDetail(null); document.getElementById('explorar')?.scrollIntoView({ behavior: 'smooth' }) }}
        onToggle={() => toggleWallpaper(detail)}
        onDownload={() => downloadSingle(detail, resolution)}
      />}

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
      {downloadGateOpen && <DownloadGate
        onContinue={continueDownload}
        onClose={cancelDownload}
      />}

      {progress && <div className="progress-toast" role="status"><div className="progress-head"><span>{progress.message}</span><strong>{progress.percent}%</strong></div><div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div></div>}
      {notice && <div className={noticeError ? 'notice-toast is-error' : 'notice-toast'} role={noticeError ? 'alert' : 'status'}>{noticeError ? <CircleAlert size={16} /> : <Check size={16} />}{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}
    </main>
  )
}

function WallpaperDetail({
  wallpaper, mode, copied, inPack, resolution, onResolution, onMode, onClose, onCopy, onTag, onToggle, onDownload,
}: {
  wallpaper: Wallpaper
  mode: 'original' | 'macbook' | 'iphone'
  copied: string
  inPack: boolean
  resolution: WallpaperResolution
  onResolution: (resolution: WallpaperResolution) => void
  onMode: (mode: 'original' | 'macbook' | 'iphone') => void
  onClose: () => void
  onCopy: (color: string) => void
  onTag: (tag: string) => void
  onToggle: () => void
  onDownload: () => void
}) {
  const [colors, setColors] = useState<string[]>([])
  const [paletteError, setPaletteError] = useState('')

  useEffect(() => {
    let active = true
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 4
        canvas.height = 1
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) throw new Error('El navegador no pudo leer los colores.')
        context.drawImage(image, 0, 0, 4, 1)
        const pixels = context.getImageData(0, 0, 4, 1).data
        const extracted = Array.from({ length: 4 }, (_, index) => {
          const offset = index * 4
          const hex = [pixels[offset], pixels[offset + 1], pixels[offset + 2]]
            .map(value => value.toString(16).padStart(2, '0')).join('')
          return `#${hex}`.toUpperCase()
        })
        if (active) {
          setColors(extracted)
          setPaletteError('')
        }
      } catch (error) {
        if (active) setPaletteError(error instanceof Error ? error.message : 'No se pudo extraer la paleta.')
      }
    }
    image.onerror = () => { if (active) setPaletteError('No se pudo leer la paleta de esta imagen remota.') }
    image.src = wallpaper.url
    return () => { active = false }
  }, [wallpaper.url])

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="detail-header"><a className="brand" href="#inicio">FondoSelect<span>4K</span></a><div className="detail-modes">
          <button className={mode === 'original' ? 'active' : ''} onClick={() => onMode('original')}><Image size={15} /> Original</button>
          <button className={mode === 'macbook' ? 'active' : ''} onClick={() => onMode('macbook')}><Laptop size={15} /> MacBook</button>
          <button className={mode === 'iphone' ? 'active' : ''} onClick={() => onMode('iphone')}><Smartphone size={15} /> iPhone</button>
        </div><button className="icon-button" onClick={onClose} aria-label="Cerrar inspector"><X size={19} /></button></header>
        <div className="detail-content">
          <div className={`detail-preview preview-${mode}`}>
            {mode === 'macbook' && <div className="laptop-top"><span>● ● ●</span><span>FondoSelect</span><span>Wi-Fi　100%</span></div>}
            {mode === 'iphone' && <div className="phone-island" />}
            <img src={wallpaper.url} alt={wallpaper.title} />
            {mode === 'iphone' && <div className="phone-clock">9:41</div>}
          </div>
          <aside className="detail-sidebar">
            <p className="eyebrow">DETALLE DEL FONDO</p><h1 id="detail-title">{wallpaper.title}</h1>
            <p className="detail-category">{wallpaper.category.replace(/[-_]/g, ' ')} <i>·</i> {formatSize(wallpaper.size)} <i>·</i> Resolución original</p>
            <div className="detail-section"><h3>Paleta cromática <span>HEX</span></h3>{paletteError ? <p className="palette-error">{paletteError}</p> : colors.length ? <div className="palette-list">{colors.map((color, index) => <button key={`${color}-${index}`} onClick={() => onCopy(color)} title={`Copiar ${color}`}><i style={{ backgroundColor: color }} />{copied === color ? '¡Copiado!' : color}<span>{copied === color ? <Check size={13} /> : <ChevronRight size={13} />}</span></button>)}</div> : <p className="palette-error">Extrayendo colores…</p>}</div>
            <div className="detail-section"><h3>Ficha técnica</h3><div className="spec-row"><span>Archivo</span><strong>{formatSize(wallpaper.size)}</strong></div><div className="spec-row"><span>Formato</span><strong>{wallpaper.path.split('.').pop()?.toUpperCase()}</strong></div><div className="spec-row"><span>Licencia</span><strong>Consulta la fuente original</strong></div></div>
            <div className="detail-section"><h3>Explora temas</h3><div className="detail-tags">{[wallpaper.category, ...wallpaper.title.split(/[\s_-]+/).slice(0, 3)].map(tag => <button key={tag} onClick={() => onTag(tag)}>#{tag.toLowerCase()}</button>)}</div></div>
            <label className="resolution-picker">Resolución de descarga<select value={resolution} onChange={event => onResolution(event.target.value as WallpaperResolution)}><option value="original">Original — máxima calidad</option><option value="4k">4K UHD — hasta 3840×2160</option><option value="2k">2K QHD — hasta 2560×1440</option><option value="fhd">Full HD — hasta 1920×1080</option><option value="mobile">Móvil — hasta 1440×2560</option></select></label>
            <p className="resolution-note">Las imágenes pequeñas no se amplían. Las versiones reducidas se generan en este dispositivo.</p>
            <div className="detail-actions"><button className="button-primary" onClick={onDownload}><Download size={16} /> Descargar {resolution === 'original' ? 'original' : resolution.toUpperCase()}</button><button className="button-secondary" onClick={onToggle}>{inPack ? <Check size={16} /> : <Package size={16} />}{inPack ? 'En mi pack' : 'Añadir al pack'}</button></div>
          </aside>
        </div>
      </section>
    </div>
  )
}
