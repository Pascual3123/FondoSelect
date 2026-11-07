import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const siteUrl = Deno.env.get('SITE_URL')
    if (!supabaseUrl || !anonKey || !stripeKey || !siteUrl) throw new Error('Billing portal is not configured.')

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await client.auth.getUser()
    if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { data: entitlement, error } = await client
      .from('user_entitlements')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()
    if (error) throw error
    if (!entitlement.stripe_customer_id) {
      return new Response('No billing account', { status: 404, headers: corsHeaders })
    }

    const stripe = new Stripe(stripeKey)
    const session = await stripe.billingPortal.sessions.create({
      customer: entitlement.stripe_customer_id,
      return_url: siteUrl,
    })
    return Response.json({ url: session.url }, { headers: corsHeaders })
  } catch (error) {
    console.error('Unable to create billing portal session', error)
    return new Response('Unable to open billing portal', { status: 500, headers: corsHeaders })
  }
})
