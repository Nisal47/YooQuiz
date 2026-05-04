import { useState } from 'react'

/**
 * Read-only summary card for a team_evaluation activity shown in the activity list
 * inside QuizBuilder. Mirrors the look of QuestionCard but surfaces team-eval metadata.
 */
export default function TeamEvalCard({ activity, index, total, onDelete, onMoveUp, onMoveDown }) {
  const [confirm, setConfirm] = useState(false)
  const { title, settings } = activity
  const { teams = [], criteria = [], scale = 5 } = settings ?? {}

  return (
    <div className="card p-4 flex gap-4 group hover:border-white/20 border border-transparent transition-all">
      {/* Order controls */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <span className="font-orbitron text-xs text-text-secondary w-6 text-center">{index + 1}</span>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-text-secondary hover:text-white disabled:opacity-20 text-xs leading-none"
        >▲</button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-text-secondary hover:text-white disabled:opacity-20 text-xs leading-none"
        >▼</button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🗳️</span>
          <p className="text-white font-semibold leading-snug truncate">{title}</p>
        </div>

        {/* Teams as pills */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {teams.map((team, i) => (
            <span
              key={team.id}
              className="text-xs px-2.5 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary font-medium"
            >
              {team.name}
            </span>
          ))}
        </div>

        {/* Criteria row */}
        <p className="text-xs text-text-secondary">
          <span className="text-white/60 font-medium">Criteria:</span>{' '}
          {criteria.join(' · ')}
        </p>
      </div>

      {/* Meta + actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="bg-secondary/15 text-secondary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
          1–{scale} scale
        </span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setConfirm(true)}
            className="text-xs text-text-secondary hover:text-danger transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Inline delete confirm */}
      {confirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'rgba(10,10,15,0.92)' }}
        >
          <div className="text-center px-6">
            <p className="text-sm font-semibold mb-3">Delete this team evaluation?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirm(false)} className="btn-ghost text-xs py-1.5 px-4">
                Cancel
              </button>
              <button
                onClick={() => { setConfirm(false); onDelete() }}
                className="btn-danger text-xs py-1.5 px-4"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
