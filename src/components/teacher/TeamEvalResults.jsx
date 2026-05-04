import { useAllTeamVotes }          from '../../hooks/useTeamVotes'
import {
  calculateTeamScores,
  calculateCriteriaAverages,
  rankTeams,
  getBestTeamPerCriterion,
  countTotalVotes,
} from '../../utils/teamEvalScoring'

const MEDALS       = ['🥇', '🥈', '🥉']
const BAR_COLORS   = ['bg-warning', 'bg-white/40', 'bg-[#CD7F32]/80']
const MEDAL_COLORS = ['text-warning', 'text-white/70', 'text-[#CD7F32]']

/**
 * Post-activity results dashboard shown to the teacher.
 * Displays team rankings, per-criteria breakdown table, and best-in-category badges.
 *
 * Props:
 *  activity   – the closed team_evaluation activity document
 *  isLast     – true if this is the final activity in the session
 *  onNext()   – advance to next activity
 *  onEndQuiz()– end session and show final leaderboard
 */
export default function TeamEvalResults({ activity, isLast, onNext, onEndQuiz }) {
  const { allVotes }      = useAllTeamVotes(activity.activityId)
  const { settings }      = activity
  const { teams = [], criteria = [], scale = 5 } = settings ?? {}

  const teamScores        = calculateTeamScores(allVotes)
  const criteriaAverages  = calculateCriteriaAverages(allVotes)
  const ranked            = rankTeams(teamScores, teams)
  const bestPerCriterion  = getBestTeamPerCriterion(criteriaAverages, teams)
  const totalVotes        = countTotalVotes(allVotes)

  const maxAverage        = Math.max(...ranked.map(t => t.average), 0.001)

  return (
    <div className="min-h-screen dot-grid p-4 md:p-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-warning/6 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="font-orbitron text-2xl font-bold text-warning mb-1">
            {activity.title}
          </h1>
          <p className="text-text-secondary text-sm">
            Evaluation Results · {totalVotes} votes cast · {teams.length} teams
          </p>
        </div>

        {/* ── Overall Rankings ─────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-orbitron text-sm uppercase tracking-widest text-text-secondary mb-5">
            Overall Rankings
          </h2>
          <div className="space-y-4">
            {ranked.map((team, i) => (
              <div key={team.id} className="flex items-center gap-3 md:gap-4">
                {/* Medal / rank */}
                <span className="text-2xl w-8 text-center flex-shrink-0">
                  {MEDALS[i] ?? <span className="text-sm font-orbitron text-text-secondary">#{i + 1}</span>}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-semibold ${i < 3 ? MEDAL_COLORS[i] : 'text-white'}`}>
                      {team.name}
                    </span>
                    <span className="font-orbitron text-sm text-text-secondary flex-shrink-0 ml-2">
                      {team.average.toFixed(2)}
                      <span className="text-text-secondary/50">/{scale}</span>
                      <span className="text-xs ml-1.5 text-text-secondary/60">
                        ({team.count ?? 0} votes)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[i] ?? 'bg-primary/50'}`}
                      style={{ width: `${(team.average / scale) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {ranked.length === 0 && (
              <p className="text-text-secondary text-sm text-center py-4">
                No votes were collected.
              </p>
            )}
          </div>
        </div>

        {/* ── Per-Criteria Breakdown ────────────────────────────────────── */}
        {criteria.length > 0 && teams.length > 0 && (
          <div className="card p-6">
            <h2 className="font-orbitron text-sm uppercase tracking-widest text-text-secondary mb-5">
              Criteria Breakdown
            </h2>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-semibold text-text-secondary">Criterion</th>
                    {teams.map(t => (
                      <th
                        key={t.id}
                        className="text-center py-2 px-2 font-semibold text-text-secondary whitespace-nowrap"
                      >
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteria.map(crit => {
                    const best = bestPerCriterion[crit]
                    return (
                      <tr key={crit} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="py-3 pr-4 font-medium text-white">{crit}</td>
                        {teams.map(t => {
                          const avg    = criteriaAverages[t.id]?.[crit]
                          const isBest = best?.team.id === t.id && avg != null
                          return (
                            <td key={t.id} className="text-center py-3 px-2">
                              <span className={`font-orbitron font-bold text-base
                                ${isBest ? 'text-secondary' : 'text-text-secondary'}`}
                              >
                                {avg != null ? avg.toFixed(1) : '—'}
                              </span>
                              {isBest && (
                                <span className="ml-1 text-xs" title="Best in this criterion">⭐</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Best in Category ─────────────────────────────────────────── */}
        {Object.keys(bestPerCriterion).length > 0 && (
          <div className="card p-6">
            <h2 className="font-orbitron text-sm uppercase tracking-widest text-text-secondary mb-4">
              🏆 Best in Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(bestPerCriterion).map(([crit, { team, score }]) => (
                <div
                  key={crit}
                  className="bg-surface border border-secondary/25 rounded-xl px-4 py-3 hover:border-secondary/50 transition-colors"
                >
                  <p className="text-xs text-text-secondary mb-1">{crit}</p>
                  <p className="font-semibold text-secondary truncate">{team.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {score.toFixed(1)} / {scale} avg
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex gap-4 justify-center pb-8">
          {isLast ? (
            <button onClick={onEndQuiz} className="btn-primary font-orbitron py-3 px-10">
              End Session & Final Leaderboard
            </button>
          ) : (
            <>
              <button onClick={onNext} className="btn-primary font-orbitron py-3 px-10">
                Next Activity →
              </button>
              <button onClick={onEndQuiz} className="btn-ghost py-3 px-6 text-sm">
                End Session
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
