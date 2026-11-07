import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response('Webhook is not configured', { status: 500, headers: corsHeaders })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing Stripe signature', { status: 400, headers: corsHeaders })

  try {
    const stripe = new Stripe(stripeKey)
    const event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    )
    if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.supabase_user_id
      if (!userId) throw new Error(`Subscription ${subscription.id} has no Supabase user metadata.`)

      const active = ['active', 'trialing'].includes(subscription.status)
      const admin = createClient(supabaseUrl, serviceKey)
      const { error } = await admin
        .from('user_entitlements')
        .update({
          plan: active ? 'premium' : 'free',
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_customer_id: String(subscription.customer),
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
      if (error) throw error
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook verification or processing failed', error)
    return new Response('Invalid webhook event', { status: 400, headers: corsHeaders })
  }
})
