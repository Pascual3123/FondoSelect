import { useEffect, useRef, useState } from 'react'

interface Props {
  onContinue: () => void
  onClose: () => void
}

interface GoogleTag {
  cmd: Array<() => void>
  enums: { OutOfPageFormat: { REWARDED: string } }
  pubads: () => {
    addEventListener: (name: string, callback: (event: RewardedEvent) => void) => void
  }
  defineSlot: (path: string, sizes: number[][], elementId: string) => RewardedSlot | null
  defineOutOfPageSlot: (path: string, format: string) => RewardedSlot | null
  enableServices: () => void
  display: (slot: RewardedSlot | string) => void
  destroySlots: (slots: RewardedSlot[]) => void
}

interface RewardedSlot {
  addService: (service: ReturnType<GoogleTag['pubads']>) => RewardedSlot
}

interface RewardedEvent {
  slot: RewardedSlot
  makeRewardedVisible?: () => void
}

declare global {
  interface Window {
    googletag?: GoogleTag
  }
}

const rewardedSlotPath = import.meta.env.VITE_GAM_REWARDED_SLOT as string | undefined
const displaySlotPath = import.meta.env.VITE_GAM_DISPLAY_SLOT as string | undefined
const consentManagementReady = import.meta.env.VITE_GAM_CMP_READY === 'true'
let servicesEnabled = false

function loadGoogleTag() {
  window.googletag = window.googletag || {
    cmd: [],
    enums: { OutOfPageFormat: { REWARDED: 'rewarded' } },
    pubads: () => ({ addEventListener: () => undefined }),
    defineSlot: () => null,
    defineOutOfPageSlot: () => null,
    enableServices: () => undefined,
    display: () => undefined,
    destroySlots: () => undefined,
  }
  if (!document.querySelector('script[data-fondoselect-gpt]')) {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
    script.dataset.fondoselectGpt = 'true'
    document.head.appendChild(script)
  }
  return window.googletag
}

