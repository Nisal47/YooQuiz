import { useState } from 'react'
import { useTeamVotes } from '../../hooks/useTeamVotes'
import { advanceTeam } from '../../firebase/teamEvalService'
import { closeActivity } from '../../firebase/activityService'
import ParticipantCount from '../shared/ParticipantCount'

/**
 * Teacher's live control panel while a team_evaluation activity is active.
 *
 * Responsibilities:
 *  - Show which team is currently presenting (highlighted)
 *  - Display real-time vote count for the active team
 *  - "Next Team" button → writes currentTeamIndex + 1 to RTDB → all students see new team instantly
 *  - "End Evaluation" button (last team) → calls closeActivity → triggers student result view
 *
 * Props:
 *  activity          – live activity document (subscribed upstream)
 *  participantCount  – total joined students
 *  onEndActivity()   – called after closeActivity resolves; parent switches to results phase
 */
export default function TeamEvalController({ activity, participantCount, onEndActivity }) {
  const [ending, setEnding] = useState(false)

  const { settings, currentTeamIndex, activityId } = activity
  const { teams = [], criteria = [], scale = 5 }   = settings ?? {}

  const activeTeam = teams[currentTeamIndex] ?? teams[0]
  const isLastTeam = currentTeamIndex >= teams.length - 1

  // Live vote count for the currently-active team
  const { count: voteCount } = useTeamVotes(activityId, activeTeam?.id)

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function handleNextTeam() {
    if (isLastTeam) return
    await advanceTeam(activityId, currentTeamIndex + 1)
  }

  async function handleEndEvaluation() {
    setEnding(true)
    try {
      await closeActivity(activityId)
      onEndActivity?.()
    } finally {
      setEnding(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen dot-grid p-4 md:p-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">🗳️</span>
            <h1 className="font-orbitron text-lg font-bold truncate">{activity.title}</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Team {currentTeamIndex + 1} of {teams.length}
            {' · '}
            {criteria.length} criteria
            {' · '}
            1–{scale} scale
          </p>
        </div>
        <ParticipantCount count={participantCount} label="joined" />
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_280px] gap-6">
        {/* ── Left: active team + progress + controls ──────────────────── */}
        <div className="space-y-5">
          {/* Active team spotlight */}
          <div className="card p-6 border border-primary/40">
            <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-2">
              Now Presenting
            </p>
            <h2
              className="font-orbitron font-black text-4xl text-white mb-5"
              style={{ textShadow: '0 0 28px rgba(108,99,255,0.55)' }}
            >
              {activeTeam?.name}
            </h2>

            {/* Live vote progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Votes received</span>
                <span className="font-orbitron font-bold text-primary">
                  {voteCount} / {participantCount}
                </span>
              </div>
              <div className="h-2.5 bg-surface rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${participantCount > 0 ? (voteCount / participantCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Team progression list */}
          <div className="card p-5">
            <h3 className="font-orbitron text-sm uppercase tracking-wide text-text-secondary mb-4">
              All Teams
            </h3>
            <div className="space-y-2">
              {teams.map((team, i) => {
                const isDone    = i < currentTeamIndex
                const isActive  = i === currentTeamIndex
                const isPending = i > currentTeamIndex

                return (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                      ${isActive  ? 'border-primary/60 bg-primary/10'
                      : isDone   ? 'border-secondary/25 bg-secondary/5 opacity-55'
                      :            'border-white/5 bg-surface'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${isActive ? 'bg-primary text-white'
                        : isDone  ? 'bg-secondary/40 text-white'
                        :           'border border-white/20 text-text-secondary'}`}
                      >
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                        {team.name}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-xs text-primary font-semibold animate-pulse">
                        ● LIVE
                      </span>
                    )}
                    {isDone && (
                      <span className="text-xs text-secondary/70 font-semibold">Done</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex gap-3">
            {!isLastTeam ? (
              <button
                onClick={handleNextTeam}
                className="btn-primary flex-1 font-orbitron py-3"
              >
                Next Team →
              </button>
            ) : (
              <button
                onClick={handleEndEvaluation}
                disabled={ending}
                className="btn-secondary flex-1 font-orbitron py-3 disabled:opacity-50"
              >
                {ending ? 'Finishing…' : 'End Evaluation & Show Results'}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: criteria panel ────────────────────────────────────── */}
        <div className="card p-5">
          <h3 className="font-orbitron text-sm uppercase tracking-wide text-text-secondary mb-4">
            Evaluation Criteria
          </h3>
          <div className="space-y-2 mb-5">
            {criteria.map((c, i) => (
              <div key={c} className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-xl border border-white/5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{c}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-1">
            <p className="text-xs text-text-secondary">
              Rating scale: <span className="text-white font-semibold">1 – {scale}</span>
            </p>
            <p className="text-xs text-text-secondary">
              Teams: <span className="text-white font-semibold">{teams.length}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
