# Configuración de cuentas, límites y Premium

FondoSelect sigue siendo una app estática de GitHub Pages; Supabase aplica la autenticación y los límites, y Stripe confirma Premium mediante webhooks. No publiques claves secretas ni las añadas a variables `VITE_*`.

## 1. Supabase

1. Crea un proyecto Supabase y ejecuta en el SQL Editor, en orden, `supabase/migrations/20261106120000_download_plans.sql` y `supabase/migrations/20261106130000_user_profiles.sql`. Supabase Auth guarda las cuentas; la tabla `profiles` conserva el nombre y avatar de cada proveedor social, con acceso restringido al propio usuario.
2. En **Authentication → Settings**, permite que nuevos usuarios se registren. En **Authentication → Providers**, habilita Google, GitHub y correo electrónico (OTP/enlace de acceso). La pantalla de cuenta ofrece inicio de sesión y registro por separado; en ambos exige aceptar los términos y la política de privacidad. El registro por correo envía un enlace de confirmación y los proveedores sociales también pueden crear cuentas.
3. En **Authentication → URL Configuration**, configura como URL del sitio `https://pascual3123.github.io/FondoSelect/` y añade esa dirección a las URL permitidas de redirección. Para probar en Codespaces, añade también `https://*.app.github.dev/**`.
4. En Google Cloud crea un cliente OAuth Web. Como URI de redirección autorizada usa `https://<PROJECT_REF>.supabase.co/auth/v1/callback`, y copia el ID y secreto en la configuración del proveedor Google de Supabase.
5. En GitHub crea un OAuth App. Configura su **Authorization callback URL** con `https://<PROJECT_REF>.supabase.co/auth/v1/callback` y copia el Client ID y Client Secret en la configuración del proveedor GitHub de Supabase.
6. Cambia `project_id` en `supabase/config.toml` por el ref de tu proyecto, instala Supabase CLI, ejecuta `supabase link --project-ref <PROJECT_REF>` y despliega las funciones `create-checkout-session`, `create-customer-portal` y `stripe-webhook`. La función del webhook debe desplegarse sin verificación JWT (`--no-verify-jwt`); Stripe valida su firma.
7. Las páginas estáticas de términos y privacidad se publican desde `public/terminos.html` y `public/privacidad.html`; las URL predeterminadas en la app las usan automáticamente. Revisa que su contenido siga siendo correcto antes de habilitar el registro. Si configuras `VITE_TERMS_URL` o `VITE_PRIVACY_POLICY_URL`, esos valores reemplazan las páginas predeterminadas.

## 2. Stripe

1. Crea un precio recurrente de **2,50 USD cada mes** y copia el ID `price_...`.
2. Activa el portal de clientes para permitir cancelar y administrar la suscripción.
3. Añade un endpoint webhook `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook` con los eventos `customer.subscription.created`, `customer.subscription.updated` y `customer.subscription.deleted`.
4. En **Supabase → Edge Functions → Secrets**, configura `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` y `SITE_URL=https://pascual3123.github.io/FondoSelect/`. No guardes esos valores en el repositorio ni en el frontend.

## 3. Anuncios

1. Crea una cuenta Google Ad Manager, solicita/activa inventario de anuncios e integra una CMP certificada y el consentimiento de privacidad conforme a las políticas aplicables a tu audiencia antes de habilitar los anuncios.
2. Crea una unidad recompensada para móvil y una unidad de display para escritorio. En la app, el usuario debe aceptar ver el anuncio recompensado; en escritorio el anuncio es no bloqueante.
3. En las **variables del repositorio** de GitHub, configura `VITE_GAM_REWARDED_SLOT` y `VITE_GAM_DISPLAY_SLOT` con las rutas de las unidades de Ad Manager, no con secretos.

## 4. GitHub Pages

En **Settings → Secrets and variables → Actions → Variables**, configura:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (clave publicable/anon de Supabase)
- `VITE_GAM_REWARDED_SLOT`
- `VITE_GAM_DISPLAY_SLOT`
- `VITE_GAM_CMP_READY=true` only after a certified CMP is integrated and tested.
- `VITE_TERMS_URL` and `VITE_PRIVACY_POLICY_URL` only if you want to override the built-in pages.

Al ejecutar el workflow de Pages se compilará la app con esos valores. La clave service-role y las claves de Stripe son solo secretos del backend Supabase.

## Alcance de los controles

Los RPC de Supabase aplican el máximo de dos exportaciones de pack por día UTC y 20 imágenes por pack gratuito; las suscripciones activas no tienen esos límites ni el anuncio de la interfaz. Cada acción de descarga desde FondoSelect requiere una sesión. El evento de recompensa de GPT se recibe en el navegador; no es una prueba firmada para el backend y puede omitirse por alguien que manipule las llamadas del cliente. Los archivos fuente actuales, además, viven en un repositorio público externo: cualquiera puede acceder a sus URL originales fuera de FondoSelect. Para controles antifraude estrictos habría que usar un proveedor de recompensa con verificación servidor-a-servidor y alojar los archivos detrás de un servicio privado, con costes de almacenamiento y distribución, y confirmar primero los derechos de uso comercial de cada imagen.
