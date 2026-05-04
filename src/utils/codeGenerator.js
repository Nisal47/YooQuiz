import { ref, query, orderByChild, equalTo, get } from 'firebase/database'
import { db } from '../firebase/config'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomCode() {
  let code = ''
  for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)]
  return code
}

/**
 * Generate a 6-character code that isn't currently in use by an active session.
 */
export async function generateUniqueCode() {
  for (let attempt = 0; attempt < 15; attempt++) {
    const code = randomCode()
    // Query active/waiting sessions with this code
    const q    = query(ref(db, 'sessions'), orderByChild('code'), equalTo(code))
    const snap = await get(q)
    if (!snap.exists()) return code
    // If all matching sessions are ended, it's safe to reuse
    const sessions = Object.values(snap.val())
    const inUse    = sessions.some(s => s.status !== 'ended')
    if (!inUse) return code
  }
  // Fallback — extremely unlikely collision
  return randomCode()
}
