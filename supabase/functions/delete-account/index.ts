import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Account deletion is not configured.')

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: entitlement, error: entitlementError } = await admin
      .from('user_entitlements')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (entitlementError) throw entitlementError

    if (entitlement?.stripe_customer_id) {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
      if (!stripeKey) throw new Error('Stripe is not configured; the account was not deleted.')

      const stripe = new Stripe(stripeKey)
      const subscriptions = await stripe.subscriptions.list({
        customer: entitlement.stripe_customer_id,
        status: 'all',
        limit: 100,
      })
      for (const subscription of subscriptions.data) {
        if (!['canceled', 'incomplete_expired'].includes(subscription.status)) {
          await stripe.subscriptions.cancel(subscription.id)
        }
      }
    }

    const { error: avatarError } = await admin.storage
      .from('avatars')
      .remove([`${user.id}/avatar`])
    if (avatarError) throw avatarError

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return Response.json({ deleted: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Unable to delete user account', error)
    return new Response('Unable to delete account', { status: 500, headers: corsHeaders })
  }
})
