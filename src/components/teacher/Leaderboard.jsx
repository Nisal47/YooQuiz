import { useLeaderboard } from '../../hooks/useLeaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard({ sessionId, limit = 5, highlightId }) {
  const board = useLeaderboard(sessionId)
  const top   = board.slice(0, limit)

  if (top.length === 0) {
    return (
      <div className="text-text-secondary text-sm text-center py-4">
        No scores yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {top.map((entry, i) => {
        const isHighlighted = entry.studentId === highlightId
        return (
          <div
            key={entry.studentId}
            className={`lb-row flex items-center gap-3 rounded-xl px-4 py-3 border transition-all
              ${isHighlighted
                ? 'border-secondary bg-secondary/10'
                : i === 0
                  ? 'border-warning/40 bg-warning/5'
                  : 'border-white/5 bg-surface'}`}
          >
            <span className="text-xl w-8 text-center flex-shrink-0">
              {i < 3 ? MEDALS[i] : <span className="text-text-secondary font-orbitron text-sm">{i + 1}</span>}
            </span>
            <span className={`flex-1 font-medium truncate ${isHighlighted ? 'text-secondary' : 'text-white'}`}>
              {entry.nickname}
            </span>
            <span className={`font-orbitron font-bold ${i === 0 ? 'text-warning text-glow-warning' : 'text-primary'}`}>
              {entry.totalScore.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
