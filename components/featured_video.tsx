import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Modal, StatusBar, ActivityIndicator,
} from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing } from '@/constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedVideoData {
  id:            string
  playback_id:   string | null
  thumbnail_url: string | null
  title:         string | null
  duration_secs: number | null
  status:        'processing' | 'ready' | 'error'
}

interface Props {
  user_id:    string
  is_own_profile: boolean
}

// ─── Mux HLS player (isolated so hooks only mount when modal opens) ───────────

function MuxPlayer({ playback_id }: { playback_id: string }) {
  const hls_url = `https://stream.mux.com/${playback_id}.m3u8`
  const player  = useVideoPlayer(hls_url, p => {
    p.loop = false
    p.play()
  })
  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      allowsFullscreen={false}
      contentFit="contain"
      nativeControls
    />
  )
}

// ─── Full-screen modal player ─────────────────────────────────────────────────

function VideoModal({ video, on_close }: { video: FeaturedVideoData; on_close: () => void }) {
  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent onRequestClose={on_close}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={modal_styles.root}>
        <View style={modal_styles.video_area}>
          {video.playback_id ? (
            <MuxPlayer playback_id={video.playback_id} />
          ) : (
            <View style={modal_styles.processing_wrap}>
              <ActivityIndicator size="large" color={Colors.brand} />
              <Text style={modal_styles.processing_text}>Processing…</Text>
              <Text style={modal_styles.processing_sub}>This video is still being processed.</Text>
            </View>
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity style={modal_styles.close_btn} onPress={on_close} hitSlop={12} activeOpacity={0.75}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const modal_styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video_area:      { flex: 1 },
  processing_wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  processing_text: { fontFamily: 'Anton_400Regular', fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  processing_sub:  { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 40 },
  close_btn:       {
    position: 'absolute', top: 54, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeaturedVideo({ user_id, is_own_profile }: Props) {
  const router = useRouter()
  const [video,              set_video]              = useState<FeaturedVideoData | null>(null)
  const [loading,            set_loading]            = useState(true)
  const [modal_open,         set_modal_open]         = useState(false)
  const [has_gallery_videos, set_has_gallery_videos] = useState(false)

  const fetch_featured = useCallback(async () => {
    set_loading(true)
    const [{ data, error }, { count }] = await Promise.all([
      supabase
        .from('player_videos')
        .select('id, playback_id, thumbnail_url, title, duration_secs, status')
        .eq('player_user_id', user_id)
        .eq('is_featured', true)
        .maybeSingle(),
      supabase
        .from('player_videos')
        .select('id', { count: 'exact', head: true })
        .eq('player_user_id', user_id),
    ])

    if (error) {
      console.error('[FeaturedVideo] fetch error:', error)
    } else {
      set_video(data as FeaturedVideoData | null)
    }
    set_has_gallery_videos((count ?? 0) > 0)
    set_loading(false)
  }, [user_id])

  useEffect(() => { fetch_featured() }, [fetch_featured])

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    )
  }

  // ── No featured video set ──
  if (!video) {
    return (
      <View style={styles.placeholder}>
        {/* Film icon */}
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19.56 7C19.79 5.7 18.79 4.5 17.46 4.5H6.54C5.21 4.5 4.21 5.7 4.44 7"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1.5}
          />
          <Path
            d="M14.58 13.62c.56.35.56 1.24 0 1.59l-3.37 2.09c-.54.34-1.21-.1-1.21-.8v-4.18c0-.7.67-1.14 1.21-.8l3.37 2.1z"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1.5}
          />
          <Path
            d="M2.38 13.79C1.94 10.63 1.71 9.05 2.66 8.02 3.61 7 5.3 7 8.67 7h6.66c3.37 0 5.06 0 6.01 1.02.95 1.02.72 2.61.28 5.77l-.42 3c-.35 2.48-.52 3.72-1.42 4.46C18.87 22 17.55 22 14.9 22H9.1c-2.65 0-3.97 0-4.87-.75-.9-.74-1.07-1.98-1.42-4.46l-.42-3z"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1.5}
          />
        </Svg>
        <Text style={styles.placeholder_title}>No featured video</Text>
        {is_own_profile ? (
          <>
            <Text style={styles.placeholder_sub}>You have not set a featured video</Text>
            {has_gallery_videos ? (
              <>
                <TouchableOpacity
                  style={styles.outline_btn}
                  onPress={() => router.push('/player/media' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.outline_btn_text}>Set featured video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.text_link}
                  onPress={() => router.push('/player/record' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.text_link_text}>Upload video</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.outline_btn}
                onPress={() => router.push('/player/record' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.outline_btn_text}>Upload video</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.placeholder_sub}>This player hasn't set a featured video yet.</Text>
        )}
      </View>
    )
  }

  // ── Featured video present ──
  const thumb_url = video.thumbnail_url
    ?? (video.playback_id ? `https://image.mux.com/${video.playback_id}/thumbnail.jpg` : null)

  return (
    <>
      <TouchableOpacity
        style={styles.player_wrap}
        activeOpacity={0.9}
        onPress={() => set_modal_open(true)}
      >
        {/* Thumbnail */}
        {thumb_url ? (
          <Image source={{ uri: thumb_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumb_fallback]} />
        )}

        {/* Dark gradient overlay */}
        <View style={styles.overlay} />

        {/* Featured badge */}
        <View style={styles.featured_badge}>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill={Colors.brand}>
            <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </Svg>
          <Text style={styles.featured_badge_text}>FEATURED</Text>
        </View>

        {/* Play button */}
        <View style={styles.play_btn}>
          {video.status === 'processing' ? (
            <ActivityIndicator size="small" color={Colors.brand} />
          ) : (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M6 4l14 8-14 8V4z" fill="#000" />
            </Svg>
          )}
        </View>

        {/* Title */}
        {video.title && (
          <Text style={styles.video_title} numberOfLines={1}>{video.title}</Text>
        )}
      </TouchableOpacity>

      {/* View gallery link */}
      {is_own_profile && (
        <TouchableOpacity
          style={styles.gallery_link}
          onPress={() => router.push('/player/media' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.gallery_link_text}>View media gallery →</Text>
        </TouchableOpacity>
      )}

      {/* Full-screen player modal */}
      {modal_open && (
        <VideoModal video={video} on_close={() => set_modal_open(false)} />
      )}
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Placeholder (no video)
  placeholder: {
    minHeight: 160,
    backgroundColor: '#111',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: Spacing.lg,
  },
  placeholder_title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 18,
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeholder_sub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  outline_btn: {
    marginTop: 4,
    paddingHorizontal: 24,
    height: 36,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline_btn_text: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text_link: {
    marginTop: 10,
  },
  text_link_text: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },

  // Player / thumbnail
  player_wrap: {
    height: 210,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  thumb_fallback: {
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  play_btn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  video_title: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Featured badge
  featured_badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  featured_badge_text: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.5,
  },

  // Gallery link
  gallery_link: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  gallery_link_text: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: '600',
  },
})
