/**
 * Calculate points earned for a correct answer.
 * Returns 0 for wrong answers; 500–1000 for correct answers based on speed.
 *
 * @param {boolean} isCorrect
 * @param {number}  timeRemaining  seconds remaining when the student submitted
 * @param {number}  totalTime      total time limit for the question in seconds
 * @returns {number} integer points earned
 */
export function calcPoints(isCorrect, timeRemaining, totalTime) {
  if (!isCorrect) return 0
  const clamped = Math.max(0, Math.min(timeRemaining, totalTime))
  return Math.round(500 + 500 * (clamped / totalTime))
}

/**
 * Compute timeRemaining given when the activity started and the time limit.
 * Returns the remaining seconds (≥ 0).
 *
 * @param {number} startedAt  epoch ms (server timestamp read from Firebase)
 * @param {number} timeLimit  total seconds
 * @returns {number}
 */
export function getTimeRemaining(startedAt, timeLimit) {
  const elapsed = (Date.now() - startedAt) / 1000
  return Math.max(0, timeLimit - elapsed)
}
