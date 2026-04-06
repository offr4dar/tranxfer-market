import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Stripe Price IDs → our subscription tiers
function mapPriceToTier(priceId: string): string {
  const mapping: Record<string, string> = {
    [process.env.STRIPE_PRICE_CLUB_STARTER ?? '']: 'starter',
    [process.env.STRIPE_PRICE_CLUB_PRO ?? '']: 'pro',
    [process.env.STRIPE_PRICE_CLUB_ELITE ?? '']: 'elite',
    [process.env.STRIPE_PRICE_PLAYER_PREMIUM ?? '']: 'pro',
  }
  return mapping[priceId] ?? 'starter'
}

async function getUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  // Check users table first
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (user) return user.id

  // Check organisations
  const { data: org } = await supabase
    .from('organisations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  return org?.id ?? null
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response('Server misconfiguration', { status: 500 })
  }

  const body = await req.text()
  const sig = headers().get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe-webhook] Verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  console.log(`[stripe-webhook] Received: ${event.type}`)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const tier = mapPriceToTier(priceId)
        const userId = await getUserIdByStripeCustomer(sub.customer as string)

        if (!userId) {
          console.error('[stripe-webhook] Could not find user for customer:', sub.customer)
          break
        }

        const { error } = await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            stripe_product_id: sub.items.data[0]?.price.product as string,
            tier,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
            trial_start: sub.trial_start
              ? new Date(sub.trial_start * 1000).toISOString()
              : null,
            trial_end: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          },
          { onConflict: 'stripe_subscription_id' }
        )

        if (error) console.error('[stripe-webhook] Upsert error:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)

        if (error) console.error('[stripe-webhook] Cancel error:', error)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    return new Response('Internal server error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
