import { useState, useEffect }          from 'react'
import { useNavigate }                  from 'react-router-dom'
import { ensureAuth }                   from '../firebase/config'
import { createSession, updateSession, setCurrentActivity } from '../firebase/sessionService'
import { createTeamEvalActivity, updateActivity, deleteActivity, launchActivity } from '../firebase/activityService'
import { useSession }                   from '../hooks/useSession'
import { useActivities }                from '../hooks/useActivity'
import { useLeaderboard }               from '../hooks/useLeaderboard'
import TeamVoteLobby                    from '../components/teacher/TeamVoteLobby'
import TeamVoteBuilder                  from '../components/teacher/TeamVoteBuilder'
import TeamEvalActivity                 from '../components/teacher/TeamEvalActivity'
import TeamVoteFinalScreen              from '../components/teacher/TeamVoteFinalScreen'

const LS_SESSION  = 'qb_tv_sessionId'
const LS_HOST_UID = 'qb_tv_uid'
const STOPPABLE_VIEWS = ['lobby', 'builder', 'controller']

/**
 * Teacher state machine for the VoteBlast (team_evaluation) module.
 *
 *   create → lobby ↔ builder → controller → final
 *
 * Completely separate from HostPage (quiz).
 * Uses different localStorage keys so quiz and team-vote sessions don't collide.
 */
export default function TeamVoteHostPage() {
  const navigate = useNavigate()

  const [view,         setView]         = useState('init')
  const [sessionId,    setSessionId]    = useState(() => localStorage.getItem(LS_SESSION))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [creatingMsg,  setCreatingMsg]  = useState('')
  const [confirmStop,  setConfirmStop]  = useState(false)
  const [stopping,     setStopping]     = useState(false)

  const { session }    = useSession(sessionId)
  const { activities } = useActivities(sessionId)
  const leaderboard    = useLeaderboard(sessionId)

  const currentActivity = activities[currentIndex] ?? null

  // ─── Restore view on refresh ───────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { setView('create'); return }
    if (!session) return
    if (session.status === 'ended') { setView('final'); return }
    if (session.status === 'active') {
      const idx = activities.findIndex(a => a.activityId === session.currentActivityId)
      if (idx >= 0) setCurrentIndex(idx)
      setView('controller')
      return
    }
    setView(v => v === 'init' ? 'lobby' : v)
  }, [sessionId, session?.status])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleCreateSession() {
    setCreatingMsg('Creating session…')
    const uid = await ensureAuth()
    localStorage.setItem(LS_HOST_UID, uid)
    const { sessionId: sid } = await createSession(uid)
    setSessionId(sid)
    localStorage.setItem(LS_SESSION, sid)
    setView('lobby')
    setCreatingMsg('')
  }

  async function handleAddTeamEval(data) {
    await createTeamEvalActivity(sessionId, { ...data, order: activities.length })
  }

  async function handleDeleteActivity(activityId) {
    await deleteActivity(activityId)
  }

  async function handleReorder(fromIdx, toIdx) {
    const a = activities[fromIdx]
    const b = activities[toIdx]
    await Promise.all([
      updateActivity(a.activityId, { order: b.order }),
      updateActivity(b.activityId, { order: a.order }),
    ])
  }

  async function handleStartEval() {
    if (activities.length === 0) return
    await updateSession(sessionId, { status: 'active' })
    const first = activities[0]
    setCurrentIndex(0)
    await launchActivity(first.activityId)
    await setCurrentActivity(sessionId, first.activityId)
    setView('controller')
  }

  async function handleNext() {
    const nextIdx = currentIndex + 1
    if (nextIdx >= activities.length) return
    const next = activities[nextIdx]
    setCurrentIndex(nextIdx)
    await launchActivity(next.activityId)
    await setCurrentActivity(sessionId, next.activityId)
  }

  async function handleEndSession() {
    await updateSession(sessionId, { status: 'ended', currentActivityId: null })
    setView('final')
  }

  async function handleStopSession() {
    setStopping(true)
    try {
      await updateSession(sessionId, { status: 'ended', currentActivityId: null })
      setConfirmStop(false)
      setView('final')
    } finally {
      setStopping(false)
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderView() {
    if (view === 'create' || view === 'init') {
      return (
        <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center">
          <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B6B]/8 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-6 animate-fade-in">
            <div>
              <span
                className="font-orbitron font-black text-5xl text-[#FF6B6B]"
                style={{ textShadow: '0 0 30px rgba(255,107,107,0.5)' }}
              >
                Vote
              </span>
              <span
                className="font-orbitron font-black text-5xl text-warning"
                style={{ textShadow: '0 0 30px rgba(255,214,10,0.5)' }}
              >
                Blast
              </span>
            </div>
            <p className="text-text-secondary">Teacher Dashboard</p>
            <button
              onClick={handleCreateSession}
              className="btn-primary font-orbitron py-4 px-10 text-lg"
            >
              {creatingMsg || 'Create New Session'}
            </button>
            <button
              onClick={() => navigate('/teamvote')}
              className="block text-sm text-text-secondary hover:text-white transition-colors mx-auto"
            >
              ← Back to VoteBlast
            </button>
          </div>
        </div>
      )
    }

    if (view === 'lobby') {
      return (
        <TeamVoteLobby
          session={session ?? { sessionId, code: '…' }}
          activities={activities}
          onStartEval={handleStartEval}
          onGoToBuilder={() => setView('builder')}
        />
      )
    }

    if (view === 'builder') {
      return (
        <TeamVoteBuilder
          activities={activities}
          onAdd={handleAddTeamEval}
          onDelete={handleDeleteActivity}
          onReorder={handleReorder}
          onGoToLobby={() => setView('lobby')}
        />
      )
    }

    if (view === 'controller') {
      return (
        <TeamEvalActivity
          key={currentActivity?.activityId}
          activity={currentActivity}
          participantCount={leaderboard.length}
          questionIndex={currentIndex}
          totalQuestions={activities.length}
          onNext={handleNext}
          onEndQuiz={handleEndSession}
        />
      )
    }

    if (view === 'final') {
      return (
        <TeamVoteFinalScreen
          activities={activities}
          onNewSession={() => {
            localStorage.removeItem(LS_SESSION)
            localStorage.removeItem(LS_HOST_UID)
            setSessionId(null)
            setView('create')
          }}
          onBack={() => navigate('/teamvote')}
        />
      )
    }

    return null
  }

  // ─── Root render ───────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {renderView()}

      {/* Floating Stop Session button */}
      {STOPPABLE_VIEWS.includes(view) && (
        <button
          onClick={() => setConfirmStop(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-danger/15 hover:bg-danger/30
            border border-danger/50 hover:border-danger text-danger text-sm font-semibold
            px-4 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-danger/20"
        >
          <span className="text-base leading-none">■</span>
          Stop Session
        </button>
      )}

      {/* Confirm stop dialog */}
      {confirmStop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(4px)' }}
        >
          <div className="card max-w-sm w-full p-7 text-center animate-pop border border-danger/30">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-orbitron text-lg font-bold mb-2">Stop Session?</h2>
            <p className="text-text-secondary text-sm mb-6">
              This will end the evaluation session immediately. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmStop(false)}
                disabled={stopping}
                className="btn-ghost py-2.5 px-6"
              >
                Cancel
              </button>
              <button
                onClick={handleStopSession}
                disabled={stopping}
                className="btn-danger py-2.5 px-6 font-orbitron"
              >
                {stopping ? 'Stopping…' : 'Stop Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
