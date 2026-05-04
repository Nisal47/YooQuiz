import { useLeaderboard } from '../../hooks/useLeaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardScreen({ sessionId, studentId }) {
  const board    = useLeaderboard(sessionId)
  const top      = board.slice(0, 5)
  const myRank   = board.findIndex(e => e.studentId === studentId) + 1
  const myEntry  = board.find(e => e.studentId === studentId)

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        <h2 className="font-orbitron text-2xl font-bold text-center text-glow-primary text-primary mb-2">
          Leaderboard
        </h2>

        {/* Top 5 */}
        <div className="space-y-2">
          {top.map((entry, i) => {
            const isMe = entry.studentId === studentId
            return (
              <div
                key={entry.studentId}
                className={`lb-row flex items-center gap-3 rounded-xl px-4 py-3 border
                  ${isMe
                    ? 'border-secondary bg-secondary/10'
                    : i === 0
                      ? 'border-warning/40 bg-warning/5'
                      : 'border-white/8 bg-surface'}`}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="font-orbitron text-sm text-text-secondary">{i + 1}</span>}
                </span>
                <span className={`flex-1 font-medium truncate ${isMe ? 'text-secondary font-bold' : 'text-white'}`}>
                  {entry.nickname}
                  {isMe && <span className="text-xs ml-2 opacity-70">(you)</span>}
                </span>
                <span className={`font-orbitron font-bold ${i === 0 ? 'text-warning' : 'text-primary'}`}>
                  {entry.totalScore.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>

        {/* My position if outside top 5 */}
        {myRank > 5 && myEntry && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 border border-secondary/40 bg-secondary/8">
              <span className="font-orbitron text-sm text-text-secondary w-8 text-center">{myRank}</span>
              <span className="flex-1 font-medium text-secondary truncate">
                {myEntry.nickname} <span className="text-xs opacity-70">(you)</span>
              </span>
              <span className="font-orbitron font-bold text-primary">{myEntry.totalScore.toLocaleString()}</span>
            </div>
          </div>
        )}

        <p className="text-text-secondary text-sm text-center animate-pulse-slow">
          Waiting for next question…
        </p>
      </div>
    </div>
  )
}
