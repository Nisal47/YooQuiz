import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

/** Sign in with a Google account popup. Returns the Firebase User. */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

/** Sign in with email + password. Returns the Firebase User. */
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Create a new email/password account, set the display name,
 * and send a verification email. Returns the Firebase User.
 */
export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(result.user, { displayName })
  }
  await sendEmailVerification(result.user)
  return result.user
}

/** Resend the verification email to the currently signed-in user. */
export async function resendVerificationEmail() {
  const user = auth.currentUser
  if (user && !user.emailVerified) {
    await sendEmailVerification(user)
  }
}

/** Sign the current teacher out. */
export async function signOutTeacher() {
  await signOut(auth)
}

/**
 * Subscribe to teacher auth state changes.
 * Returns an unsubscribe function.
 */
export function onTeacherAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
