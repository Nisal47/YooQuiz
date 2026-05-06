import { useState }         from 'react'
import { useSession }        from '../../hooks/useSession'
import { useActivities }     from '../../hooks/useActivity'
import { useLeaderboard }    from '../../hooks/useLeaderboard'
import { useResponses }      from '../../hooks/useResponses'
import { ActivitySummary }   from './TeamVoteFinalScreen'

const MEDALS = ['🥇', '🥈', '🥉']

// ─── Quiz: per-question response breakdown ─────────────────────────────────

function QuestionReviewCard({ activity, index }) {
  const { responses } = useResponses(activity.activityId)

  const counts = activity.options.map((_, i) =>
    Object.values(responses).filter(r => r.value === i).length
  )
  const total  = Object.keys(responses).length
  const maxCnt = Math.max(...counts, 1)
  const correct = counts[activity.correctIndex] ?? 0

  return (
    <div className="card p-5 space-y-3">
      {/* Question text */}
      <div className="flex items-start gap-3">
        <span className="font-orbitron text-xs text-text-secondary flex-shrink-0 pt-0.5 w-8">
          Q{index + 1}
        </span>
        <p className="font-semibold text-white leading-snug">{activity.question}</p>
      </div>

      {/* Options with response bars */}
      <div className="space-y-1.5 pl-11">
        {activity.options.map((opt, i) => {
          const cnt     = counts[i]
          const isRight = i === activity.correctIndex
          const pct     = total > 0 ? Math.round((cnt / total) * 100) : 0
          return (
            <div
              key={i}
              className={`relative rounded-xl overflow-hidden border transition-colors
                ${isRight ? 'border-secondary/40' : 'border-white/8'}`}
            >
              {/* Background fill bar */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-700
                  ${isRight ? 'bg-secondary/20' : 'bg-white/5'}`}
                style={{ width: `${(cnt / maxCnt) * 100}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  {isRight && (
                    <span className="text-secondary text-xs font-bold leading-none">✓</span>
                  )}
                  <span className={`text-sm ${isRight ? 'text-secondary font-semibold' : 'text-white/80'}`}>
                    {opt}
                  </span>
                </div>
                <span className="text-xs text-text-secondary flex-shrink-0 ml-3">
                  {cnt} ({pct}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary stat */}
      <p className="text-xs text-text-secondary text-right">
        {correct} / {total} answered correctly
        {total > 0 && ` · ${Math.round((correct / total) * 100)}% accuracy`}
      </p>
    </div>
  )
}

// ─── Quiz full-session review ──────────────────────────────────────────────

function QuizReview({ session, activities, leaderboard, dateStr, onBack, onReuse, reusingMsg }) {
  return (
    <div className="min-h-screen dot-grid p-6 flex flex-col items-center">
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-text-secondary text-xs mb-1">{dateStr}</p>
            <h1 className="font-orbitron font-black text-2xl">
              <span className="text-primary text-glow-primary">Quiz</span>
              <span className="text-secondary text-glow-secondary">Blast</span>
              <span className="text-text-secondary text-base font-normal ml-3">#{session?.code}</span>
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {activities.length} question{activities.length !== 1 ? 's' : ''}
              {leaderboard.length > 0 && ` · ${leaderboard.length} participant${leaderboard.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onBack} className="btn-ghost py-2 px-4 text-sm flex-shrink-0">
            ← Back
          </button>
        </div>

        {/* Final leaderboard */}
        {leaderboard.length > 0 && (
          <div className="card p-5">
            <h2 className="font-orbitron text-xs uppercase tracking-widest text-text-secondary mb-4">
              Final Leaderboard
            </h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((p, i) => (
                <div key={p.studentId} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {MEDALS[i] ?? (
                      <span className="font-orbitron text-xs text-text-secondary">#{i + 1}</span>
                    )}
                  </span>
                  <span className="flex-1 text-white text-sm font-semibold truncate">
                    {p.nickname}
                  </span>
                  <span className="font-orbitron text-sm text-warning flex-shrink-0">
                    {p.totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-question breakdown */}
        <div>
          <h2 className="font-orbitron text-xs uppercase tracking-widest text-text-secondary mb-4">
            Questions
          </h2>
          <div className="space-y-4">
            {activities.map((act, i) => (
              <QuestionReviewCard key={act.activityId} activity={act} index={i} />
            ))}
          </div>
        </div>

        {/* Reuse button */}
        <div className="pb-6">
          <button
            onClick={onReuse}
            disabled={!!reusingMsg}
            className="btn-primary w-full font-orbitron py-3"
          >
            {reusingMsg || '♻ Reuse This Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VoteBlast full-session review ────────────────────────────────────────

function VoteReview({ session, activities, dateStr, onBack, onReuse, reusingMsg }) {
  return (
    <div className="min-h-screen dot-grid p-6 flex flex-col items-center">
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-warning/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-text-secondary text-xs mb-1">{dateStr}</p>
            <h1 className="font-orbitron font-black text-2xl">
              <span className="text-[#FF6B6B]" style={{ textShadow: '0 0 22px rgba(255,107,107,0.5)' }}>Vote</span>
              <span className="text-warning"    style={{ textShadow: '0 0 22px rgba(255,214,10,0.5)' }}>Blast</span>
              <span className="text-text-secondary text-base font-normal ml-3">#{session?.code}</span>
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {activities.length} evaluation{activities.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onBack} className="btn-ghost py-2 px-4 text-sm flex-shrink-0">
            ← Back
          </button>
        </div>

        {/* Per-evaluation summaries (reuses ActivitySummary from TeamVoteFinalScreen) */}
        <div className="space-y-10">
          {activities.map(activity => (
            <ActivitySummary key={activity.activityId} activity={activity} />
          ))}
          {activities.length === 0 && (
            <div className="card p-8 text-center text-text-secondary">
              No evaluation activities found.
            </div>
          )}
        </div>

        {/* Reuse button */}
        <div className="pb-6">
          <button
            onClick={onReuse}
            disabled={!!reusingMsg}
            className="btn-primary w-full font-orbitron py-3"
          >
            {reusingMsg || '♻ Reuse This Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Root component ────────────────────────────────────────────────────────

/**
 * Full-screen read-only review of a past session (quiz or VoteBlast).
 * Auto-detects session type from the first activity.
 *
 * Props:
 *  sessionId  – the ended session to review
 *  onBack     – () => void  — return to history list
 *  onReuse    – (sessionId) => Promise<void>  — clone into new session
 */
export default function SessionReview({ sessionId, onBack, onReuse }) {
  const { session, loading: loadingSession } = useSession(sessionId)
  const { activities, loading: loadingActs } = useActivities(sessionId)
  const leaderboard                          = useLeaderboard(sessionId)
  const [reusingMsg, setReusingMsg]          = useState('')

  if (loadingSession || loadingActs) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center">
        <p className="font-orbitron text-primary text-lg animate-pulse">Loading session…</p>
      </div>
    )
  }

  const type    = activities[0]?.type
  const dateStr = session?.createdAt
    ? new Date(session.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—'

  async function handleReuse() {
    setReusingMsg('Creating session…')
    try {
      await onReuse(sessionId)
    } finally {
      setReusingMsg('')
    }
  }

  if (type === 'quiz') {
    return (
      <QuizReview
        session={session}
        activities={activities}
        leaderboard={leaderboard}
        dateStr={dateStr}
        onBack={onBack}
        onReuse={handleReuse}
        reusingMsg={reusingMsg}
      />
    )
  }

  if (type === 'team_evaluation') {
    return (
      <VoteReview
        session={session}
        activities={activities}
        dateStr={dateStr}
        onBack={onBack}
        onReuse={handleReuse}
        reusingMsg={reusingMsg}
      />
    )
  }

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-text-secondary">No activities found for this session.</p>
        <button onClick={onBack} className="btn-ghost">← Back</button>
      </div>
    </div>
  )
}
