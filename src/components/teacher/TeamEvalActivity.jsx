import { useState, useEffect } from 'react'
import TeamEvalController from './TeamEvalController'
import TeamEvalResults    from './TeamEvalResults'

/**
 * Smart wrapper for the team_evaluation teacher flow.
 *
 * Manages two internal phases:
 *   'controlling' → TeamEvalController (live panel)
 *   'results'     → TeamEvalResults    (post-activity dashboard)
 *
 * Phase 'results' is entered in two ways:
 *   1. Teacher clicks "End Evaluation" → onEndActivity callback → setPhase('results')
 *   2. Teacher refreshes during a closed activity → useEffect detects status:'closed'
 *
 * This component is the sole entry point rendered by HostPage when
 * currentActivity.type === 'team_evaluation'.
 *
 * Props:
 *  activity         – live activity document (currentActivity from HostPage)
 *  sessionId        – current session id
 *  participantCount – total joined students (from leaderboard.length)
 *  questionIndex    – index of this activity in the activities array
 *  totalQuestions   – total activities count
 *  onNext()         – advance to the next activity (handleNextQuestion in HostPage)
 *  onEndQuiz()      – end the session (handleEndQuiz in HostPage)
 */
export default function TeamEvalActivity({
  activity,
  participantCount,
  questionIndex,
  totalQuestions,
  onNext,
  onEndQuiz,
}) {
  // Initialise phase from current activity status so page-refreshes land correctly
  const [phase, setPhase] = useState(
    () => activity?.status === 'closed' ? 'results' : 'controlling'
  )

  // If activity document updates to 'closed' from outside (rare edge case),
  // automatically switch to results view.
  useEffect(() => {
    if (activity?.status === 'closed') setPhase('results')
  }, [activity?.status])

  const isLast = questionIndex === totalQuestions - 1

  if (!activity) return null

  if (phase === 'results') {
    return (
      <TeamEvalResults
        activity={activity}
        isLast={isLast}
        onNext={onNext}
        onEndQuiz={onEndQuiz}
      />
    )
  }

  return (
    <TeamEvalController
      activity={activity}
      participantCount={participantCount}
      onEndActivity={() => setPhase('results')}
    />
  )
}
