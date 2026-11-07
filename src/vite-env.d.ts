/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_GAM_REWARDED_SLOT?: string
  readonly VITE_GAM_DISPLAY_SLOT?: string
  readonly VITE_GAM_CMP_READY?: string
  readonly VITE_TERMS_URL?: string
  readonly VITE_PRIVACY_POLICY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
