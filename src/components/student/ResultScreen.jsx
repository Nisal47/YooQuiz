import { useEffect, useState } from 'react'
import ScorePop from '../shared/ScorePop'

const OPT_LABELS = ['A', 'B', 'C', 'D']
const OPT_COLORS = ['#6C63FF', '#00F5D4', '#FF6B6B', '#FFD60A']

export default function ResultScreen({ activity, lastAnswer, totalScore, revealed }) {
  const [flashKey, setFlashKey] = useState(0)

  const { selectedIndex, pointsEarned, isCorrect } = lastAnswer ?? {}
  const noAnswer = selectedIndex === -1 || selectedIndex === undefined

  // Trigger flash when revealed
  useEffect(() => {
    if (revealed) setFlashKey(k => k + 1)
  }, [revealed])

  if (!revealed) {
    return (
      <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in space-y-4">
          <div className="text-5xl">🔒</div>
          <p className="font-orbitron text-xl font-bold">Answer locked in!</p>
          <p className="text-text-secondary animate-pulse-slow">Waiting for teacher to reveal…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      key={flashKey}
      className={`min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center
        ${isCorrect && !noAnswer ? 'flash-correct' : !isCorrect ? 'flash-wrong' : ''}`}
    >
      {/* Score pop animation */}
      <ScorePop key={flashKey} points={pointsEarned ?? 0} show={revealed && !noAnswer && isCorrect} />

      <div className="relative z-10 w-full max-w-sm space-y-6 animate-pop">
        {/* Correct/Wrong badge */}
        <div className="flex flex-col items-center gap-2">
          {noAnswer ? (
            <>
              <div className="text-6xl">⏱</div>
              <p className="font-orbitron text-2xl font-black text-warning">Time's up!</p>
            </>
          ) : isCorrect ? (
            <>
              <div className="text-6xl animate-bounce-in">✅</div>
              <p className="font-orbitron text-3xl font-black text-secondary text-glow-secondary">
                Correct!
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl animate-bounce-in">❌</div>
              <p className="font-orbitron text-3xl font-black text-danger">Wrong</p>
            </>
          )}
        </div>

        {/* Correct answer reveal */}
        <div className="card p-4">
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Correct answer</p>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 border border-secondary bg-secondary/10"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center font-orbitron font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: OPT_COLORS[activity.correctIndex], color: '#0A0A0F' }}
            >
              {OPT_LABELS[activity.correctIndex]}
            </span>
            <span className="text-white font-medium text-left">
              {activity.options[activity.correctIndex]}
            </span>
          </div>
        </div>

        {/* Score this round */}
        {!noAnswer && (
          <div className="card p-4">
            <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Points this round</p>
            <p className={`font-orbitron font-black text-4xl ${isCorrect ? 'text-secondary text-glow-secondary' : 'text-text-secondary'}`}>
              {isCorrect ? `+${pointsEarned}` : '+0'}
            </p>
          </div>
        )}

        {/* Total score */}
        <div>
          <p className="text-text-secondary text-sm">Total score</p>
          <p className="font-orbitron font-black text-3xl text-primary text-glow-primary">
            {totalScore?.toLocaleString() ?? 0}
          </p>
        </div>

        <p className="text-text-secondary text-sm animate-pulse-slow">
          Viewing leaderboard…
        </p>
      </div>
    </div>
  )
}
