import { initializeApp }          from 'firebase/app'
import { getDatabase }            from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore }           from 'firebase/firestore'

const firebaseConfig = {
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:       import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db        = getDatabase(app)
export const auth      = getAuth(app)
export const firestore = getFirestore(app)

/**
 * Sign in anonymously and return the uid.
 * Used by students — they never need a real account.
 * Idempotent: reuses the existing Firebase session if one exists.
 */
export async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser.uid
  const cred = await signInAnonymously(auth)
  return cred.user.uid
}
