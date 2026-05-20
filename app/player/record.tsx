/**
 * app/player/record.tsx
 *
 * Camera + upload screen for player media.
 * - Full-screen camera preview (expo-camera)
 * - Press-and-hold record button centred at the bottom
 * - "Upload from library" button bottom-left (expo-image-picker)
 * - Close / back button top-left
 * - On stop/pick: uploads video directly to Mux with progress bar
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Pressable, Animated, Dimensions, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import Svg, { Path, Rect, Circle } from 'react-native-svg'
import { Colors, Spacing } from '@/constants/theme'
import { useUser } from '@clerk/clerk-expo'
import { uploadHighlightReel, UploadProgress } from '@/lib/mux'

const { width: W, height: H } = Dimensions.get('window')

// ─── Icons ────────────────────────────────────────────────────────────────────
function CloseIcon({ color = '#fff', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  )
}

function FlipIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 4v6h6M23 20v-6h-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function LibraryIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.5} />
      <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.5} />
      <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.5} />
      <Rect x={14} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

// ─── Animated record button ───────────────────────────────────────────────────
function RecordButton({
  recording,
  disabled,
  onPressIn,
  onPressOut,
}: {
  recording: boolean
  disabled:  boolean
  onPressIn:  () => void
  onPressOut: () => void
}) {
  const scale = useRef(new Animated.Value(1)).current
  const inner = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (disabled) return
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(inner, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start()
    onPressIn()
  }

  const handlePressOut = () => {
    if (disabled) return
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(inner, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start()
    onPressOut()
  }

  const borderRadius = inner.interpolate({ inputRange: [0, 1], outputRange: [10, 38] })
  const innerSize    = inner.interpolate({ inputRange: [0, 1], outputRange: [36, 62] })

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
      <Animated.View style={[styles.recBtnOuter, { transform: [{ scale }], opacity: disabled ? 0.4 : 1 }]}>
        <Animated.View
          style={[
            styles.recBtnInner,
            { borderRadius, width: innerSize, height: innerSize },
          ]}
        />
      </Animated.View>
    </Pressable>
  )
}

// ─── Upload progress overlay ──────────────────────────────────────────────────
function UploadOverlay({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100)
  return (
    <View style={overlay.root}>
      <View style={overlay.card}>
        <Text style={overlay.title}>UPLOADING</Text>
        {/* Progress track */}
        <View style={overlay.track}>
          <Animated.View style={[overlay.fill, { width: `${pct}%` as unknown as number }]} />
        </View>
        <Text style={overlay.pct}>{pct}%</Text>
        <Text style={overlay.sub}>
          {pct < 100 ? 'Sending to Mux\u2026' : "Processing \u2014 you'll be notified when ready"}
        </Text>
      </View>
    </View>
  )
}
const overlay = StyleSheet.create({
  root:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  card:  { width: W * 0.78, backgroundColor: '#111', borderRadius: 20, padding: 28, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { fontFamily: 'Anton_400Regular', fontSize: 20, color: '#fff', letterSpacing: 2 },
  track: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 6, backgroundColor: Colors.brand, borderRadius: 3 },
  pct:   { fontFamily: 'Anton_400Regular', fontSize: 36, color: Colors.brand },
  sub:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 18, fontWeight: '600' },
})

