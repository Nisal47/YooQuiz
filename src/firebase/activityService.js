import {
  ref, set, get, update, remove, push, onValue,
  query, orderByChild, equalTo, serverTimestamp,
} from 'firebase/database'
import { db } from './config'

/** Create a quiz (MCQ) activity for a session and return the activityId. */
export async function createActivity(sessionId, question) {
  const actRef     = push(ref(db, 'activities'))
  const activityId = actRef.key
  await set(actRef, {
    sessionId,
    type:         'quiz',
    question:     question.question,
    options:      question.options,
    correctIndex: question.correctIndex,
    timeLimit:    question.timeLimit ?? 30,
    status:       'pending',
    order:        question.order ?? 0,
    startedAt:    null,
  })
  return activityId
}

/**
 * Create a team_evaluation activity for a session and return the activityId.
 *
 * @param {string} sessionId
 * @param {{ title, settings, currentTeamIndex, order }} data
 */
export async function createTeamEvalActivity(sessionId, data) {
  const actRef     = push(ref(db, 'activities'))
  const activityId = actRef.key
  await set(actRef, {
    sessionId,
    type:             'team_evaluation',
    title:            data.title,
    settings:         data.settings,
    currentTeamIndex: data.currentTeamIndex ?? 0,
    status:           'pending',
    order:            data.order ?? 0,
    startedAt:        null,
  })
  return activityId
}

/** Overwrite an existing activity's editable fields. */
export async function updateActivity(activityId, data) {
  await update(ref(db, `activities/${activityId}`), data)
}

/** Remove an activity. */
export async function deleteActivity(activityId) {
  await remove(ref(db, `activities/${activityId}`))
}

/** Set activity status → 'active' and record server start time. */
export async function launchActivity(activityId) {
  await update(ref(db, `activities/${activityId}`), {
    status:    'active',
    startedAt: serverTimestamp(),
  })
}

/** Set activity status → 'closed'. */
export async function closeActivity(activityId) {
  await update(ref(db, `activities/${activityId}`), { status: 'closed' })
}

/** Get a single activity once. */
export async function getActivity(activityId) {
  const snap = await get(ref(db, `activities/${activityId}`))
  return snap.exists() ? { activityId, ...snap.val() } : null
}

/** Get all activities for a session, sorted by order. */
export async function getActivities(sessionId) {
  const q    = query(ref(db, 'activities'), orderByChild('sessionId'), equalTo(sessionId))
  const snap = await get(q)
  if (!snap.exists()) return []
  return Object.entries(snap.val())
    .map(([activityId, data]) => ({ activityId, ...data }))
    .sort((a, b) => a.order - b.order)
}

/** Subscribe to all activities for a session. Returns unsubscribe fn. */
export function onActivitiesChange(sessionId, callback) {
  const q = query(ref(db, 'activities'), orderByChild('sessionId'), equalTo(sessionId))
  return onValue(q, snap => {
    if (!snap.exists()) { callback([]); return }
    const list = Object.entries(snap.val())
      .map(([activityId, data]) => ({ activityId, ...data }))
      .sort((a, b) => a.order - b.order)
    callback(list)
  })
}

/** Subscribe to a single activity. Returns unsubscribe fn. */
export function onActivityChange(activityId, callback) {
  return onValue(ref(db, `activities/${activityId}`), snap => {
    callback(snap.exists() ? { activityId, ...snap.val() } : null)
  })
}
