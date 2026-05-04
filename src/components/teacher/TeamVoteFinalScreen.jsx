import { useAllTeamVotes }          from '../../hooks/useTeamVotes'
import {
  calculateTeamScores,
  calculateCriteriaAverages,
  rankTeams,
  getBestTeamPerCriterion,
  countTotalVotes,
} from '../../utils/teamEvalScoring'

const MEDALS      = ['🥇', '🥈', '🥉']
const BAR_COLORS  = ['bg-warning', 'bg-white/40', 'bg-[#CD7F32]/70']
const RANK_COLORS = ['text-warning', 'text-white/70', 'text-[#CD7F32]']

/**
 * Per-activity results block — uses its own hook so each activity
 * can independently subscribe to /teamVotes/{activityId}.
 */
function ActivitySummary({ activity }) {
  const { allVotes }      = useAllTeamVotes(activity.activityId)
  const { settings }      = activity
  const { teams = [], criteria = [], scale = 5 } = settings ?? {}

  const teamScores        = calculateTeamScores(allVotes)
  const criteriaAverages  = calculateCriteriaAverages(allVotes)
  const ranked            = rankTeams(teamScores, teams)
  const bestPerCriterion  = getBestTeamPerCriterion(criteriaAverages, teams)
  const totalVotes        = countTotalVotes(allVotes)

  return (
    <div className="space-y-4">
      {/* Activity title row */}
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-base font-bold text-white">{activity.title}</h2>
        <span className="text-xs text-text-secondary">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {teams.length} teams
        </span>
      </div>

      {/* Rankings with score bars */}
      <div className="card p-5 space-y-3">
        {ranked.map((team, i) => (
          <div key={team.id} className="flex items-center gap-3">
            <span className="text-xl w-8 text-center flex-shrink-0">
              {MEDALS[i] ?? (
                <span className="font-orbitron text-xs text-text-secondary">#{i + 1}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold text-sm ${i < 3 ? RANK_COLORS[i] : 'text-white'}`}>
                  {team.name}
                </span>
                <span className="font-orbitron text-xs text-text-secondary flex-shrink-0 ml-2">
                  {team.average.toFixed(2)}
                  <span className="opacity-50">/{scale}</span>
                  <span className="ml-1.5 opacity-50">({team.count ?? 0})</span>
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[i] ?? 'bg-primary/40'}`}
                  style={{ width: `${(team.average / scale) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {ranked.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-3">No votes collected.</p>
        )}
      </div>

      {/* Per-criteria breakdown */}
      {criteria.length > 0 && teams.length > 0 && (
        <div className="card p-5">
          <h3 className="font-orbitron text-xs uppercase tracking-widest text-text-secondary mb-4">
            Criteria Breakdown
          </h3>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm min-w-[340px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 font-semibold text-text-secondary text-xs">Criterion</th>
                  {teams.map(t => (
                    <th key={t.id} className="text-center py-2 px-2 font-semibold text-text-secondary text-xs whitespace-nowrap">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map(crit => {
                  const best = bestPerCriterion[crit]
                  return (
                    <tr key={crit} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 font-medium text-white text-sm">{crit}</td>
                      {teams.map(t => {
                        const avg    = criteriaAverages[t.id]?.[crit]
                        const isBest = best?.team.id === t.id && avg != null
                        return (
                          <td key={t.id} className="text-center py-2.5 px-2">
                            <span className={`font-orbitron font-bold text-sm ${isBest ? 'text-secondary' : 'text-text-secondary'}`}>
                              {avg != null ? avg.toFixed(1) : '—'}
                            </span>
                            {isBest && <span className="ml-0.5 text-xs">⭐</span>}
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

      {/* Best-in-category badges */}
      {Object.keys(bestPerCriterion).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(bestPerCriterion).map(([crit, { team, score }]) => (
            <div
              key={crit}
              className="bg-surface border border-secondary/20 rounded-xl px-3 py-2.5 hover:border-secondary/40 transition-colors"
            >
              <p className="text-xs text-text-secondary mb-0.5">⭐ {crit}</p>
              <p className="font-semibold text-secondary text-sm truncate">{team.name}</p>
              <p className="text-xs text-text-secondary opacity-60">{score.toFixed(1)}/{scale} avg</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Teacher-facing final summary screen for a VoteBlast session.
 * Shown after the teacher ends the session.
 *
 * Props:
 *  activities   – all team_evaluation activities in the session
 *  onNewSession – callback to start a fresh session
 *  onBack       – callback to go back to VoteBlast landing
 */
export default function TeamVoteFinalScreen({ activities, onNewSession, onBack }) {
  return (
    <div className="min-h-screen dot-grid p-6 flex flex-col items-center">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-warning/6 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-64 h-64 bg-[#FF6B6B]/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="font-orbitron font-black text-4xl mb-2">
            <span className="text-[#FF6B6B]" style={{ textShadow: '0 0 28px rgba(255,107,107,0.5)' }}>Vote</span>
            <span className="text-warning"   style={{ textShadow: '0 0 28px rgba(255,214,10,0.5)' }}>Blast</span>
          </h1>
          <p className="text-text-secondary text-lg">Session Complete</p>
        </div>

        {/* One summary block per activity */}
        <div className="space-y-10 mb-10">
          {activities.map(activity => (
            <ActivitySummary key={activity.activityId} activity={activity} />
          ))}

          {activities.length === 0 && (
            <div className="card p-8 text-center text-text-secondary">
              No evaluation activities were run.
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center pb-6">
          <button onClick={onNewSession} className="btn-primary font-orbitron py-3 px-8">
            New Session
          </button>
          <button onClick={onBack} className="btn-ghost py-3 px-6">
            ← VoteBlast
          </button>
        </div>
      </div>
    </div>
  )
}
