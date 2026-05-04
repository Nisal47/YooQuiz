import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useNavigate } from 'react-router-dom'

export default function FinalScreen({ sessionId, studentId }) {
  const navigate  = useNavigate()
  const board     = useLeaderboard(sessionId)
  const top3      = board.slice(0, 3)
  const myRank    = board.findIndex(e => e.studentId === studentId) + 1
  const myEntry   = board.find(e => e.studentId === studentId)

  // Podium heights: 1st tallest, 2nd, 3rd shortest
  const podiumHeights = ['h-32', 'h-24', 'h-16']
  const podiumOrder   = [1, 0, 2] // visual order: 2nd, 1st, 3rd
  const podiumColors  = ['#FFD60A', '#C0C0C0', '#CD7F32'] // gold, silver, bronze

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-8">
      {/* Ambient */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-warning/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm space-y-8 animate-fade-in">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-orbitron font-black text-3xl text-warning text-glow-warning mb-1">
            Quiz Over!
          </h1>
          <p className="text-text-secondary text-sm">Final Results</p>
        </div>

        {/* Podium */}
        {top3.length >= 2 && (
          <div className="flex items-end justify-center gap-2 h-48">
            {podiumOrder.map(rank => {
              const entry = top3[rank]
              if (!entry) return <div key={rank} className="w-24" />
              const isMe  = entry.studentId === studentId
              return (
                <div key={rank} className="flex flex-col items-center gap-2 w-24">
                  {/* Avatar/emoji */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                      border-2 ${isMe ? 'border-secondary' : 'border-white/20'}`}
                    style={{ backgroundColor: podiumColors[rank] + '30' }}
                  >
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
                  </div>
                  <span className={`text-xs font-semibold text-center truncate w-full text-center
                    ${isMe ? 'text-secondary' : 'text-white'}`}>
                    {entry.nickname}
                  </span>
                  <span className="text-xs font-orbitron text-text-secondary">
                    {entry.totalScore.toLocaleString()}
                  </span>
                  {/* Podium bar */}
                  <div
                    className={`w-full rounded-t-lg podium-bar ${podiumHeights[rank]}`}
                    style={{
                      backgroundColor: podiumColors[rank] + '25',
                      border: `1px solid ${podiumColors[rank]}50`,
                      animationDelay: `${[0.2, 0, 0.4][rank]}s`,
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Full leaderboard (top 5) */}
        <div className="card p-4 space-y-2">
          <h3 className="font-orbitron text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Top Players
          </h3>
          {board.slice(0, 5).map((entry, i) => {
            const isMe = entry.studentId === studentId
            return (
              <div
                key={entry.studentId}
                className={`lb-row flex items-center gap-3 rounded-lg px-3 py-2.5
                  ${isMe ? 'bg-secondary/10 border border-secondary/30' : 'bg-surface'}`}
              >
                <span className="text-base w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className={`flex-1 text-sm truncate ${isMe ? 'text-secondary font-bold' : 'text-white'}`}>
                  {entry.nickname}
                </span>
                <span className="font-orbitron text-sm font-bold text-primary">
                  {entry.totalScore.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Your result */}
        {myEntry && (
          <div className="card p-5 text-center border border-primary/30">
            <p className="text-text-secondary text-sm mb-1">Your final score</p>
            <p className="font-orbitron font-black text-4xl text-primary text-glow-primary">
              {myEntry.totalScore.toLocaleString()}
            </p>
            <p className="text-text-secondary text-sm mt-2">
              You finished <span className="text-white font-semibold">#{myRank}</span>
              {myRank <= 3 && <span className="ml-1">{['🥇','🥈','🥉'][myRank - 1]}</span>}
            </p>
          </div>
        )}

        <button onClick={() => navigate('/')} className="btn-ghost w-full py-3">
          Play Again
        </button>
      </div>
    </div>
  )
}
