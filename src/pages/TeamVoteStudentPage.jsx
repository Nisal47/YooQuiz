import { useState, useEffect, useRef }   from 'react'
import WaitingRoom                        from '../components/student/WaitingRoom'
import LeaderboardScreen                  from '../components/student/LeaderboardScreen'
import FinalScreen                        from '../components/student/FinalScreen'
import TeamVotingCard                     from '../components/student/TeamVotingCard'
import TeamEvalStudentResults             from '../components/student/TeamEvalStudentResults'
import JoinScreen                         from '../components/student/JoinScreen'
import { useSession }                     from '../hooks/useSession'
import { useActivity }                    from '../hooks/useActivity'
import { useLeaderboard }                 from '../hooks/useLeaderboard'

/*
 * Student state machine for the VoteBlast (team_evaluation) module.
 *
 *   join → waiting → voting → result → leaderboard ↺ → final
 *
 * Only handles team_evaluation activity type.
 * Completely separate from StudentPage (quiz).
 *
 * State transitions are driven by the same two Firebase signals as the quiz:
 *   Signal 1: session.currentActivityId changes  → view = 'voting'
 *   Signal 2: activity.status → 'closed'          → view = 'result'
 *
 * When teacher advances team (currentTeamIndex changes), TeamVotingCard
 * re-renders automatically via the updated cachedActivity prop — no
 * view transition needed.
 */
export default function TeamVoteStudentPage() {
  const [view,           setView]           = useState('join')
  const [sessionId,      setSessionId]      = useState(null)
  const [studentId,      setStudentId]      = useState(null)
  const [nickname,       setNickname]       = useState('')
  const [cachedActivity, setCachedActivity] = useState(null)

  const prevActivityId = useRef(null)
  const prevStatus     = useRef(null)

  const { session }  = useSession(sessionId)
  const { activity } = useActivity(session?.currentActivityId)
  const leaderboard  = useLeaderboard(sessionId)

  // Keep last non-null activity to avoid null crashes during RTDB round-trips.
  // Also propagates live field updates (e.g. currentTeamIndex) to TeamVotingCard.
  useEffect(() => {
    if (activity) setCachedActivity(activity)
  }, [activity])

  function handleJoined({ session, studentId, nickname }) {
    setSessionId(session.sessionId)
    setStudentId(studentId)
    setNickname(nickname)
    setView('waiting')
  }

  // ─── Signal 1: currentActivityId changed ──────────────────────────────────
  useEffect(() => {
    if (!session) return
    if (session.status === 'ended') { setView('final'); return }
    if (!session.currentActivityId) {
      setView(v => v === 'join' ? 'join' : 'waiting')
      return
    }
    if (session.currentActivityId !== prevActivityId.current) {
      prevActivityId.current = session.currentActivityId
      prevStatus.current = null
      setView('voting')
    }
  }, [session?.status, session?.currentActivityId])

  // ─── Signal 2: activity.status changed ────────────────────────────────────
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
    return (
      <JoinScreen
        logoLeft="Vote"
        logoRight="Blast"
        title="Join Team Vote"
        onJoined={handleJoined}
      />
    )
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

  if (view === 'voting') {
    // Loading guard — cachedActivity may lag one render cycle
    if (!cachedActivity || cachedActivity.activityId !== session?.currentActivityId) {
      return (
        <div className="min-h-screen dot-grid flex items-center justify-center">
          <p className="font-orbitron text-[#FF6B6B] text-lg animate-pulse">Loading…</p>
        </div>
      )
    }
    return (
      <TeamVotingCard
        key={cachedActivity.activityId}  // remount only on new activity
        activity={cachedActivity}         // live updates propagate via prop
        studentId={studentId}
      />
    )
  }

  if (view === 'result') {
    return <TeamEvalStudentResults activity={cachedActivity} />
  }

  if (view === 'leaderboard') {
    return <LeaderboardScreen sessionId={sessionId} studentId={studentId} />
  }

  if (view === 'final') {
    return <FinalScreen sessionId={sessionId} studentId={studentId} />
  }

  return null
}
