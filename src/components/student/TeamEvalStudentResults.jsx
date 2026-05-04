import { useAllTeamVotes }       from '../../hooks/useTeamVotes'
import { calculateTeamScores, rankTeams } from '../../utils/teamEvalScoring'

const MEDALS      = ['🥇', '🥈', '🥉']
const PODIUM_GLOW = [
  'text-warning  border-warning/40  bg-warning/8',
  'text-white/70 border-white/20    bg-white/4',
  'text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/6',
]

/**
 * Student-facing result screen shown after a team_evaluation activity closes.
 * Displays a simple ranked leaderboard so students can see who won.
 *
 * This component is rendered by StudentPage when:
 *   view === 'result' && cachedActivity.type === 'team_evaluation'
 *
 * After ~3.5s, StudentPage automatically transitions to 'leaderboard'.
 *
 * Props:
 *  activity – the closed team_evaluation activity document
 */
export default function TeamEvalStudentResults({ activity }) {
  const { allVotes }  = useAllTeamVotes(activity.activityId)
  const { settings }  = activity
  const { teams = [], scale = 5 } = settings ?? {}

  const teamScores = calculateTeamScores(allVotes)
  const ranked     = rankTeams(teamScores, teams)

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-warning/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="font-orbitron text-2xl font-black text-warning mb-1">
            Results
          </h1>
          <p className="text-text-secondary text-sm">{activity.title}</p>
        </div>

        {/* Team rankings */}
        <div className="space-y-3">
          {ranked.map((team, i) => (
            <div
              key={team.id}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all animate-slide-up
                ${i < 3 ? PODIUM_GLOW[i] : 'border-white/5 bg-surface'}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-2xl flex-shrink-0 w-8 text-center">
                {MEDALS[i] ?? <span className="font-orbitron text-sm text-text-secondary">#{i + 1}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${i < 3 ? '' : 'text-text-secondary'}`}>
                  {team.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {team.count ?? 0} vote{team.count !== 1 ? 's' : ''}
                </p>
              </div>
              <span className={`font-orbitron font-bold text-lg flex-shrink-0
                ${i === 0 ? 'text-warning' : 'text-text-secondary'}`}>
                {team.average.toFixed(1)}
                <span className="text-xs font-normal opacity-60">/{scale}</span>
              </span>
            </div>
          ))}

          {ranked.length === 0 && (
            <div className="text-center text-text-secondary py-6">
              <p>No votes collected.</p>
            </div>
          )}
        </div>

        <p className="text-center text-text-secondary text-xs animate-pulse">
          Heading to leaderboard…
        </p>
      </div>
    </div>
  )
}
