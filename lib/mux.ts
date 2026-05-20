/**
 * lib/mux.ts
 *
 * Client-side helpers for Mux video upload.
 * All Mux API secrets live in the Edge Functions — this module only
 * deals with the upload URL returned by the `mux-upload-url` function
 * and the file transfer itself.
 */

import {
  createUploadTask,
  FileSystemUploadType,
  type UploadProgressData,
} from 'expo-file-system/legacy'
import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL!

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MuxUploadUrlResponse {
  uploadUrl: string
  uploadId:  string
}

export interface UploadProgress {
  /** 0–1 */
  progress:   number
  bytesSent:  number
  totalBytes: number
}

// ─── Get a signed Mux upload URL from our Edge Function ───────────────────────

export async function getMuxUploadUrl(): Promise<MuxUploadUrlResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${FUNCTIONS_URL}/mux-upload-url`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`mux-upload-url failed (${res.status}): ${body}`)
  }

  return res.json() as Promise<MuxUploadUrlResponse>
}

// ─── Upload the video file directly to Mux ────────────────────────────────────

export async function uploadVideoToMux(
  localUri:   string,
  uploadUrl:  string,
  onProgress?: (p: UploadProgress) => void,
): Promise<void> {
  const callback = onProgress
    ? (data: UploadProgressData) => {
        const { totalBytesSent, totalBytesExpectedToSend } = data
        const progress = totalBytesExpectedToSend > 0
          ? totalBytesSent / totalBytesExpectedToSend
          : 0
        onProgress({ progress, bytesSent: totalBytesSent, totalBytes: totalBytesExpectedToSend })
      }
    : undefined

  const task = createUploadTask(
    uploadUrl,
    localUri,
    {
      httpMethod:  'PUT',
      uploadType:  FileSystemUploadType.BINARY_CONTENT,
    },
    callback,
  )

  const result = await task.uploadAsync()

  if (!result || result.status < 200 || result.status >= 300) {
    throw new Error(`Mux upload failed with HTTP ${result?.status}`)
  }
}

// ─── Insert a player_videos row (status = 'processing') ───────────────────────

export async function createVideoRecord(params: {
  uploadId:     string
  playerId:     string
  title?:       string
  description?: string
}): Promise<string> {
  const { uploadId, playerId, title, description } = params

  const { data, error } = await supabase
    .from('player_videos')
    .insert({
      player_user_id: playerId,
      upload_id:      uploadId,
      title:          title ?? null,
      description:    description ?? null,
      status:         'processing',
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create video record: ${error.message}`)
  return data.id as string
}

// ─── Full upload flow (convenience) ──────────────────────────────────────────

/**
 * Orchestrates the full upload:
 *  1. Get signed URL from Edge Function
 *  2. PUT the file to Mux
 *  3. Insert player_videos row
 * Returns the new player_videos row ID.
 */
export async function uploadHighlightReel(params: {
  localUri:     string
  playerId:     string
  title?:       string
  description?: string
  onProgress?:  (p: UploadProgress) => void
}): Promise<string> {
  const { localUri, playerId, title, description, onProgress } = params

  // Step 1 — get upload URL
  const { uploadUrl, uploadId } = await getMuxUploadUrl()

  // Step 2 — upload file
  await uploadVideoToMux(localUri, uploadUrl, onProgress)

  // Step 3 — persist record
  const rowId = await createVideoRecord({ uploadId, playerId, title, description })

  return rowId
}
