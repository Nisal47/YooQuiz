import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { storage } from './config'

const MAX_MB  = 5
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/**
 * Upload a quiz question image to Firebase Storage.
 *
 * Files land at: quiz-images/{uid}/{timestamp}_{random}.{ext}
 * Security rules allow any authenticated user to read and only the owning
 * teacher (uid match) to write.
 *
 * @param {string}         uid         Teacher UID — determines storage path
 * @param {File}           file        The image file to upload
 * @param {function|null}  onProgress  Optional callback(percent: 0–100)
 * @returns {Promise<string>}          Resolves to the public download URL
 */
export async function uploadQuestionImage(uid, file, onProgress) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('Only JPG, PNG, GIF or WebP images are allowed')
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_MB} MB`)
  }

  const ext        = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path       = `quiz-images/${uid}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap  => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        try   { resolve(await getDownloadURL(task.snapshot.ref)) }
        catch (e) { reject(e) }
      },
    )
  })
}

/**
 * Delete a question image by its Firebase Storage download URL.
 * Non-fatal: logs a warning if deletion fails (image may already be gone).
 *
 * @param {string|null} imageUrl  The HTTPS download URL stored in the activity
 */
export async function deleteQuestionImage(imageUrl) {
  if (!imageUrl) return
  try {
    // Firebase Storage download URLs contain the encoded path after /o/
    // e.g. https://firebasestorage.googleapis.com/v0/b/{bucket}/o/quiz-images%2F...?alt=media&token=...
    const match = imageUrl.match(/\/o\/(.+?)(\?|$)/)
    if (!match) return
    const path = decodeURIComponent(match[1])
    await deleteObject(ref(storage, path))
  } catch (e) {
    console.warn('Image cleanup skipped (non-fatal):', e.message)
  }
}
