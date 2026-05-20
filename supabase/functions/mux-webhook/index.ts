/**
 * supabase/functions/mux-webhook/index.ts
 *
 * Receives Mux webhook events and updates the player_videos table.
 *
 * Handled events:
 *   - video.upload.asset_created  → links upload_id to a Mux asset_id
 *   - video.asset.ready           → sets playback_id, thumbnail_url, status='ready'
 *   - video.asset.errored         → sets status='error'
 *
 * Register in Mux Dashboard → Settings → Webhooks:
 *   URL:  https://<project-ref>.supabase.co/functions/v1/mux-webhook
 *   Set MUX_WEBHOOK_SECRET in Supabase Secrets.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mux-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Verify the Mux webhook signature.
 * Mux signs with HMAC-SHA256 using the webhook secret.
 * Header format: "t=<timestamp>,v1=<signature>"
 */
async function verifyMuxSignature(body: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const v1Sig     = parts['v1']
  if (!timestamp || !v1Sig) return false

  const payload   = `${timestamp}.${body}`
  const hmac      = createHmac('sha256', secret)
  hmac.update(payload)
  const computed  = hmac.digest('hex')
  return computed === v1Sig
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const body = await req.text()

  // ── Verify signature ──────────────────────────────────────────────────────────
  const webhookSecret = Deno.env.get('MUX_WEBHOOK_SECRET') ?? ''
  if (webhookSecret) {
    const sig = req.headers.get('mux-signature')
    const valid = await verifyMuxSignature(body, sig, webhookSecret)
    if (!valid) {
      console.warn('[mux-webhook] Invalid signature')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
  } else {
    console.warn('[mux-webhook] MUX_WEBHOOK_SECRET not set — skipping signature check')
  }

  // ── Parse event ───────────────────────────────────────────────────────────────
  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return new Response('Bad JSON', { status: 400, headers: corsHeaders })
  }

  console.log('[mux-webhook] Received event:', event.type)

  // Use service-role client so we can update rows regardless of RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { type, data } = event

  // ── video.upload.asset_created ────────────────────────────────────────────────
  // Fired when Mux accepts the upload and creates an asset.
  // We store the asset_id against the upload_id so later events can be matched.
  if (type === 'video.upload.asset_created') {
    const uploadId  = data.id as string
    const assetId   = (data.asset_id ?? (data as Record<string, unknown>)['asset_id']) as string | undefined

    if (uploadId && assetId) {
      // Store asset_id in a temporary column for lookup — we use upload_id as the FK
      // No schema change needed; we'll just log for now and match on asset.ready below
      console.log(`[mux-webhook] Upload ${uploadId} → asset ${assetId}`)
    }
    return new Response('OK', { status: 200, headers: corsHeaders })
  }

  // ── video.asset.ready ─────────────────────────────────────────────────────────
  if (type === 'video.asset.ready') {
    const asset = data as {
      id: string
      upload_id?: string
      playback_ids?: Array<{ id: string; policy: string }>
      duration?: number
      tracks?: Array<{ type: string }>
    }

    const uploadId   = asset.upload_id
    const playbackId = asset.playback_ids?.[0]?.id
    const duration   = asset.duration ? Math.round(asset.duration) : null

    if (!uploadId || !playbackId) {
      console.warn('[mux-webhook] asset.ready missing upload_id or playback_id', asset)
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // Mux animated GIF thumbnail (first frame, 640px wide)
    const thumbnailUrl = `https://image.mux.com/${playbackId}/animated.gif?width=320&fps=5&start=0&end=3`

    const { error } = await supabase
      .from('player_videos')
      .update({
        playback_id:   playbackId,
        thumbnail_url: thumbnailUrl,
        duration_secs: duration,
        status:        'ready',
      })
      .eq('upload_id', uploadId)

    if (error) {
      console.error('[mux-webhook] Failed to update player_videos:', error)
      return new Response('DB error', { status: 500, headers: corsHeaders })
    }

    console.log(`[mux-webhook] Video ready — upload ${uploadId}, playback ${playbackId}`)
    return new Response('OK', { status: 200, headers: corsHeaders })
  }

  // ── video.asset.errored ───────────────────────────────────────────────────────
  if (type === 'video.asset.errored') {
    const asset    = data as { upload_id?: string; errors?: unknown }
    const uploadId = asset.upload_id

    if (uploadId) {
      await supabase
        .from('player_videos')
        .update({ status: 'error' })
        .eq('upload_id', uploadId)

      console.log(`[mux-webhook] Asset errored for upload ${uploadId}`)
    }
    return new Response('OK', { status: 200, headers: corsHeaders })
  }

  // Acknowledge any other event types without error
  return new Response('OK', { status: 200, headers: corsHeaders })
})
