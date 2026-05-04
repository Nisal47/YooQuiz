import { QRCodeSVG }      from 'qrcode.react'
import ParticipantCount   from '../shared/ParticipantCount'
import { useLeaderboard } from '../../hooks/useLeaderboard'

/**
 * Lobby screen for the TeamVote host flow.
 * Shows join code, QR, live participant list, and activity summary.
 *
 * Props:
 *  session          – current session doc
 *  activities       – list of team_evaluation activities for this session
 *  onStartEval()    – begin the first evaluation
 *  onGoToBuilder()  – navigate to TeamVoteBuilder
 */
export default function TeamVoteLobby({ session, activities, onStartEval, onGoToBuilder }) {
  const participants = useLeaderboard(session.sessionId)
  const joinUrl      = `${window.location.origin}${window.location.pathname}#/teamvote/join`

  const totalTeams = activities.reduce(
    (sum, a) => sum + (a.settings?.teams?.length ?? 0), 0
  )

  return (
    <div className="min-h-screen dot-grid p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span
            className="font-orbitron font-black text-xl text-[#FF6B6B]"
            style={{ textShadow: '0 0 16px rgba(255,107,107,0.5)' }}
          >
            Vote
          </span>
          <span
            className="font-orbitron font-black text-xl text-warning"
            style={{ textShadow: '0 0 16px rgba(255,214,10,0.5)' }}
          >
            Blast
          </span>
        </div>
        <div className="flex gap-3">
          <button onClick={onGoToBuilder} className="btn-ghost text-sm py-2 px-4">
            ← Edit Activities
          </button>
          <button
            onClick={onStartEval}
            disabled={activities.length === 0}
            className="btn-primary text-sm py-2 px-5 font-orbitron disabled:opacity-40"
          >
            Start Evaluation ({activities.length})
          </button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
        {/* Join code + QR */}
        <div className="card p-8 flex flex-col items-center gap-6">
          <p className="text-text-secondary text-sm uppercase tracking-widest font-semibold">
            Join at · scan QR
          </p>

          <div className="text-center">
            <div
              className="font-orbitron font-black text-7xl tracking-widest text-white"
              style={{ textShadow: '0 0 30px rgba(255,107,107,0.4)' }}
            >
              {session.code}
            </div>
            <p className="text-text-secondary text-xs mt-1">6-digit join code</p>
          </div>

          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={joinUrl} size={160} />
          </div>

          <p className="text-text-secondary text-xs text-center">
            Students go to <span className="text-[#FF6B6B]">{joinUrl}</span>
          </p>
        </div>

        {/* Participant list */}
        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-orbitron text-base font-semibold">Evaluators</h2>
            <ParticipantCount count={participants.length} />
          </div>

          {participants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-secondary">
              <div className="relative w-16 h-16 flex items-center justify-center pulse-ring">
                <div className="w-6 h-6 rounded-full bg-[#FF6B6B]/60" />
              </div>
              <p className="text-sm animate-pulse-slow">Waiting for students to join…</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start">
              {participants.map((p, i) => (
                <div
                  key={p.studentId}
                  className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 animate-slide-up"
                >
                  <span className="text-text-secondary text-xs w-5">{i + 1}</span>
                  <span className="text-sm font-medium truncate">{p.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity summary strip */}
      {activities.length > 0 && (
        <div className="max-w-5xl mx-auto w-full mt-6 card p-4">
          <p className="text-text-secondary text-sm mb-3">
            <span className="text-white font-semibold">{activities.length}</span>
            {' '}evaluation{activities.length !== 1 ? 's' : ''}
            {totalTeams > 0 && (
              <>
                {' · '}
                <span className="text-white font-semibold">{totalTeams}</span> total teams
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {activities.map((a, i) => (
              <span
                key={a.activityId}
                className="bg-surface text-xs text-text-secondary rounded px-2 py-1 border border-white/5"
              >
                {i + 1}: {a.title?.substring(0, 32)}{(a.title?.length ?? 0) > 32 ? '…' : ''}
                {' '}
                <span className="text-secondary/70">
                  ({a.settings?.teams?.length ?? 0} teams)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
