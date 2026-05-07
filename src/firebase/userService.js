import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { firestore } from './config'

/**
 * Create or update a teacher's profile in Firestore.
 *
 * On first sign-in   → creates the document with plan:'free'.
 * On subsequent logins → only updates lastLoginAt (preserves plan, etc.).
 *
 * @param {string} uid
 * @param {{ displayName, email, provider, photoURL }} info
 */
export async function createUserProfile(uid, { displayName, email, provider, photoURL }) {
  const ref  = doc(firestore, 'users', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { lastLoginAt: serverTimestamp() })
    return
  }

  await setDoc(ref, {
    uid,
    displayName: displayName || '',
    email:       email       || '',
    provider,                          // 'google' | 'email'
    photoURL:    photoURL    || null,
    plan:        'free',               // 'free' | 'standard' | 'pro'  (future)
    createdAt:   serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  })
}

/** Fetch a teacher's Firestore profile (or null if not found). */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(firestore, 'users', uid))
  return snap.exists() ? snap.data() : null
}

/** Partial update on a teacher's profile. */
export async function updateUserProfile(uid, data) {
  await updateDoc(doc(firestore, 'users', uid), data)
}
