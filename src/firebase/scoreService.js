import { ref, set, get, update, onValue, runTransaction } from 'firebase/database'
import { db } from './config'

/**
 * Register a participant in a session.
 * Safe to call on rejoin — existing participants keep their totalScore.
 */
export async function addParticipant(sessionId, studentId, nickname) {
  const r    = ref(db, `participants/${sessionId}/${studentId}`)
  const snap = await get(r)
  if (snap.exists()) {
    // Returning participant — only refresh identity fields, preserve score
    await update(r, { nickname, joinedAt: Date.now() })
  } else {
    // First join
    await set(r, { nickname, joinedAt: Date.now(), totalScore: 0 })
  }
}

/** Increment a participant's totalScore atomically. */
export async function incrementScore(sessionId, studentId, pointsEarned) {
  const r = ref(db, `participants/${sessionId}/${studentId}/totalScore`)
  await runTransaction(r, current => (current ?? 0) + pointsEarned)
}

/**
 * Bulk-update scores for all students after a question reveal.
 * responses = { [studentId]: { pointsEarned, ... } }
 */
export async function applyRoundScores(sessionId, responses) {
  await Promise.all(
    Object.entries(responses)
      .filter(([, r]) => r.pointsEarned > 0)
      .map(([studentId, r]) => incrementScore(sessionId, studentId, r.pointsEarned))
  )
}

/** Get all participants for a session, sorted by totalScore desc. */
export async function getLeaderboard(sessionId) {
  const snap = await get(ref(db, `participants/${sessionId}`))
  if (!snap.exists()) return []
  return toSortedLeaderboard(snap.val())
}

/** Subscribe to the live leaderboard. Returns unsubscribe fn. */
export function onLeaderboardChange(sessionId, callback) {
  return onValue(ref(db, `participants/${sessionId}`), snap => {
    callback(snap.exists() ? toSortedLeaderboard(snap.val()) : [])
  })
}

function toSortedLeaderboard(val) {
  return Object.entries(val)
    .map(([studentId, data]) => ({ studentId, ...data }))
    .sort((a, b) => b.totalScore - a.totalScore)
}
