import { useState, useEffect }        from 'react'
import { useNavigate }                from 'react-router-dom'
import { useAuth }                    from '../context/AuthContext'
import { createSession, updateSession, setCurrentActivity } from '../firebase/sessionService'
import {
  createActivity, updateActivity, deleteActivity,
  launchActivity, closeActivity, cloneActivities, getActivities,
} from '../firebase/activityService'
import { useSession }         from '../hooks/useSession'
import { useActivities }      from '../hooks/useActivity'
import { useLeaderboard }     from '../hooks/useLeaderboard'
import SessionLobby           from '../components/teacher/SessionLobby'
import QuizBuilder            from '../components/teacher/QuizBuilder'
import QuestionController     from '../components/teacher/QuestionController'
import Leaderboard            from '../components/teacher/Leaderboard'
import SessionHistoryPanel    from '../components/teacher/SessionHistoryPanel'
import SessionReview          from '../components/teacher/SessionReview'

const LS_SESSION = 'qb_host_sessionId'

const STOPPABLE_VIEWS = ['lobby', 'builder', 'controller']

/**
 * Teacher state machine for the QuizBlast (MCQ quiz) module.
 *
 *   create → lobby ↔ builder → controller → final
 */
export default function HostPage() {
  const navigate = useNavigate()
  const { teacher } = useAuth()

  const [view,            setView]           = useState('init')
  const [sessionId,       setSessionId]      = useState(() => localStorage.getItem(LS_SESSION))
  const [reviewSessionId, setReviewSessionId] = useState(null)
  const [currentIndex,    setCurrentIndex]   = useState(0)
  const [creatingMsg,     setCreatingMsg]    = useState('')
  const [confirmStop,     setConfirmStop]    = useState(false)
  const [stopping,        setStopping]       = useState(false)

  const { session }    = useSession(sessionId)
  const { activities } = useActivities(sessionId)
  const leaderboard    = useLeaderboard(sessionId)

  const currentActivity = activities[currentIndex] ?? null

  // ─── Restore view on refresh ───────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { setView('create'); return }
    if (!session) return

    // Session gone from Firebase (deleted externally) — wipe the stale ID
    if (session === null) {
      localStorage.removeItem(LS_SESSION)
      setSessionId(null)
      setView('create')
      return
    }

    if (session.status === 'ended') {
      // Auto-clear ended session so next visit starts fresh
      localStorage.removeItem(LS_SESSION)
      setView('final')
      return
    }
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
    const { sessionId: sid } = await createSession(teacher.uid, 'quiz')
    setSessionId(sid)
    localStorage.setItem(LS_SESSION, sid)
    setView('lobby')
    setCreatingMsg('')
  }

  /** Create a fresh session pre-loaded with the questions from a past session. */
  async function handleReuse(sourceSessionId) {
    setCreatingMsg('Copying questions…')
    try {
      const acts = await getActivities(sourceSessionId)
      const { sessionId: sid } = await createSession(teacher.uid, 'quiz')
      setSessionId(sid)
      localStorage.setItem(LS_SESSION, sid)
      await cloneActivities(acts, sid)
      setView('lobby')
    } finally {
      setCreatingMsg('')
    }
  }

  async function handleAddQuestion(q) {
    await createActivity(sessionId, { ...q, order: activities.length })
  }

  async function handleUpdateQuestion(activityId, data) {
    await updateActivity(activityId, data)
  }

  async function handleDeleteQuestion(activityId) {
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

  async function handleStartQuiz() {
    if (activities.length === 0) return
    await updateSession(sessionId, { status: 'active' })
    const first = activities[0]
    setCurrentIndex(0)
    await launchActivity(first.activityId)
    await setCurrentActivity(sessionId, first.activityId)
    setView('controller')
  }

  async function handleNextQuestion() {
    const nextIdx = currentIndex + 1
    if (nextIdx >= activities.length) return
    const next = activities[nextIdx]
    setCurrentIndex(nextIdx)
    await launchActivity(next.activityId)
    await setCurrentActivity(sessionId, next.activityId)
  }

  async function handleEndQuiz() {
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
    if (view === 'review') {
      return (
        <SessionReview
          sessionId={reviewSessionId}
          onBack={() => setView('create')}
          onReuse={handleReuse}
        />
      )
    }

    if (view === 'create' || view === 'init') {
      return (
        <div className="min-h-screen dot-grid flex flex-col items-center px-4 pt-16 pb-12 text-center">
          <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center space-y-6 animate-fade-in w-full">
            <div>
              <span className="font-orbitron font-black text-5xl text-primary text-glow-primary">Quiz</span>
              <span className="font-orbitron font-black text-5xl text-secondary text-glow-secondary">Blast</span>
            </div>
            <p className="text-text-secondary">Teacher Dashboard</p>
            <button onClick={handleCreateSession} className="btn-primary font-orbitron py-4 px-10 text-lg">
              {creatingMsg || 'Create New Session'}
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="block text-sm text-text-secondary hover:text-white transition-colors"
            >
              ← Back to QuizBlast
            </button>

            {/* Previous sessions */}
            <SessionHistoryPanel
              hostUid={teacher?.uid}
              type="quiz"
              onView={sid => { setReviewSessionId(sid); setView('review') }}
              onReuse={handleReuse}
            />
          </div>
        </div>
      )
    }

    if (view === 'lobby') {
      return (
        <SessionLobby
          session={session ?? { sessionId, code: '…' }}
          activities={activities}
          onStartQuiz={handleStartQuiz}
          onGoToBuilder={() => setView('builder')}
        />
      )
    }

    if (view === 'builder') {
      return (
        <QuizBuilder
          activities={activities}
          onAdd={handleAddQuestion}
          onUpdate={handleUpdateQuestion}
          onDelete={handleDeleteQuestion}
          onReorder={handleReorder}
          onGoToLobby={() => setView('lobby')}
        />
      )
    }

    if (view === 'controller') {
      if (!currentActivity) {
        return (
          <div className="min-h-screen dot-grid flex items-center justify-center">
            <p className="font-orbitron text-primary text-lg animate-pulse">Loading question…</p>
          </div>
        )
      }
      return (
        <QuestionController
          activity={currentActivity}
          sessionId={sessionId}
          participantCount={leaderboard.length}
          questionIndex={currentIndex}
          totalQuestions={activities.length}
          onReveal={() => {}}
          onNext={handleNextQuestion}
          onEndQuiz={handleEndQuiz}
        />
      )
    }

    if (view === 'final') {
      return (
        <div className="min-h-screen dot-grid p-6 flex flex-col items-center">
          <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-warning/8 rounded-full blur-3xl" />
          <div className="relative z-10 w-full max-w-lg animate-fade-in">
            <h1 className="font-orbitron text-3xl font-black text-warning text-glow-warning text-center mb-2">
              Session Ended
            </h1>
            <p className="text-text-secondary text-center mb-8">Final Leaderboard</p>
            <div className="card p-6">
              <Leaderboard sessionId={sessionId} limit={20} />
            </div>
            <div className="flex gap-4 mt-6 justify-center">
              <button
                onClick={() => {
                  localStorage.removeItem(LS_SESSION)
                  setSessionId(null)
                  setView('create')
                }}
                className="btn-primary font-orbitron"
              >
                New Session
              </button>
              <button onClick={() => navigate('/quiz')} className="btn-ghost">← QuizBlast</button>
            </div>
          </div>
        </div>
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

      {/* Confirmation dialog */}
      {confirmStop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(4px)' }}
        >
          <div className="card max-w-sm w-full p-7 text-center animate-pop border border-danger/30">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-orbitron text-lg font-bold mb-2">Stop Session?</h2>
            <p className="text-text-secondary text-sm mb-6">
              This will end the session immediately and show the final leaderboard to all students.
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmStop(false)} disabled={stopping} className="btn-ghost py-2.5 px-6">
                Cancel
              </button>
              <button onClick={handleStopSession} disabled={stopping} className="btn-danger py-2.5 px-6 font-orbitron">
                {stopping ? 'Stopping…' : 'Stop Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
