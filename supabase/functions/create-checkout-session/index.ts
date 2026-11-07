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
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const priceId = Deno.env.get('STRIPE_PRICE_ID')
    const siteUrl = Deno.env.get('SITE_URL')
    if (!supabaseUrl || !anonKey || !serviceKey || !stripeKey || !priceId || !siteUrl) {
      throw new Error('Checkout is not configured.')
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: entitlement, error: entitlementError } = await admin
      .from('user_entitlements')
      .select('stripe_customer_id, plan, status')
      .eq('user_id', user.id)
      .single()
    if (entitlementError) throw entitlementError
    if (entitlement.plan === 'premium' && ['active', 'trialing'].includes(entitlement.status)) {
      return new Response('Already subscribed', { status: 409, headers: corsHeaders })
    }

    const stripe = new Stripe(stripeKey)
    const price = await stripe.prices.retrieve(priceId)
    if (
      !price.active
      || price.currency !== 'usd'
      || price.unit_amount !== 250
      || price.recurring?.interval !== 'month'
    ) {
      throw new Error('Stripe price must be an active monthly USD price of 250 cents.')
    }

    let customerId = entitlement.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      const { error: saveCustomerError } = await admin
        .from('user_entitlements')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
      if (saveCustomerError) throw saveCustomerError
    }

    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    })
    if (existingSubscriptions.data.some(subscription =>
      ['active', 'trialing', 'incomplete', 'past_due'].includes(subscription.status),
    )) {
      return new Response('An existing subscription must be managed first.', { status: 409, headers: corsHeaders })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: new URL('?premium=success', siteUrl).toString(),
      cancel_url: new URL('?premium=cancel', siteUrl).toString(),
    })
    return Response.json({ url: session.url }, { headers: corsHeaders })
  } catch (error) {
    console.error('Unable to create subscription checkout', error)
    return new Response('Unable to start checkout', { status: 500, headers: corsHeaders })
  }
})
