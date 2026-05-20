/**
 * supabase/functions/mux-upload-url/index.ts
 *
 * Generates a Mux Direct Upload URL for the authenticated player.
 * Called by the app before uploading a video — the Mux API secrets
 * never leave this server-side function.
 *
 * Request:  POST (no body required)
 * Headers:  Authorization: Bearer <supabase-access-token>
 * Response: { uploadUrl: string, uploadId: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // ── CORS preflight ───────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ── Authenticate via Supabase JWT ──────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Verify the user has a player profile ──────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('player_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Player profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Create Mux Direct Upload ───────────────────────────────────────────────
    const muxTokenId     = Deno.env.get('MUX_TOKEN_ID')!
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET')!

    const muxResponse = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${muxTokenId}:${muxTokenSecret}`)}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        cors_origin: '*',  // Restrict to app scheme in production (e.g. tranxfer://)
        new_asset_settings: {
          playback_policy: ['public'],
          // mp4_support: 'standard', // Uncomment to also get an MP4 download
        },
        // Max 2 GB, 3 hours — enforce stricter limits client-side (90s / 200MB per spec)
      }),
    })

    if (!muxResponse.ok) {
      const muxError = await muxResponse.text()
      console.error('[mux-upload-url] Mux API error:', muxError)
      return new Response(JSON.stringify({ error: 'Failed to create Mux upload' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: muxData } = await muxResponse.json() as {
      data: { id: string; url: string }
    }

    return new Response(
      JSON.stringify({ uploadUrl: muxData.url, uploadId: muxData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('[mux-upload-url] Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
