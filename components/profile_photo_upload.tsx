import { useState } from 'react'
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, ActionSheetIOS, Alert, Platform,
} from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { use_photo_upload } from '@/hooks/use_photo_upload'
import { Colors } from '@/constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  photo_url?:    string                 // current URL from player_profiles
  initials:      string                 // e.g. "EA" — shown when no photo
  size?:         number                 // avatar diameter in px, default 100
  on_change?:    (url: string) => void  // called after successful upload
  is_demo_mode?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePhotoUpload({
  photo_url,
  initials,
  size = 100,
  on_change,
  is_demo_mode = false,
}: Props) {
  const { uploading, select_and_upload } = use_photo_upload()

  // Optimistic local URL — updates instantly after upload without needing a DB refetch
  const [local_url, set_local_url] = useState<string | undefined>(photo_url)
  const display_url = local_url ?? photo_url

  const radius      = size / 2
  const badge_size  = Math.round(size * 0.3)

  async function handle_upload(source: 'library' | 'camera') {
    const url = await select_and_upload(source)
    if (url) {
      set_local_url(url)
      on_change?.(url)
    }
  }

  function handle_press() {
    if (is_demo_mode) {
      Alert.alert('Demo mode', 'Photo upload is disabled in demo mode.')
      return
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (button_index) => {
          if (button_index === 1) handle_upload('camera')
          else if (button_index === 2) handle_upload('library')
        },
      )
    } else {
      // Android: show simple Alert with options (ActionSheetIOS iOS-only)
      Alert.alert('Profile Photo', 'Choose a source', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo',          onPress: () => handle_upload('camera')  },
        { text: 'Choose from Library', onPress: () => handle_upload('library') },
      ])
    }
  }

  return (
    <TouchableOpacity
      onPress={handle_press}
      activeOpacity={0.85}
      disabled={uploading}
      style={[styles.wrap, { width: size, height: size }]}
    >
      {/* ── Avatar circle ── */}
      {display_url ? (
        <Image
          source={{ uri: display_url }}
          style={[styles.photo, { width: size, height: size, borderRadius: radius }]}
        />
      ) : (
        <View style={[
          styles.initials_circle,
          { width: size, height: size, borderRadius: radius },
        ]}>
          <Text style={[styles.initials_text, { fontSize: Math.round(size * 0.34) }]}>
            {initials}
          </Text>
        </View>
      )}

      {/* ── Camera badge ── */}
      <View style={[
        styles.camera_badge,
        { width: badge_size, height: badge_size, borderRadius: badge_size / 2 },
      ]}>
        {uploading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Svg
            width={badge_size * 0.55}
            height={badge_size * 0.55}
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="12" cy="13" r="4" stroke="#000" strokeWidth={2} />
          </Svg>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  photo: {
    resizeMode: 'cover',
  },
  initials_circle: {
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderWidth: 2,
    borderColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials_text: {
    fontWeight: '700',
    color: Colors.brand,
  },
  camera_badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
