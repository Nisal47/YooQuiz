import { useState, useEffect, useRef } from 'react'
import { TimerRing } from '../shared/Timer'
import { submitResponse } from '../../firebase/responseService'
import { calcPoints, getTimeRemaining } from '../../utils/scoreCalc'

const OPT_COLORS = ['opt-btn-0', 'opt-btn-1', 'opt-btn-2', 'opt-btn-3']
const OPT_LABELS = ['A', 'B', 'C', 'D']
const BADGE_BG   = ['#6C63FF', '#00F5D4', '#FF6B6B', '#FFD60A']

/**
 * @param {object}   activity        current activity doc
 * @param {string}   studentId
 * @param {number|null} initialSelected  index already submitted (view='answered'); null = fresh question
 * @param {function} onAnswered       called once with { selectedIndex, pointsEarned, isCorrect }
 */
export default function QuestionScreen({ activity, studentId, initialSelected = null, onAnswered }) {
  const alreadyLocked = initialSelected !== null

  const [selected,  setSelected]  = useState(alreadyLocked ? initialSelected : null)
  const [submitted, setSubmitted] = useState(alreadyLocked)
  const [expired,   setExpired]   = useState(false)
  const hasSubmitted = useRef(alreadyLocked)

  // Reset when a new question starts (activity changes)
  useEffect(() => {
    // Only reset if we're NOT pre-loading a locked answer
    if (initialSelected !== null) return
    setSelected(null)
    setSubmitted(false)
    setExpired(false)
    hasSubmitted.current = false
  }, [activity?.activityId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(i) {
    if (submitted || expired || hasSubmitted.current) return
    hasSubmitted.current = true
    setSelected(i)
    setSubmitted(true)

    const timeRemaining = getTimeRemaining(activity.startedAt, activity.timeLimit)
    const isCorrect     = i === activity.correctIndex
    const pointsEarned  = calcPoints(isCorrect, timeRemaining, activity.timeLimit)

    // Notify parent immediately so the UI transitions regardless of network latency
    onAnswered({ selectedIndex: i, pointsEarned, isCorrect, timeRemaining })

    // Write to Firebase in the background — fire-and-forget like handleExpire does
    submitResponse(activity.activityId, studentId, { value: i, timeRemaining, pointsEarned })
      .catch(err => console.error('Response write failed:', err))
  }

  function handleExpire() {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    setExpired(true)
    submitResponse(activity.activityId, studentId, { value: -1, timeRemaining: 0, pointsEarned: 0 }).catch(() => {})
    onAnswered({ selectedIndex: -1, pointsEarned: 0, isCorrect: false, timeRemaining: 0 })
  }

  const locked = submitted || expired

  return (
    <div className="min-h-screen dot-grid flex flex-col px-4 py-6">
      {/* Timer */}
      <div className="flex justify-center mb-6">
        <TimerRing
          total={activity.timeLimit}
          startedAt={activity.startedAt}
          running={!locked}
          onExpire={handleExpire}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full gap-4">
        {/* Question image (optional) */}
        {activity.imageUrl && (
          <div className="card overflow-hidden p-0">
            <img
              src={activity.imageUrl}
              alt="Question"
              className="w-full max-h-56 object-contain bg-surface"
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
            />
          </div>
        )}

        {/* Question text */}
        <div className="card p-6 text-center">
          <p className="font-orbitron text-xl font-bold leading-snug text-white">
            {activity.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid gap-3">
          {activity.options.map((opt, i) => {
            const isSelected = selected === i
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={locked}
                className={`opt-btn ${OPT_COLORS[i]}
                  ${locked && isSelected  ? 'ring-2 ring-white/60 scale-[1.02] opacity-100' : ''}
                  ${locked && !isSelected ? 'opacity-25' : ''}`}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center font-orbitron font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: BADGE_BG[i], color: '#0A0A0F' }}
                >
                  {OPT_LABELS[i]}
                </span>
                <span className="text-white text-base font-medium leading-snug flex-1 text-left">{opt}</span>
                {locked && isSelected && (
                  <span className="text-white/80 text-lg">🔒</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Status footer */}
        {locked && (
          <div className="text-center animate-fade-in pt-2">
            {expired && selected === null ? (
              <p className="text-warning font-semibold">⏱ Time's up!</p>
            ) : (
              <div className="space-y-1">
                <p className="text-secondary font-semibold text-base">Answer locked in!</p>
                <p className="text-text-secondary text-sm">Waiting for teacher to reveal…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
