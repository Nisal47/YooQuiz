import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensureAuth } from '../firebase/config'
import { createSession, updateSession, setCurrentActivity } from '../firebase/sessionService'
import {
  createActivity, updateActivity, deleteActivity,
  launchActivity, closeActivity,
} from '../firebase/activityService'
import { useSession }     from '../hooks/useSession'
import { useActivities }  from '../hooks/useActivity'
import { useLeaderboard } from '../hooks/useLeaderboard'
import SessionLobby       from '../components/teacher/SessionLobby'
import QuizBuilder        from '../components/teacher/QuizBuilder'
import QuestionController from '../components/teacher/QuestionController'
import Leaderboard        from '../components/teacher/Leaderboard'

const LS_SESSION  = 'qb_host_sessionId'
const LS_HOST_UID = 'qb_host_uid'

// Views where the floating "Stop Session" button is visible
const STOPPABLE_VIEWS = ['lobby', 'builder', 'controller']

export default function HostPage() {
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

  // Restore view on refresh
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
    if (view === 'create' || view === 'init') {
      return (
        <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center">
          <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-6 animate-fade-in">
            <div>
              <span className="font-orbitron font-black text-5xl text-primary text-glow-primary">Quiz</span>
              <span className="font-orbitron font-black text-5xl text-secondary text-glow-secondary">Blast</span>
            </div>
            <p className="text-text-secondary">Teacher Dashboard</p>
            <button onClick={handleCreateSession} className="btn-primary font-orbitron py-4 px-10 text-lg">
              {creatingMsg || 'Create New Session'}
            </button>
            <button onClick={() => navigate('/')} className="block text-sm text-text-secondary hover:text-white transition-colors mx-auto">
              ← Back to home
            </button>
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
                  localStorage.removeItem(LS_HOST_UID)
                  setSessionId(null)
                  setView('create')
                }}
                className="btn-primary font-orbitron"
              >
                New Session
              </button>
              <button onClick={() => navigate('/')} className="btn-ghost">← Home</button>
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

      {/* Floating Stop Session button — visible on all active views */}
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
