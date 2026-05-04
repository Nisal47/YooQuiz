import { ref, set, get, onValue, serverTimestamp } from 'firebase/database'
import { db } from './config'

/**
 * Submit a student's response. Write-once (rules block overwrites).
 */
export async function submitResponse(activityId, studentId, { value, timeRemaining, pointsEarned }) {
  await set(ref(db, `responses/${activityId}/${studentId}`), {
    value,
    timeRemaining,
    pointsEarned,
    submittedAt: serverTimestamp(),
  })
}

/** Get all responses for an activity once. */
export async function getResponses(activityId) {
  const snap = await get(ref(db, `responses/${activityId}`))
  if (!snap.exists()) return {}
  return snap.val()
}

/** Subscribe to all responses for an activity. Returns unsubscribe fn. */
export function onResponsesChange(activityId, callback) {
  return onValue(ref(db, `responses/${activityId}`), snap => {
    callback(snap.exists() ? snap.val() : {})
  })
}

/** Check whether a specific student has already responded. */
export async function hasResponded(activityId, studentId) {
  const snap = await get(ref(db, `responses/${activityId}/${studentId}`))
  return snap.exists()
}
