import { useState }        from 'react'
import { useHostSessions } from '../../hooks/useHostSessions'
import { hideSession }     from '../../firebase/sessionService'

/**
 * Shows a compact list of the teacher's past sessions for a specific module.
 * Hidden when there is nothing to show.
 *
 * Props:
 *  hostUid  – Firebase anonymous auth uid of the current teacher
 *  type     – 'quiz' | 'team_evaluation'  (only sessions of this type are shown)
 *  onView   – (sessionId) => void  — open read-only review
 *  onReuse  – (sessionId) => void  — clone activities into a new session
 */
export default function SessionHistoryPanel({ hostUid, type, onView, onReuse }) {
  const { sessions, loading, refresh } = useHostSessions(hostUid, type)

  async function handleDelete(sessionId) {
    await hideSession(sessionId)
    refresh()
  }

  // Don't render at all while loading (avoids layout jump) or when empty
  if (!hostUid || (!loading && sessions.length === 0)) return null

  return (
    <div className="w-full max-w-sm mt-10 text-left">
      <h3 className="font-orbitron text-xs uppercase tracking-widest text-text-secondary mb-3">
        Previous Sessions
      </h3>

      {loading ? (
        <p className="text-text-secondary text-sm text-center py-4 animate-pulse">
          Loading history…
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <SessionCard
              key={s.sessionId}
              session={s}
              onView={()             => onView(s.sessionId)}
              onReuse={()            => onReuse(s.sessionId)}
              onDelete={() => handleDelete(s.sessionId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual session card ──────────────────────────────────────────────────

function SessionCard({ session, onView, onReuse, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const date = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—'

  async function handleConfirmDelete() {
    setDeleting(true)
    await onDelete()
    // Component unmounts after refresh — no need to reset state
  }

  return (
    <div className="bg-surface border border-white/8 rounded-xl px-4 py-3
                    hover:border-white/15 transition-colors">
      {confirming ? (
        /* ── Confirm-delete row ── */
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-danger font-semibold">Remove this session?</p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-text-secondary
                         hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg border border-danger/50 text-danger
                         hover:bg-danger/10 transition-colors font-semibold"
            >
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Normal row ── */
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-orbitron text-sm font-bold text-white tracking-wider">
              {session.code}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{date}</p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onView}
              className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary
                         hover:bg-primary/10 transition-colors font-semibold"
            >
              View
            </button>
            <button
              onClick={onReuse}
              className="text-xs px-3 py-1.5 rounded-lg border border-secondary/40 text-secondary
                         hover:bg-secondary/10 transition-colors font-semibold"
            >
              Reuse
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="text-xs w-7 h-7 flex items-center justify-center rounded-lg
                         border border-white/10 text-text-secondary
                         hover:border-danger/40 hover:text-danger hover:bg-danger/8
                         transition-colors"
              title="Remove from history"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
