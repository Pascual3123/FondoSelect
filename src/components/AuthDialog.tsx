import { useEffect, useRef, useState } from 'react'
import { Github } from 'lucide-react'
import { getSupabase, supabase } from '../lib/supabase'

const legalBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
const termsUrl = import.meta.env.VITE_TERMS_URL || new URL('terminos.html', legalBaseUrl).href
const privacyPolicyUrl = import.meta.env.VITE_PRIVACY_POLICY_URL || new URL('privacidad.html', legalBaseUrl).href
const legalLinksReady = [termsUrl, privacyPolicyUrl].every(value => {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  } catch {
    return false
  }
})

interface Props {
  onClose: () => void
}

type AuthMode = 'signin' | 'signup'

export default function AuthDialog({ onClose }: Props) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [busyProvider, setBusyProvider] = useState<'google' | 'github' | null>(null)
  const [oauthPending, setOauthPending] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' || !session || !popupRef.current) return
      popupRef.current.close()
      popupRef.current = null
      setOauthPending(false)
      onCloseRef.current()
    })
    const pollId = window.setInterval(() => {
      if (!popupRef.current?.closed) return
      popupRef.current = null
      setOauthPending(false)
      setMessage('Se cerró la ventana de autenticación antes de terminar.')
    }, 500)

    return () => {
      subscription.unsubscribe()
      window.clearInterval(pollId)
      popupRef.current?.close()
      popupRef.current = null
    }
  }, [])

  const signInWithProvider = async (provider: 'google' | 'github') => {
    const popup = window.open('', 'fondoselect-oauth', 'popup,width=500,height=650')
    if (!popup) {
      setError('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para continuar.')
      return
    }

    popupRef.current = popup
    setOauthPending(true)
    setBusy(true)
    setBusyProvider(provider)
    setError('')
    setMessage('Completa el acceso en la ventana que se abrió.')
    try {
      const { data, error: authError } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
          skipBrowserRedirect: true,
        },
      })
      if (authError) throw authError
      if (!data.url) throw new Error('Supabase no devolvió la dirección de autenticación.')
      popup.location.href = data.url
    } catch (authError) {
      popup.close()
      popupRef.current = null
      setOauthPending(false)
      const providerName = provider === 'google' ? 'Google' : 'GitHub'
      setError(authError instanceof Error ? authError.message : `No se pudo iniciar sesión con ${providerName}.`)
    } finally {
      setBusy(false)
      setBusyProvider(null)
    }
  }

  const sendMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { error: authError } = await getSupabase().auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'signup',
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        },
      })
      if (authError) throw authError
      setMessage(mode === 'signup'
        ? 'Te enviamos un enlace para confirmar tu cuenta. Revisa tu correo.'
        : 'Te enviamos un enlace seguro para iniciar sesión. Revisa tu correo.')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'No se pudo enviar el enlace.')
    } finally {
      setBusy(false)
    }
  }

  const changeMode = () => {
    setMode(current => current === 'signin' ? 'signup' : 'signin')
    setMessage('')
    setError('')
  }
  const canAuthenticate = legalLinksReady && acceptedTerms

  return (
    <div className="account-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-heading">
        <button className="account-close" onClick={onClose} aria-label="Cerrar">×</button>
        <p className="eyebrow">TU CUENTA FONDOSELECT</p>
        <h2 id="account-heading">{mode === 'signin' ? 'Inicia sesión.' : 'Crea tu cuenta.'}</h2>
        <p className="account-description">{mode === 'signin' ? 'Accede para guardar tus packs y gestionar tu plan premium.' : 'Regístrate para guardar tus packs y gestionar tu plan premium.'}</p>
        <button className="account-provider" onClick={() => void signInWithProvider('google')} disabled={busy || oauthPending || !canAuthenticate}>
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z" />
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z" />
            <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18z" />
            <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4z" />
          </svg>
          {busyProvider === 'google' ? 'Conectando…' : `${mode === 'signin' ? 'Continuar' : 'Registrarme'} con Google`}
        </button>
        <button className="account-provider" onClick={() => void signInWithProvider('github')} disabled={busy || oauthPending || !canAuthenticate}>
          <Github size={15} aria-hidden="true" />
          {busyProvider === 'github' ? 'Conectando…' : `${mode === 'signin' ? 'Continuar' : 'Registrarme'} con GitHub`}
        </button>
        <div className="account-divider"><span>o usa tu correo</span></div>
        <form onSubmit={sendMagicLink}>
          <label htmlFor="account-email">Correo electrónico</label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="tu@correo.com"
          />
          <button className="button-primary account-submit" disabled={busy || oauthPending || !canAuthenticate}>
            {busy ? 'Enviando…' : mode === 'signin' ? 'Enviar enlace de acceso' : 'Crear cuenta con correo'}
          </button>
        </form>
        <p className="account-switch">
          {mode === 'signin' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
          {' '}<button type="button" onClick={changeMode} disabled={busy || oauthPending}>
            {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
        {message && <p className="account-message" role="status">{message}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
        {legalLinksReady
          ? <label className="account-consent">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={event => setAcceptedTerms(event.target.checked)}
              />
              <span>Acepto los <a href={termsUrl} target="_blank" rel="noreferrer">términos</a> y la <a href={privacyPolicyUrl} target="_blank" rel="noreferrer">política de privacidad</a> de FondoSelect.</span>
            </label>
          : <p className="account-error" role="alert">El acceso no está habilitado hasta publicar los términos y la política de privacidad.</p>}
      </section>
    </div>
  )
}