export default function DownloadGate({ onContinue, onClose }: Props) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [adReady, setAdReady] = useState(false)
  const [rewarded, setRewarded] = useState(false)
  const [requestingRewarded, setRequestingRewarded] = useState(false)
  const [error, setError] = useState('')
  const slotRef = useRef<RewardedSlot | null>(null)
  const rewardedRef = useRef(false)
  const adTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => {
      setMobile(query.matches)
      setError('')
      setAdReady(false)
    }
    query.addEventListener('change', update)
    return () => {
      query.removeEventListener('change', update)
      if (adTimeoutRef.current !== null) window.clearTimeout(adTimeoutRef.current)
      if (slotRef.current && window.googletag) {
        const googletag = window.googletag
        googletag.cmd.push(() => googletag.destroySlots([slotRef.current!]))
        slotRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mobile) return
    if (!consentManagementReady) {
      setError('El consentimiento de privacidad aún no está configurado.')
      return
    }
    if (!displaySlotPath) {
      setError('Los anuncios aún no están configurados.')
      return
    }
    const googletag = loadGoogleTag()
    const timeoutId = window.setTimeout(() => {
      setError('No se pudo cargar el anuncio. Inténtalo más tarde.')
    }, 15_000)
    googletag.cmd.push(() => {
      window.clearTimeout(timeoutId)
      const slot = googletag.defineSlot(displaySlotPath, [[300, 250], [336, 280]], 'fondoselect-download-ad')
      if (!slot) {
        setError('No se pudo preparar el espacio publicitario.')
        return
      }
      slotRef.current = slot.addService(googletag.pubads())
      if (!servicesEnabled) {
        googletag.enableServices()
        servicesEnabled = true
      }
      googletag.display('fondoselect-download-ad')
      setAdReady(true)
    })
    return () => {
      window.clearTimeout(timeoutId)
      if (slotRef.current) {
        googletag.cmd.push(() => googletag.destroySlots([slotRef.current!]))
        slotRef.current = null
      }
    }
  }, [mobile])

  const watchRewardedAd = () => {
    if (requestingRewarded || rewarded) return
    if (!consentManagementReady) {
      setError('El consentimiento de privacidad aún no está configurado.')
      return
    }
    if (!rewardedSlotPath) {
      setError('Los anuncios recompensados aún no están configurados.')
      return
    }
    setError('')
    setAdReady(false)
    setRequestingRewarded(true)
    const googletag = loadGoogleTag()
    adTimeoutRef.current = window.setTimeout(() => {
      setRequestingRewarded(false)
      setError('No hay anuncios disponibles ahora. Inténtalo más tarde.')
    }, 15_000)
    googletag.cmd.push(() => {
      const slot = googletag.defineOutOfPageSlot(
        rewardedSlotPath,
        googletag.enums.OutOfPageFormat.REWARDED,
      )
      if (!slot) {
        if (adTimeoutRef.current !== null) window.clearTimeout(adTimeoutRef.current)
        setRequestingRewarded(false)
        setError('Este navegador no admite anuncios recompensados. Prueba en un ordenador.')
        return
      }
      slotRef.current = slot.addService(googletag.pubads())
      googletag.pubads().addEventListener('rewardedSlotReady', event => {
        if (event.slot !== slotRef.current) return
        if (adTimeoutRef.current !== null) window.clearTimeout(adTimeoutRef.current)
        setAdReady(true)
        event.makeRewardedVisible?.()
      })
      googletag.pubads().addEventListener('rewardedSlotGranted', event => {
        if (event.slot === slotRef.current) {
          rewardedRef.current = true
          setRequestingRewarded(false)
          setRewarded(true)
        }
      })
      googletag.pubads().addEventListener('rewardedSlotClosed', event => {
        if (event.slot === slotRef.current && !rewardedRef.current) {
          if (adTimeoutRef.current !== null) window.clearTimeout(adTimeoutRef.current)
          setRequestingRewarded(false)
          setError('El anuncio se cerró antes de completarse.')
        }
      })
      if (!servicesEnabled) {
        googletag.enableServices()
        servicesEnabled = true
      }
      googletag.display(slot)
    })
  }

  const continueDownload = () => {
    if (!mobile || rewarded) onContinue()
  }

  return (
    <div className="account-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="account-dialog download-gate" role="dialog" aria-modal="true" aria-labelledby="download-heading">
        <button className="account-close" onClick={onClose} aria-label="Cerrar">×</button>
        <p className="eyebrow">DESCARGA CON FONDOSELECT</p>
        <h2 id="download-heading">{mobile ? 'Mira un anuncio para continuar.' : 'Un anuncio apoya a FondoSelect.'}</h2>
        <p className="account-description">
          {mobile
            ? 'El anuncio es opcional; al completarlo se iniciará tu descarga.'
            : 'Mostraremos un anuncio en esta ventana antes de iniciar la descarga.'}
        </p>
        {mobile
          ? <p className="account-message" role="status">{rewarded ? 'Anuncio completado. Ya puedes descargar.' : requestingRewarded ? 'Cargando o mostrando el anuncio…' : 'Pulsa “Ver anuncio” para continuar.'}</p>
          : <div id="fondoselect-download-ad" className="fondoselect-ad-slot" />}
        {error && <p className="account-error" role="alert">{error}</p>}
        <div className="account-actions">
          <button className="button-secondary" onClick={onClose}>Cancelar</button>
          {mobile && !rewarded
            ? <button className="button-primary" onClick={watchRewardedAd} disabled={!consentManagementReady || requestingRewarded}>
              {requestingRewarded ? 'Anuncio en curso…' : 'Ver anuncio'}
            </button>
            : <button className="button-primary" disabled={mobile ? !rewarded : !adReady} onClick={continueDownload}>
              {mobile ? 'Descargar' : 'Continuar'}
            </button>}
        </div>
      </section>
    </div>
  )
}
