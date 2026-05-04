/**
 * Pure scoring functions for team_evaluation activities.
 * No Firebase or React imports — safe to unit-test in isolation.
 *
 * allVotes shape (from /teamVotes/{activityId}):
 * {
 *   [teamId]: {
 *     [studentId]: {
 *       ratings:    { [criterion]: number },
 *       totalScore: number,
 *     }
 *   }
 * }
 */

/**
 * Compute per-team aggregate scores.
 *
 * @param {Record<string, Record<string, { totalScore: number }>>} allVotes
 * @returns {Record<string, { total: number, count: number, average: number }>}
 */
export function calculateTeamScores(allVotes) {
  const result = {}
  for (const [teamId, votes] of Object.entries(allVotes)) {
    const voteList = Object.values(votes)
    const total    = voteList.reduce((s, v) => s + (v.totalScore ?? 0), 0)
    const count    = voteList.length
    result[teamId] = {
      total,
      count,
      average: count > 0 ? total / count : 0,
    }
  }
  return result
}

/**
 * Compute per-criterion average for each team.
 *
 * @param {Record<string, Record<string, { ratings: Record<string, number> }>>} allVotes
 * @returns {Record<string, Record<string, number>>}  { teamId: { criterion: avg } }
 */
export function calculateCriteriaAverages(allVotes) {
  const result = {}
  for (const [teamId, votes] of Object.entries(allVotes)) {
    const voteList = Object.values(votes)
    if (voteList.length === 0) { result[teamId] = {}; continue }

    const sums  = {}
    const counts = {}
    for (const vote of voteList) {
      for (const [criterion, val] of Object.entries(vote.ratings ?? {})) {
        sums[criterion]   = (sums[criterion]   ?? 0) + val
        counts[criterion] = (counts[criterion] ?? 0) + 1
      }
    }
    result[teamId] = Object.fromEntries(
      Object.entries(sums).map(([c, s]) => [c, s / counts[c]])
    )
  }
  return result
}

/**
 * Rank teams from highest average to lowest.
 * Merges team metadata with computed scores.
 *
 * @param {ReturnType<typeof calculateTeamScores>} teamScores
 * @param {{ id: string, name: string }[]} teams
 * @returns {{ id, name, total, count, average }[]}
 */
export function rankTeams(teamScores, teams) {
  return [...teams]
    .map(team => ({
      ...team,
      ...(teamScores[team.id] ?? { total: 0, count: 0, average: 0 }),
    }))
    .sort((a, b) => b.average - a.average)
}

/**
 * For each criterion, find which team scored highest on average.
 *
 * @param {ReturnType<typeof calculateCriteriaAverages>} criteriaAverages
 * @param {{ id: string, name: string }[]} teams
 * @returns {Record<string, { team: { id, name }, score: number }>}
 */
export function getBestTeamPerCriterion(criteriaAverages, teams) {
  const allCriteria = new Set(
    Object.values(criteriaAverages).flatMap(avgs => Object.keys(avgs))
  )

  const result = {}
  for (const criterion of allCriteria) {
    let bestTeam  = null
    let bestScore = -Infinity
    for (const team of teams) {
      const score = criteriaAverages[team.id]?.[criterion] ?? 0
      if (score > bestScore) { bestScore = score; bestTeam = team }
    }
    if (bestTeam) result[criterion] = { team: bestTeam, score: bestScore }
  }
  return result
}

/**
 * Count total votes cast across all teams for an activity.
 * (Distinct per team — one student voting for 3 teams = 3 votes)
 */
export function countTotalVotes(allVotes) {
  return Object.values(allVotes).reduce(
    (sum, teamVotes) => sum + Object.keys(teamVotes).length,
    0
  )
}
