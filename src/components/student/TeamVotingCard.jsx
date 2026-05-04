import { useState, useEffect } from 'react'
import { submitTeamVote, hasVotedForTeam } from '../../firebase/teamEvalService'

/**
 * Student voting screen for a team_evaluation activity.
 *
 * Behaviour:
 *  - Reads the active team from activity.currentTeamIndex (live prop from RTDB)
 *  - When teacher advances team, currentTeamIndex changes → useEffect re-checks if
 *    student already voted for the new team and resets the rating UI
 *  - Ratings are per-criterion number buttons (not sliders) for fast mobile input
 *  - Submit is blocked until every criterion has a rating
 *  - On submit, writes to /teamVotes/{activityId}/{teamId}/{studentId} (write-once)
 *  - After submission, shows a confirmation state so student knows to wait
 *
 * Props:
 *  activity   – live activity document (type: 'team_evaluation')
 *  studentId  – tab-scoped participant ID from sessionStorage
 */
export default function TeamVotingCard({ activity, studentId }) {
  const { activityId, settings, currentTeamIndex } = activity
  const { teams = [], criteria = [], scale = 5 }   = settings ?? {}

  const activeTeam = teams[currentTeamIndex] ?? teams[0]

  const [ratings,      setRatings]      = useState({})   // { criterion: number }
  const [submitted,    setSubmitted]    = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [checkingVote, setCheckingVote] = useState(true)
  const [submitError,  setSubmitError]  = useState(null)

  // ─── Re-check vote status whenever the active team changes ────────────────
  useEffect(() => {
    if (!activeTeam) return
    let cancelled = false

    setCheckingVote(true)
    setSubmitted(false)
    setRatings({})
    setSubmitError(null)

    hasVotedForTeam(activityId, activeTeam.id, studentId)
      .then(voted => {
        if (!cancelled) {
          setSubmitted(voted)
          setCheckingVote(false)
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingVote(false)
      })

    return () => { cancelled = true }
  }, [activityId, activeTeam?.id, studentId])

  // ─── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!allRated || submitting || submitted) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitTeamVote(activityId, activeTeam.id, studentId, ratings)
      setSubmitted(true)
    } catch (err) {
      // If write-once rule fires it means they already voted — treat as success
      if (err?.code === 'PERMISSION_DENIED' || err?.message?.includes('PERMISSION_DENIED')) {
        // Already voted (write-once rule) — could also re-check to confirm
        setSubmitted(true)
      } else {
        setSubmitError('Failed to submit. Please check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const allRated = criteria.every(c => ratings[c] != null)

  // ─── Loading check ─────────────────────────────────────────────────────────
  if (checkingVote || !activeTeam) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center">
        <p className="font-orbitron text-primary text-lg animate-pulse">Loading…</p>
      </div>
    )
  }

  // ─── Activity closed ───────────────────────────────────────────────────────
  if (activity.status === 'closed') {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-sm w-full animate-fade-in border border-warning/20">
          <div className="text-5xl mb-4">🏁</div>
          <h2 className="font-orbitron text-xl font-bold text-warning mb-2">
            Evaluation Complete
          </h2>
          <p className="text-text-secondary text-sm">Results are being tallied…</p>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen dot-grid p-4 flex flex-col items-center pt-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in">
        {/* ── Team heading ──────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-2">
            Now Evaluating
          </p>
          <h1
            className="font-orbitron font-black text-4xl text-white leading-tight"
            style={{ textShadow: '0 0 28px rgba(108,99,255,0.5)' }}
          >
            {activeTeam.name}
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Team {currentTeamIndex + 1} of {teams.length}
          </p>
        </div>

        {/* ── Submitted confirmation ────────────────────────────────────── */}
        {submitted ? (
          <div className="card p-7 text-center border border-secondary/30 animate-fade-in">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="font-orbitron font-bold text-secondary text-lg mb-1">Vote Submitted!</h2>
            <p className="text-text-secondary text-sm">
              Waiting for the teacher to move to the next team…
            </p>
          </div>
        ) : (
          /* ── Rating form ─────────────────────────────────────────────── */
          <div className="card p-5 space-y-5 animate-slide-up">
            {criteria.map(criterion => (
              <div key={criterion}>
                {/* Criterion label + selected score */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white">{criterion}</span>
                  <span className={`font-orbitron font-bold text-base transition-colors
                    ${ratings[criterion] ? 'text-primary' : 'text-text-secondary/40'}`}
                  >
                    {ratings[criterion] ? `${ratings[criterion]} / ${scale}` : '— / ' + scale}
                  </span>
                </div>

                {/* Rating buttons */}
                <div className="flex gap-1.5 sm:gap-2">
                  {Array.from({ length: scale }, (_, i) => i + 1).map(val => {
                    const selected = ratings[criterion] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRatings(r => ({ ...r, [criterion]: val }))}
                        className={`flex-1 py-3 rounded-xl font-orbitron font-bold text-sm transition-all duration-150 border-2 select-none
                          ${selected
                            ? 'bg-primary border-primary text-white scale-105 shadow-lg shadow-primary/30'
                            : 'border-white/12 bg-surface text-text-secondary hover:border-primary/50 hover:text-white active:scale-95'}`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Submit error */}
            {submitError && (
              <p className="text-danger text-sm text-center flex items-center justify-center gap-1 animate-fade-in">
                <span>⚠</span> {submitError}
              </p>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allRated || submitting}
              className="btn-primary w-full font-orbitron py-4 text-base mt-2 disabled:opacity-40"
            >
              {submitting
                ? 'Submitting…'
                : allRated
                  ? 'Submit Vote →'
                  : `Rate all ${criteria.length} criteria to continue`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
