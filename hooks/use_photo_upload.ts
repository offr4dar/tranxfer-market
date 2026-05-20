import { useState } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@clerk/clerk-expo'
import { supabase } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

// NOTE: The 'avatars' bucket must exist in Supabase Storage with public access enabled.
// Create it in the Supabase dashboard: Storage → New Bucket → name: 'avatars' → Public: on
const STORAGE_BUCKET = 'avatars'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoSource = 'library' | 'camera'

interface UsePhotoUploadReturn {
  uploading: boolean
  select_and_upload: (source?: PhotoSource) => Promise<string | null>
}

// ─── Shared upload helper ─────────────────────────────────────────────────────

async function upload_asset(asset: ImagePicker.ImagePickerAsset, user_id: string): Promise<string> {
  const ext  = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user_id}/avatar.${ext}`

  const response = await fetch(asset.uri)
  const blob     = await response.blob()

  const { error: upload_error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, {
      contentType: asset.mimeType ?? `image/${ext}`,
      upsert: true,   // replace any existing avatar
    })

  if (upload_error) throw upload_error

  const { data: url_data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  const public_url = url_data.publicUrl

  const { error: db_error } = await supabase
    .from('player_profiles')
    .update({ profile_photo_url: public_url })
    .eq('user_id', user_id)

  if (db_error) throw db_error

  return public_url
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function use_photo_upload(): UsePhotoUploadReturn {
  const { userId } = useAuth()
  const [uploading, set_uploading] = useState(false)

  async function select_and_upload(source: PhotoSource = 'library'): Promise<string | null> {
    if (!userId) return null

    // 1. Request the appropriate permission
    if (source === 'library') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photo library to upload a profile picture.')
        return null
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take a profile photo.')
        return null
      }
    }

    // 2. Launch picker or camera — square crop enforced
    const result = source === 'library'
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })

    if (result.canceled || !result.assets[0]) return null

    set_uploading(true)
    try {
      return await upload_asset(result.assets[0], userId)
    } catch (err: unknown) {
      console.error('[use_photo_upload] error:', err)
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      set_uploading(false)
    }
  }

  return { uploading, select_and_upload }
}
