import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Camera,
  CircleUserRound,
  Crown,
  Download,
  LogOut,
  Package,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Props {
  user: User
  isPremium: boolean
  onClose: () => void
  onDeleted: (message?: string) => void
}

interface Profile {
  username: string | null
  avatar_url: string | null
}

interface Entitlement {
  plan: string
  status: string
  current_period_end: string | null
  stripe_customer_id: string | null
}

interface DownloadRecord {
  id: string
  pack_name: string
  image_count: number
  downloaded_at: string
}

const pageSize = 25
const subscriptionStatusLabels: Record<string, string> = {
  active: 'activa',
  trialing: 'en periodo de prueba',
  canceled: 'cancelada',
  past_due: 'pago pendiente',
  incomplete: 'pendiente',
  incomplete_expired: 'expirada',
  unpaid: 'impagada',
  paused: 'pausada',
  inactive: 'inactivo',
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido.'
}

export default function AccountPanel({ user, isPremium, onClose, onDeleted }: Props) {
  const [profile, setProfile] = useState<Profile>({ username: null, avatar_url: null })
  const [username, setUsername] = useState('')
  const [plan, setPlan] = useState<Entitlement | null>(null)
  const [history, setHistory] = useState<DownloadRecord[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    const loadAccount = async () => {
      setLoading(true)
      setError('')
      try {
        const [profileResult, entitlementResult, historyResult] = await Promise.all([
          client.from('profiles').select('username,avatar_url').eq('user_id', user.id).single(),
          client.from('user_entitlements')
            .select('plan,status,current_period_end,stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle(),
          client.from('download_history')
            .select('id,pack_name,image_count,downloaded_at')
            .eq('user_id', user.id)
            .order('downloaded_at', { ascending: false })
            .range(0, pageSize - 1),
        ])
        if (profileResult.error) throw profileResult.error
        if (entitlementResult.error) throw entitlementResult.error
        if (historyResult.error) throw historyResult.error
        if (!active) return
        setProfile(profileResult.data)
        setUsername(profileResult.data.username ?? '')
        setPlan(entitlementResult.data)
        setHistory(historyResult.data)
        setHasMore(historyResult.data.length === pageSize)
      } catch (loadError) {
        if (active) setError(`No se pudo cargar tu cuenta: ${errorMessage(loadError)}`)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadAccount()
    return () => { active = false }
  }, [user.id])

  const saveUsername = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    const normalizedUsername = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setError('El username debe tener entre 3 y 24 caracteres: letras, números o guion bajo.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { error: saveError } = await supabase.from('profiles')
        .update({ username: normalizedUsername, display_name: normalizedUsername })
        .eq('user_id', user.id)
      if (saveError) throw saveError
      setUsername(normalizedUsername)
      setProfile(current => ({ ...current, username: normalizedUsername }))
      setMessage('Username actualizado.')
    } catch (saveError) {
      setError(`No se pudo guardar el username: ${errorMessage(saveError)}`)
    } finally {
      setBusy(false)
    }
  }

  const uploadAvatar = async (file?: File) => {
    if (!supabase || !file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Usa una imagen JPG, PNG o WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen debe pesar 2 MB o menos.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const path = `${user.id}/avatar`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      })
      if (uploadError) throw uploadError
      const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      const avatarUrl = `${publicUrl}?v=${Date.now()}`
      const { error: profileError } = await supabase.from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id)
      if (profileError) throw profileError
      setProfile(current => ({ ...current, avatar_url: avatarUrl }))
      setMessage('Foto de perfil actualizada.')
    } catch (uploadError) {
      setError(`No se pudo actualizar la foto: ${errorMessage(uploadError)}`)
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const loadMore = async () => {
    if (!supabase || busy) return
    setBusy(true)
    setError('')
    try {
      const { data, error: historyError } = await supabase.from('download_history')
        .select('id,pack_name,image_count,downloaded_at')
        .eq('user_id', user.id)
        .order('downloaded_at', { ascending: false })
        .range(history.length, history.length + pageSize - 1)
      if (historyError) throw historyError
      setHistory(current => [...current, ...data])
      setHasMore(data.length === pageSize)
    } catch (historyError) {
      setError(`No se pudo cargar el historial: ${errorMessage(historyError)}`)
    } finally {
      setBusy(false)
    }
  }

  const openBillingPortal = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const { data, error: portalError } = await supabase.functions.invoke('create-customer-portal')
      if (portalError) throw portalError
      if (typeof data?.url !== 'string') throw new Error('No se recibió un enlace de facturación válido.')
      window.location.assign(data.url)
    } catch (portalError) {
      setError(`No se pudo abrir la gestión de la suscripción: ${errorMessage(portalError)}`)
      setBusy(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(`No se pudo cerrar sesión: ${signOutError.message}`)
      setBusy(false)
    }
  }

  const deleteAccount = async () => {
    if (!supabase || deleteConfirmation !== 'ELIMINAR') return
    setBusy(true)
    setError('')
    try {
      const { data, error: deletionError } = await supabase.functions.invoke('delete-account')
      if (deletionError) throw deletionError
      if (data?.deleted !== true) throw new Error('El servidor no confirmó la eliminación.')
      const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' })
      onDeleted(localSignOutError
        ? 'La cuenta se eliminó, pero no se pudo cerrar la sesión local. Cierra la sesión manualmente.'
        : undefined)
    } catch (deletionError) {
      setError(`No se pudo eliminar la cuenta: ${errorMessage(deletionError)}`)
      setBusy(false)
    }
  }

  const premium = isPremium || (
    plan?.plan === 'premium'
    && ['active', 'trialing'].includes(plan.status)
    && (!plan.current_period_end || new Date(plan.current_period_end).getTime() > Date.now())
  )
  const currentPeriodEnd = plan?.current_period_end
    ? new Date(plan.current_period_end).toLocaleDateString('es-ES', { dateStyle: 'long' })
    : null
  const avatar = profile.avatar_url

  return (
    <div className="account-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="account-dialog account-panel" role="dialog" aria-modal="true" aria-labelledby="account-panel-heading">
        <button className="account-close" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        <p className="eyebrow">TU CUENTA FONDOSELECT</p>
        <h2 id="account-panel-heading">Mi cuenta.</h2>
        {loading ? <p className="account-description">Cargando los datos de tu cuenta…</p> : <>
          <div className="profile-summary">
            <div className="profile-avatar">
              {avatar ? <img src={avatar} alt="Foto de perfil" /> : <CircleUserRound size={30} />}
              <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} aria-label="Cambiar foto de perfil">
                <Camera size={13} />
              </button>
            </div>
            <div className="profile-identity">
              <strong>{profile.username ? `@${profile.username}` : 'Configura tu username'}</strong>
              <span>{user.email}</span>
            </div>
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event => void uploadAvatar(event.target.files?.[0])}
              aria-label="Seleccionar foto de perfil"
            />
          </div>

          <form className="profile-form" onSubmit={event => void saveUsername(event)}>
            <label htmlFor="account-username">Username</label>
            <div className="profile-form-row">
              <input
                id="account-username"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="tu_username"
                minLength={3}
                maxLength={24}
                autoComplete="username"
                required
              />
              <button className="button-primary" type="submit" disabled={busy}>Guardar</button>
            </div>
            <small>3–24 caracteres: letras, números y guion bajo.</small>
          </form>

          <div className="account-section">
            <div className="account-section-heading"><Crown size={16} /><h3>Tu plan</h3></div>
            <div className="plan-summary">
              <div><strong>{premium ? 'Premium' : 'Gratis'}</strong><span>{plan?.status ? `Estado: ${subscriptionStatusLabels[plan.status] ?? plan.status}` : 'Plan personal'}</span></div>
              {currentPeriodEnd && <span className="plan-renewal"><CalendarDays size={13} /> Hasta {currentPeriodEnd}</span>}
            </div>
            {plan?.stripe_customer_id && <button className="button-secondary account-wide-button" onClick={() => void openBillingPortal()} disabled={busy}>
              Gestionar o cancelar suscripción
            </button>}
          </div>

          <div className="account-section">
            <div className="account-section-heading"><Package size={16} /><h3>Paquetes descargados</h3></div>
            {!history.length
              ? <p className="account-description history-empty">Todavía no tienes paquetes descargados.</p>
              : <ul className="download-history">
                  {history.map(record => <li key={record.id}>
                    <span className="history-icon"><Download size={14} /></span>
                    <span className="history-name"><strong>{record.pack_name}</strong><small>{record.image_count} {record.image_count === 1 ? 'fondo' : 'fondos'}</small></span>
                    <time dateTime={record.downloaded_at}>{new Date(record.downloaded_at).toLocaleDateString('es-ES')}</time>
                  </li>)}
                </ul>}
            {hasMore && <button className="history-more" onClick={() => void loadMore()} disabled={busy}>Ver más paquetes</button>}
          </div>

          <div className="account-section account-danger-section">
            <div className="account-section-heading"><ShieldCheck size={15} aria-hidden="true" /><h3>Sesión y cuenta</h3></div>
            <button className="button-secondary account-wide-button" onClick={() => void signOut()} disabled={busy}>
              <LogOut size={14} /> Cerrar sesión
            </button>
            <div className="delete-account">
              <div><Trash2 size={14} /><strong>Eliminar cuenta</strong></div>
              <p>Se cancelarán las suscripciones activas y se borrarán tu perfil y tu historial. Esta acción es permanente.</p>
              <label htmlFor="delete-account-confirmation">Escribe ELIMINAR para confirmar</label>
              <input
                id="delete-account-confirmation"
                value={deleteConfirmation}
                onChange={event => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
                disabled={busy}
              />
              <button className="delete-account-button" onClick={() => void deleteAccount()} disabled={busy || deleteConfirmation !== 'ELIMINAR'}>
                <Trash2 size={14} /> Eliminar permanentemente
              </button>
            </div>
          </div>
        </>}
        {message && <p className="account-message" role="status">{message}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
      </section>
    </div>
  )
}