// ─── Permission gate ──────────────────────────────────────────────────────────
function PermissionGate({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={styles.permGate}>
      <Text style={styles.permTitle}>Camera access needed</Text>
      <Text style={styles.permSub}>Tranxfer needs camera and microphone access to record videos.</Text>
      <TouchableOpacity style={styles.permBtn} onPress={onRequest} activeOpacity={0.85}>
        <Text style={styles.permBtnText}>Allow access</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RecordScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { user } = useUser()

  const [cameraPermission,    requestCameraPermission]    = useCameraPermissions()
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions()
  const [facing,    setFacing]    = useState<CameraType>('back')
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const cameraRef = useRef<CameraView>(null)

  const hasPermissions = cameraPermission?.granted
  const playerId = user?.id ?? ''

  const requestAll = useCallback(async () => {
    await requestCameraPermission()
    await requestMicrophonePermission()
  }, [])

  // ── Shared upload handler ──────────────────────────────────────────────────
  const handleUpload = useCallback(async (localUri: string) => {
    if (!playerId) {
      Alert.alert('Error', 'Could not determine your player ID. Please sign in again.')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      await uploadHighlightReel({
        localUri,
        playerId,
        onProgress: (p: UploadProgress) => {
          setUploadProgress(p.progress)
        },
      })
      // Small delay so user sees 100%
      await new Promise(r => setTimeout(r, 600))
      router.replace('/player/media' as any)
    } catch (err: unknown) {
      console.error('[RecordScreen] upload error', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      Alert.alert(
        'Upload failed',
        `Something went wrong: ${message}`,
        [
          { text: 'Retry', onPress: () => handleUpload(localUri) },
          { text: 'Cancel', style: 'cancel' },
        ],
      )
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [playerId, router])

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!cameraRef.current || recording || uploading) return
    setRecording(true)
    try {
      const result = await cameraRef.current.recordAsync({ maxDuration: 30 })
      if (result?.uri) {
        await handleUpload(result.uri)
      }
    } catch (e) {
      console.warn('[Record] error', e)
    } finally {
      setRecording(false)
    }
  }

  const stopRecording = () => {
    cameraRef.current?.stopRecording()
  }

  // ── Library picker ─────────────────────────────────────────────────────────
  const openLibrary = async () => {
    if (uploading) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to upload videos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets.length > 0) {
      await handleUpload(result.assets[0].uri)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!hasPermissions) {
    return (
      <View style={styles.root}>
        <PermissionGate onRequest={requestAll} />
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
          hitSlop={12}
          activeOpacity={0.75}
        >
          <CloseIcon />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Full-screen camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* Subtle dark vignette at top and bottom */}
      <View style={styles.vignetteTop}    pointerEvents="none" />
      <View style={styles.vignetteBottom} pointerEvents="none" />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Close */}
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={12} activeOpacity={0.75} disabled={uploading}>
          <CloseIcon />
        </TouchableOpacity>

        {/* Recording indicator */}
        {recording && (
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recLabel}>REC</Text>
          </View>
        )}

        {/* Flip camera */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
          hitSlop={12}
          activeOpacity={0.75}
          disabled={recording || uploading}
        >
          <FlipIcon />
        </TouchableOpacity>
      </View>

      {/* ── Duration hint ── */}
      <View style={styles.hintWrap} pointerEvents="none">
        <Text style={styles.hintText}>Hold to record · max 30s</Text>
      </View>

      {/* ── Bottom controls ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 32 }]}>
        {/* Library button — bottom left */}
        <TouchableOpacity style={styles.sideBtn} onPress={openLibrary} activeOpacity={0.8} disabled={uploading || recording}>
          <LibraryIcon size={26} />
          <Text style={styles.sideBtnLabel}>Library</Text>
        </TouchableOpacity>

        {/* Record button — bottom centre */}
        <RecordButton
          recording={recording}
          disabled={uploading}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        />

        {/* Spacer to balance the library button */}
        <View style={styles.sideBtn} />
      </View>

      {/* ── Upload overlay ── */}
      {uploading && <UploadOverlay progress={uploadProgress} />}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Vignette overlays ────────────────────────────────────────────────────
  vignetteTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  recLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },

  // ── Duration hint ─────────────────────────────────────────────────────────
  hintWrap: {
    position: 'absolute',
    bottom: 210,
    left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Bottom controls ──────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  sideBtn: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  sideBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },

  // ── Record button ────────────────────────────────────────────────────────
  recBtnOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 38,
    backgroundColor: '#FF3B30',
  },

  // ── Permission gate ──────────────────────────────────────────────────────
  permGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 16,
  },
  permTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  permSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  permBtn: {
    marginTop: 8,
    backgroundColor: Colors.brand,
    borderRadius: 100,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
})
