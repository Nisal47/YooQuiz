import { useNavigate }    from 'react-router-dom'
import { useAllTeamVotes } from '../../hooks/useTeamVotes'
import {
  calculateTeamScores,
  rankTeams,
  countTotalVotes,
} from '../../utils/teamEvalScoring'

const MEDALS      = ['🥇', '🥈', '🥉']
const PODIUM_GLOW = [
  'border-warning/40  bg-warning/8  text-warning',
  'border-white/20    bg-white/4    text-white/80',
  'border-[#CD7F32]/30 bg-[#CD7F32]/6 text-[#CD7F32]',
]

/**
 * Student-facing final screen shown when a VoteBlast session ends.
 * Shows team rankings for the last evaluated activity + a home button.
 *
 * Props:
 *  activity – the last (or only) team_evaluation activity (from cachedActivity)
 */
export default function TeamVoteFinalStudent({ activity }) {
  const navigate = useNavigate()

  const { allVotes }  = useAllTeamVotes(activity?.activityId)
  const { settings }  = activity ?? {}
  const { teams = [], scale = 5 } = settings ?? {}

  const teamScores = calculateTeamScores(allVotes)
  const ranked     = rankTeams(teamScores, teams)
  const totalVotes = countTotalVotes(allVotes)

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-8">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-warning/8 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/3 right-1/4 w-64 h-64 bg-[#FF6B6B]/6 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-1">🏆</div>
          <h1 className="font-orbitron font-black text-3xl">
            <span
              className="text-[#FF6B6B]"
              style={{ textShadow: '0 0 22px rgba(255,107,107,0.55)' }}
            >Vote</span>
            <span
              className="text-warning"
              style={{ textShadow: '0 0 22px rgba(255,214,10,0.55)' }}
            >Blast</span>
          </h1>
          <p className="text-white font-semibold text-lg">Evaluation Complete!</p>
          {activity?.title && (
            <p className="text-text-secondary text-sm">{activity.title}</p>
          )}
        </div>

        {/* Team rankings */}
        <div className="space-y-3">
          {ranked.map((team, i) => (
            <div
              key={team.id}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border animate-slide-up
                ${i < 3 ? PODIUM_GLOW[i] : 'border-white/5 bg-surface text-white'}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-2xl flex-shrink-0 w-8 text-center">
                {MEDALS[i] ?? (
                  <span className="font-orbitron text-sm text-text-secondary">#{i + 1}</span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{team.name}</p>
                <p className="text-xs text-text-secondary opacity-70">
                  {team.count ?? 0} vote{team.count !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="font-orbitron font-bold text-lg flex-shrink-0">
                {team.average.toFixed(1)}
                <span className="text-xs font-normal opacity-50">/{scale}</span>
              </span>
            </div>
          ))}

          {ranked.length === 0 && (
            <div className="card p-6 text-center text-text-secondary text-sm">
              No vote data available.
            </div>
          )}
        </div>

        {/* Total votes note */}
        <p className="text-center text-text-secondary text-xs">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast · thanks for participating! 🎉
        </p>

        {/* Home button */}
        <button onClick={() => navigate('/')} className="btn-ghost w-full py-3 font-orbitron">
          ← Home
        </button>
      </div>
    </div>
  )
}
