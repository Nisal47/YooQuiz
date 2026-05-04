import { useState, useEffect, useRef } from 'react'
import JoinScreen        from '../components/student/JoinScreen'
import WaitingRoom       from '../components/student/WaitingRoom'
import QuestionScreen    from '../components/student/QuestionScreen'
import ResultScreen      from '../components/student/ResultScreen'
import LeaderboardScreen from '../components/student/LeaderboardScreen'
import FinalScreen       from '../components/student/FinalScreen'
import { useSession }    from '../hooks/useSession'
import { useActivity }   from '../hooks/useActivity'
import { useLeaderboard } from '../hooks/useLeaderboard'

/*
 * Student view state machine for the QuizBlast (MCQ quiz) module.
 *
 *   join → waiting → question → answered → result → leaderboard ↺ → final
 *
 * 'question'  – student can still pick an answer
 * 'answered'  – student submitted; QuestionScreen stays visible in locked mode
 *               so they can see which option they chose while waiting for reveal
 * 'result'    – teacher revealed; show ResultScreen with correct/wrong feedback
 * 'leaderboard' – auto-shown ~3.5s after result
 */
export default function StudentPage() {
  const [view,           setView]           = useState('join')
  const [sessionId,      setSessionId]      = useState(null)
  const [studentId,      setStudentId]      = useState(null)
  const [nickname,       setNickname]       = useState('')
  const [lastAnswer,     setLastAnswer]     = useState(null)
  const [cachedActivity, setCachedActivity] = useState(null)

  const prevActivityId = useRef(null)
  const prevStatus     = useRef(null)

  const { session }  = useSession(sessionId)
  const { activity } = useActivity(session?.currentActivityId)
  const leaderboard  = useLeaderboard(sessionId)

  const myEntry    = leaderboard.find(e => e.studentId === studentId)
  const totalScore = myEntry?.totalScore ?? 0

  // Keep the last successfully loaded activity so child screens never get null
  useEffect(() => {
    if (activity) setCachedActivity(activity)
  }, [activity])

  function handleJoined({ session, studentId, nickname }) {
    setSessionId(session.sessionId)
    setStudentId(studentId)
    setNickname(nickname)
    setView('waiting')
  }

  // ─── Signal 1: session.currentActivityId changed ─────────────────────────
  useEffect(() => {
    if (!session) return

    if (session.status === 'ended') {
      setView('final')
      return
    }

    if (!session.currentActivityId) {
      setView(v => v === 'join' ? 'join' : 'waiting')
      return
    }

    if (session.currentActivityId !== prevActivityId.current) {
      prevActivityId.current = session.currentActivityId
      prevStatus.current = null
      setLastAnswer(null)
      setView('question')
    }
  }, [session?.status, session?.currentActivityId])

  // ─── Signal 2: activity.status changed ───────────────────────────────────
  useEffect(() => {
    if (!activity) return

    if (activity.status === 'closed' && prevStatus.current === 'active') {
      setView('result')
      const t = setTimeout(() => setView('leaderboard'), 3500)
      return () => clearTimeout(t)
    }

    prevStatus.current = activity.status
  }, [activity?.status])

  // ─── Render ───────────────────────────────────────────────────────────────

  if (view === 'join') {
    return <JoinScreen onJoined={handleJoined} />
  }

  if (view === 'waiting') {
    return (
      <WaitingRoom
        session={session ?? { code: '…', sessionId }}
        studentId={studentId}
        nickname={nickname}
      />
    )
  }

  // Loading guard — cachedActivity may lag one render behind after activity loads
  if (view === 'question' || view === 'answered') {
    if (!cachedActivity || cachedActivity.activityId !== session?.currentActivityId) {
      return (
        <div className="min-h-screen dot-grid flex items-center justify-center">
          <p className="font-orbitron text-primary text-lg animate-pulse">Loading question…</p>
        </div>
      )
    }

    return (
      <QuestionScreen
        key={cachedActivity.activityId}       // remount on new question
        activity={cachedActivity}
        studentId={studentId}
        // When re-entering 'answered', show the option they already picked (locked)
        initialSelected={view === 'answered' ? (lastAnswer?.selectedIndex ?? null) : null}
        onAnswered={answer => {
          setLastAnswer(answer)
          setView('answered')
        }}
      />
    )
  }

  if (view === 'result') {
    return (
      <ResultScreen
        activity={cachedActivity}
        lastAnswer={lastAnswer}
        totalScore={totalScore}
        revealed={true}
      />
    )
  }

  if (view === 'leaderboard') {
    return <LeaderboardScreen sessionId={sessionId} studentId={studentId} />
  }

  if (view === 'final') {
    return <FinalScreen sessionId={sessionId} studentId={studentId} />
  }

  return null
}
