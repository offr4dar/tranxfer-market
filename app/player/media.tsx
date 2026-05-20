import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Modal, StatusBar, ActivityIndicator,
  ActionSheetIOS, Alert, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useEffect, useCallback } from 'react'
import Svg, { Path, Circle } from 'react-native-svg'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useUser } from '@clerk/clerk-expo'
import ScreenBackground from '@/components/ScreenBackground'
import { CircleFAB, FABStack, PROFILE_FAB_BOTTOM } from '@/components/CircleFAB'
import { Colors, Spacing } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

const { width: SCREEN_W } = Dimensions.get('window')

// 3-column grid, portrait cells (height ≈ 1.4× width)
const GRID_GAP = 2
const CELL_W   = (SCREEN_W - GRID_GAP * 2) / 3
const CELL_H   = Math.round(CELL_W * 1.4)

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlayerVideo {
  id:            string
  playback_id:   string | null
  thumbnail_url: string | null
  title:         string | null
  duration_secs: number | null
  view_count:    number
  is_featured:   boolean
  status:        'processing' | 'ready' | 'error'
  created_at:    string
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PlayIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4l14 8-14 8V4z" fill={color} />
    </Svg>
  )
}
function HeartIcon({ size = 11, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </Svg>
  )
}
function FilmIcon({ size = 44, color = 'rgba(255,255,255,0.15)' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19.5617 7C19.7904 5.69523 18.7863 4.5 17.4617 4.5H6.53788C5.21323 4.5 4.20922 5.69523 4.43784 7" stroke={color} strokeWidth={1.5} />
      <Path d="M17.4999 4.5C17.5283 4.24092 17.5425 4.11135 17.5427 4.00435C17.545 2.98072 16.7739 2.12064 15.7561 2.01142C15.6497 2 15.5194 2 15.2588 2H8.74099C8.48035 2 8.35002 2 8.24362 2.01142C7.22584 2.12064 6.45481 2.98072 6.45704 4.00434C6.45727 4.11135 6.47146 4.2409 6.49983 4.5" stroke={color} strokeWidth={1.5} />
      <Path d="M14.5812 13.6159C15.1396 13.9621 15.1396 14.8582 14.5812 15.2044L11.2096 17.2945C10.6669 17.6309 10 17.1931 10 16.5003L10 12.32C10 11.6273 10.6669 11.1894 11.2096 11.5258L14.5812 13.6159Z" stroke={color} strokeWidth={1.5} />
      <Path d="M2.38351 13.793C1.93748 10.6294 1.71447 9.04765 2.66232 8.02383C3.61017 7 5.29758 7 8.67239 7H15.3276C18.7024 7 20.3898 7 21.3377 8.02383C22.2855 9.04765 22.0625 10.6294 21.6165 13.793L21.1935 16.793C20.8437 19.2739 20.6689 20.5143 19.7717 21.2572C18.8745 22 17.5512 22 14.9046 22H9.09536C6.44881 22 5.12553 22 4.22834 21.2572C3.33115 20.5143 3.15626 19.2739 2.80648 16.793L2.38351 13.793Z" stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDuration(secs: number | null): string {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Mux video player component ───────────────────────────────────────────────
// Isolated so useVideoPlayer only mounts when the modal is open
function MuxPlayer({ playbackId }: { playbackId: string }) {
  const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`
  const player = useVideoPlayer(hlsUrl, p => {
    p.loop = false
    p.play()
  })

  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      allowsFullscreen={false}  // we're already full-screen
      contentFit="contain"
      nativeControls
    />
  )
}

// ─── Full-screen video modal ───────────────────────────────────────────────────
function VideoModal({ item, onClose }: { item: PlayerVideo; onClose: () => void }) {
  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={modal.root}>
        {/* Player */}
        <View style={modal.videoArea}>
          {item.playback_id ? (
            <MuxPlayer playbackId={item.playback_id} />
          ) : (
            // Still processing
            <View style={modal.processingWrap}>
              <ActivityIndicator size="large" color={Colors.brand} />
              <Text style={modal.processingText}>Processing…</Text>
              <Text style={modal.processingSubtext}>This video is still being processed by Mux.</Text>
            </View>
          )}
        </View>

        {/* Bottom meta */}
        <View style={modal.bottomBar}>
          <View style={modal.pill}>
            <HeartIcon size={12} color={Colors.brand} />
            <Text style={[modal.pillText, { color: Colors.brand }]}>{item.view_count}</Text>
          </View>
          {item.duration_secs && (
            <View style={modal.pill}>
              <Text style={modal.pillText}>{formatDuration(item.duration_secs)}</Text>
            </View>
          )}
          {item.title && (
            <View style={[modal.pill, { flex: 1 }]}>
              <Text style={modal.pillText} numberOfLines={1}>{item.title}</Text>
            </View>
          )}
        </View>

        {/* Close */}
        <TouchableOpacity style={modal.closeBtn} onPress={onClose} hitSlop={12} activeOpacity={0.75}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}
const modal = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoArea:       { flex: 1 },
  processingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  processingText:  { fontFamily: 'Anton_400Regular', fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  processingSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 40 },
  bottomBar:       { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.lg, paddingBottom: 48, paddingTop: 16 },
  pill:            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  pillText:        { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  closeBtn:        { position: 'absolute', top: 54, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
})

// ─── Grid cell ────────────────────────────────────────────────────────────────
function MediaCell({
  item,
  onPress,
  on_menu,
}: {
  item: PlayerVideo
  onPress: () => void
  on_menu: () => void
}) {
  const isProcessing = item.status === 'processing'
  return (
    <TouchableOpacity style={styles.cell} onPress={onPress} activeOpacity={0.85} disabled={isProcessing}>
      <View style={styles.cellThumb}>
        {/* Processing badge */}
        {isProcessing && (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color={Colors.brand} />
          </View>
        )}
        {/* Centre play button */}
        {!isProcessing && (
          <View style={styles.cellPlay}>
            <PlayIcon size={16} color="#fff" />
          </View>
        )}
        {/* Featured star badge */}
        {item.is_featured && (
          <View style={styles.star_badge}>
            <Svg width={9} height={9} viewBox="0 0 24 24" fill={Colors.brand}>
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </Svg>
          </View>
        )}
        {/* Duration — bottom right */}
        {item.duration_secs && (
          <View style={[styles.badge, styles.badgeRight]}>
            <Text style={styles.badgeText}>{formatDuration(item.duration_secs)}</Text>
          </View>
        )}
        {/* Views — bottom left */}
        <View style={[styles.badge, styles.badgeLeft]}>
          <HeartIcon size={10} color="#fff" />
          <Text style={styles.badgeText}>{item.view_count}</Text>
        </View>
        {/* Context menu — top right */}
        <TouchableOpacity
          style={styles.menu_btn}
          onPress={(e) => { e.stopPropagation(); on_menu() }}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Text style={styles.menu_dots}>•••</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PlayerMediaScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { user } = useUser()

  const [videos,      setVideos]      = useState<PlayerVideo[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeVideo, setActiveVideo] = useState<PlayerVideo | null>(null)

  const fetchVideos = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('player_videos')
      .select('id, playback_id, thumbnail_url, title, duration_secs, view_count, is_featured, status, created_at')
      .eq('player_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[MediaScreen] fetch error', error)
    } else {
      setVideos((data ?? []) as PlayerVideo[])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  // Poll every 10s for any videos still processing
  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(fetchVideos, 10_000)
    return () => clearInterval(interval)
  }, [videos, fetchVideos])

  // ── Set as featured ────────────────────────────────────────────────────────
  async function set_as_featured(video_id: string) {
    if (!user?.id) return
    // Clear any existing featured flag for this player, then set the new one
    const { error: clear_error } = await supabase
      .from('player_videos')
      .update({ is_featured: false })
      .eq('player_user_id', user.id)
      .eq('is_featured', true)
    if (clear_error) { Alert.alert('Error', clear_error.message); return }

    const { error: set_error } = await supabase
      .from('player_videos')
      .update({ is_featured: true })
      .eq('id', video_id)
    if (set_error) { Alert.alert('Error', set_error.message); return }

    fetchVideos()
  }

  // ── Delete video ───────────────────────────────────────────────────────────
  async function delete_video(video_id: string) {
    const { error } = await supabase
      .from('player_videos')
      .delete()
      .eq('id', video_id)
    if (error) { Alert.alert('Error', error.message); return }
    fetchVideos()
  }

  // ── Context menu (... button) ──────────────────────────────────────────────
  function open_menu(item: PlayerVideo) {
    const options = item.is_featured
      ? ['Cancel', 'Delete']
      : ['Cancel', 'Set as Featured', 'Delete']
    const destructive_index = options.indexOf('Delete')

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex: destructive_index },
        (btn) => {
          const chosen = options[btn]
          if (chosen === 'Set as Featured') set_as_featured(item.id)
          if (chosen === 'Delete') confirm_delete(item.id)
        },
      )
    } else {
      const android_options = options.filter(o => o !== 'Cancel')
      Alert.alert(
        item.title ?? 'Video',
        undefined,
        [
          ...android_options.map(o => ({
            text: o,
            style: o === 'Delete' ? ('destructive' as const) : ('default' as const),
            onPress: () => {
              if (o === 'Set as Featured') set_as_featured(item.id)
              if (o === 'Delete')          confirm_delete(item.id)
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      )
    }
  }

  function confirm_delete(video_id: string) {
    Alert.alert(
      'Delete video',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => delete_video(video_id) },
      ],
    )
  }

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media</Text>
        <TouchableOpacity onPress={fetchVideos} hitSlop={12} activeOpacity={0.7} style={{ width: 36 }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M1 4v6h6M23 20v-6h-6" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={styles.gridHeader}>
          <Text style={styles.gridHeaderText}>All Videos</Text>
          <Text style={styles.gridCount}>
            {loading ? '…' : `${videos.length} clip${videos.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Loading skeleton */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        )}

        {/* 3-col portrait grid */}
        {!loading && videos.length > 0 && (
          <View style={styles.grid}>
            {videos.map(item => (
              <MediaCell
                key={item.id}
                item={item}
                onPress={() => setActiveVideo(item)}
                on_menu={() => open_menu(item)}
              />
            ))}
            {videos.length % 3 !== 0 &&
              Array.from({ length: 3 - (videos.length % 3) }).map((_, i) => (
                <View key={`pad-${i}`} style={[styles.cell, { backgroundColor: 'transparent' }]} />
              ))
            }
          </View>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <View style={styles.emptyState}>
            <FilmIcon />
            <Text style={styles.emptyTitle}>No videos yet</Text>
            <Text style={styles.emptyDesc}>Tap + to record or upload your first clip</Text>
          </View>
        )}
      </ScrollView>

      <FABStack bottom={insets.bottom + PROFILE_FAB_BOTTOM} right={Spacing.lg}>
        <CircleFAB
          onPress={() => router.push('/player/record' as any)}
          icon={
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5V19M5 12H19" stroke="#000" strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          }
        />
      </FABStack>

      {activeVideo && (
        <VideoModal item={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </ScreenBackground>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Anton_400Regular', fontSize: 20, color: Colors.text, textTransform: 'uppercase', letterSpacing: 1 },

  gridHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  gridHeaderText: { fontFamily: 'Anton_400Regular', fontSize: 18, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridCount:      { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },

  loadingWrap: { alignItems: 'center', paddingTop: 80 },

  // ── 3-col portrait grid ──────────────────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  cell: { width: CELL_W, height: CELL_H, overflow: 'hidden' },
  cellThumb: {
    flex: 1, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  cellPlay: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', paddingLeft: 2,
  },
  processingBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Shared badge (views + duration) ──────────────────────────────────────
  badge: {
    position: 'absolute', bottom: 5,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  badgeLeft:  { left: 5 },
  badgeRight: { right: 5 },
  badgeText:  { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: 'Anton_400Regular', fontSize: 24, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyDesc:  { fontSize: 14, color: 'rgba(255,255,255,0.2)', fontWeight: '600' },

  // ── Cell overlays ─────────────────────────────────────────────────────────
  star_badge: {
    position: 'absolute', top: 5, left: 5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  menu_btn: {
    position: 'absolute', top: 5, right: 5,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  menu_dots: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 10,
  },
})
