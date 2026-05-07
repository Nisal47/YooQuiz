import { useState, useEffect } from 'react'
import { useResponses } from '../../hooks/useResponses'
import LiveResultsChart from './LiveResultsChart'
import Leaderboard from './Leaderboard'
import ParticipantCount from '../shared/ParticipantCount'
import { applyRoundScores } from '../../firebase/scoreService'
import { closeActivity } from '../../firebase/activityService'
import { calcPoints } from '../../utils/scoreCalc'

const OPT_LABELS = ['A', 'B', 'C', 'D']

export default function QuestionController({
  activity,
  sessionId,
  participantCount,
  questionIndex,
  totalQuestions,
  onReveal,
  onNext,
  onEndQuiz,
}) {
  const { responses, count } = useResponses(activity?.activityId)
  const [revealed,  setRevealed]  = useState(false)
  const [scoring,   setScoring]   = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(activity?.timeLimit ?? 30)

  // Reset state when activity changes
  useEffect(() => {
    setRevealed(false)
    setScoring(false)
    setTimeLeft(activity?.timeLimit ?? 30)
  }, [activity?.activityId])

  // Live countdown (display only — truth is on student side)
  useEffect(() => {
    if (!activity?.startedAt || activity.status !== 'active' || revealed) return
    const tick = () => {
      const elapsed = (Date.now() - activity.startedAt) / 1000
      setTimeLeft(Math.max(0, activity.timeLimit - elapsed))
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [activity?.startedAt, activity?.status, revealed, activity?.timeLimit])

  async function handleReveal() {
    setScoring(true)
    // Calculate scores for every response
    const updates = {}
    for (const [sid, resp] of Object.entries(responses)) {
      const correct = resp.value === activity.correctIndex
      const pts     = calcPoints(correct, resp.timeRemaining ?? 0, activity.timeLimit)
      updates[sid]  = { ...resp, pointsEarned: pts }
    }
    await applyRoundScores(sessionId, updates)
    // Close the activity — this is the signal students watch to show results
    await closeActivity(activity.activityId)
    setRevealed(true)
    setScoring(false)
    onReveal?.()
  }

  const isLast = questionIndex === totalQuestions - 1

  if (!activity) return null

  return (
    <div className="min-h-screen dot-grid p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="font-orbitron text-sm text-text-secondary">
            Q{questionIndex + 1} / {totalQuestions}
          </span>
          <ParticipantCount count={count} label={`/ ${participantCount} answered`} />
        </div>
        <div className="flex items-center gap-3">
          {/* Timer display */}
          <div className={`font-orbitron font-bold text-2xl transition-colors
            ${timeLeft > activity.timeLimit * 0.5 ? 'text-secondary' : timeLeft > activity.timeLimit * 0.25 ? 'text-warning' : 'text-danger'}`}>
            {Math.ceil(timeLeft)}s
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_320px] gap-6">
        {/* Left: question + chart + controls */}
        <div className="space-y-5">
          {/* Question */}
          <div className="card p-6">
            {activity.imageUrl && (
              <div className="mb-5 rounded-xl overflow-hidden border border-white/10">
                <img
                  src={activity.imageUrl}
                  alt=""
                  className="w-full max-h-48 object-contain bg-surface"
                  onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
                />
              </div>
            )}
            <p className="font-orbitron text-xl font-bold text-white leading-snug mb-6">
              {activity.question}
            </p>

            {/* Options (colour-coded, highlight correct on reveal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activity.options.map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all
                    ${revealed && i === activity.correctIndex
                      ? 'border-secondary bg-secondary/20'
                      : revealed
                        ? 'border-white/5 opacity-40'
                        : 'border-white/10 bg-surface'}`}
                >
                  <span className={`font-orbitron font-bold text-sm w-6
                    ${['text-primary','text-secondary','text-[#FF6B6B]','text-warning'][i]}`}>
                    {OPT_LABELS[i]}
                  </span>
                  <span className="text-white font-medium">{opt}</span>
                  {revealed && i === activity.correctIndex && (
                    <span className="ml-auto text-secondary">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live chart */}
          {count > 0 && (
            <div className="card p-5 animate-fade-in">
              <h3 className="font-semibold text-sm text-text-secondary mb-4 uppercase tracking-wide">
                Live Results
              </h3>
              <LiveResultsChart
                options={activity.options}
                responses={responses}
                correctIndex={activity.correctIndex}
                revealed={revealed}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!revealed ? (
              <button
                onClick={handleReveal}
                disabled={scoring}
                className="btn-secondary flex-1 font-orbitron py-3 disabled:opacity-50"
              >
                {scoring ? 'Calculating…' : 'Reveal Answer'}
              </button>
            ) : isLast ? (
              <button
                onClick={onEndQuiz}
                className="btn-primary flex-1 font-orbitron py-3"
              >
                End Quiz & Show Results
              </button>
            ) : (
              <button
                onClick={onNext}
                className="btn-primary flex-1 font-orbitron py-3"
              >
                Next Question →
              </button>
            )}
          </div>
        </div>

        {/* Right: leaderboard panel */}
        <div className="card p-5">
          <h3 className="font-orbitron text-sm font-semibold uppercase tracking-wide mb-4">
            Leaderboard
          </h3>
          <Leaderboard sessionId={sessionId} limit={8} />
        </div>
      </div>
    </div>
  )
}
