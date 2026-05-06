import {
  ref, set, get, update, onValue, push,
  query, orderByChild, equalTo, serverTimestamp,
} from 'firebase/database'
import { db } from './config'
import { generateUniqueCode } from '../utils/codeGenerator'

/**
 * Create a new session and return { sessionId, code }.
 *
 * @param {string} hostId   – Firebase anonymous auth uid
 * @param {'quiz'|'team_evaluation'} type – module that owns this session
 */
export async function createSession(hostId, type) {
  const code       = await generateUniqueCode()
  const sessionRef = push(ref(db, 'sessions'))
  const sessionId  = sessionRef.key

  await set(sessionRef, {
    code,
    hostId,
    type:              type ?? 'quiz',
    status:            'waiting',
    currentActivityId: null,
    createdAt:         serverTimestamp(),
  })

  return { sessionId, code }
}

/** Resolve a 6-char join code → session object (or null). */
export async function getSessionByCode(code) {
  const q    = query(ref(db, 'sessions'), orderByChild('code'), equalTo(code.toUpperCase()))
  const snap = await get(q)
  if (!snap.exists()) return null
  const entries = Object.entries(snap.val())
  const [sessionId, data] = entries[0]
  return { sessionId, ...data }
}

/** Partial update a session. */
export async function updateSession(sessionId, data) {
  await update(ref(db, `sessions/${sessionId}`), data)
}

/** Set the currentActivityId on a session. */
export async function setCurrentActivity(sessionId, activityId) {
  await update(ref(db, `sessions/${sessionId}`), { currentActivityId: activityId })
}

/** Subscribe to session changes. Returns an unsubscribe fn. */
export function onSessionChange(sessionId, callback) {
  const unsub = onValue(ref(db, `sessions/${sessionId}`), snap => {
    callback(snap.exists() ? { sessionId, ...snap.val() } : null)
  })
  return unsub
}

/** Get a session once by id. */
export async function getSession(sessionId) {
  const snap = await get(ref(db, `sessions/${sessionId}`))
  return snap.exists() ? { sessionId, ...snap.val() } : null
}

/**
 * Soft-delete a session from the history list by setting hidden: true.
 * The underlying data (activities, responses, votes) is preserved.
 */
export async function hideSession(sessionId) {
  await update(ref(db, `sessions/${sessionId}`), { hidden: true })
}

/**
 * Get ended, visible sessions for a host filtered by module type,
 * sorted most-recent first.
 *
 * @param {string} hostId
 * @param {'quiz'|'team_evaluation'} type – only return sessions of this type
 */
export async function getSessionsByHost(hostId, type) {
  const q    = query(ref(db, 'sessions'), orderByChild('hostId'), equalTo(hostId))
  const snap = await get(q)
  if (!snap.exists()) return []
  const sessions = []
  snap.forEach(child => {
    const data = child.val()
    if (
      data.status === 'ended'  &&
      !data.hidden             &&
      data.type === type
    ) {
      sessions.push({ sessionId: child.key, ...data })
    }
  })
  return sessions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
