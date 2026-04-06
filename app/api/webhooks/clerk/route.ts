import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { WebhookEvent } from '@clerk/nextjs/server'

// Service role client — bypasses RLS for webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set')
    return new Response('Server misconfiguration', { status: 500 })
  }

  // Get svix headers for verification
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[clerk-webhook] Verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }

  const { type, data } = event
  console.log(`[clerk-webhook] Received event: ${type}`)

  try {
    switch (type) {
      case 'user.created': {
        // Pull account_type from public metadata set during sign-up flow
        const accountType = (data.public_metadata?.account_type as string) ?? 'player'

        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id
        )

        if (!primaryEmail) {
          console.error('[clerk-webhook] No primary email for user', data.id)
          break
        }

        const { error } = await supabase.from('users').insert({
          clerk_user_id: data.id,
          email: primaryEmail.email_address,
          email_verified: primaryEmail.verification?.status === 'verified',
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          avatar_url: data.image_url ?? null,
          account_type: accountType,
          last_sign_in_at: data.last_sign_in_at
            ? new Date(data.last_sign_in_at).toISOString()
            : null,
          is_active: true,
          is_banned: false,
        })

        if (error) {
          console.error('[clerk-webhook] Error inserting user:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log(`[clerk-webhook] User created: ${data.id}`)
        break
      }

      case 'user.updated': {
        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id
        )

        const updates: Record<string, unknown> = {
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          avatar_url: data.image_url ?? null,
          last_sign_in_at: data.last_sign_in_at
            ? new Date(data.last_sign_in_at).toISOString()
            : null,
        }

        if (primaryEmail) {
          updates.email = primaryEmail.email_address
          updates.email_verified = primaryEmail.verification?.status === 'verified'
        }

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('clerk_user_id', data.id)

        if (error) {
          console.error('[clerk-webhook] Error updating user:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log(`[clerk-webhook] User updated: ${data.id}`)
        break
      }

      case 'user.deleted': {
        // Soft delete — preserve data for compliance, just deactivate
        const { error } = await supabase
          .from('users')
          .update({ is_active: false })
          .eq('clerk_user_id', data.id)

        if (error) {
          console.error('[clerk-webhook] Error soft-deleting user:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log(`[clerk-webhook] User soft-deleted: ${data.id}`)
        break
      }

      case 'session.created': {
        // Update last sign-in timestamp
        const { error } = await supabase
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('clerk_user_id', data.user_id)

        if (error) {
          console.error('[clerk-webhook] Error updating last_sign_in_at:', error)
        }
        break
      }

      default:
        console.log(`[clerk-webhook] Unhandled event type: ${type}`)
    }
  } catch (err) {
    console.error('[clerk-webhook] Handler error:', err)
    return new Response('Internal server error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
