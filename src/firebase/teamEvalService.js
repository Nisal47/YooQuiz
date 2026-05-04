import { ref, set, get, update, onValue, serverTimestamp } from 'firebase/database'
import { db } from './config'

/**
 * Submit a student's vote for ONE team.
 * Path: /teamVotes/{activityId}/{teamId}/{studentId}
 * Write-once is enforced by Firebase security rules (!data.exists()).
 *
 * @param {string} activityId
 * @param {string} teamId
 * @param {string} studentId
 * @param {Record<string, number>} ratings  e.g. { "Clarity": 4, "Design": 5 }
 */
export async function submitTeamVote(activityId, teamId, studentId, ratings) {
  const totalScore = Object.values(ratings).reduce((sum, v) => sum + v, 0)
  await set(ref(db, `teamVotes/${activityId}/${teamId}/${studentId}`), {
    ratings,
    totalScore,
    submittedAt: serverTimestamp(),
  })
}

/**
 * Check whether a student has already voted for a specific team.
 * Used by the student client to skip already-voted teams on page refresh.
 */
export async function hasVotedForTeam(activityId, teamId, studentId) {
  const snap = await get(ref(db, `teamVotes/${activityId}/${teamId}/${studentId}`))
  return snap.exists()
}

/**
 * Subscribe to all votes for ONE team in real-time.
 * Useful for the teacher's live participation count.
 * Returns unsubscribe fn.
 *
 * @param {(votes: Record<studentId, VoteData>) => void} callback
 */
export function onTeamVotesChange(activityId, teamId, callback) {
  return onValue(ref(db, `teamVotes/${activityId}/${teamId}`), snap => {
    callback(snap.exists() ? snap.val() : {})
  })
}

/**
 * Subscribe to ALL votes across ALL teams for an activity.
 * Useful for the results dashboard.
 * Returns unsubscribe fn.
 *
 * @param {(allVotes: Record<teamId, Record<studentId, VoteData>>) => void} callback
 */
export function onAllTeamVotesChange(activityId, callback) {
  return onValue(ref(db, `teamVotes/${activityId}`), snap => {
    callback(snap.exists() ? snap.val() : {})
  })
}

/**
 * Advance the active team by updating currentTeamIndex on the activity document.
 * Triggers onValue listeners on all subscribed clients immediately.
 */
export async function advanceTeam(activityId, newIndex) {
  await update(ref(db, `activities/${activityId}`), { currentTeamIndex: newIndex })
}
