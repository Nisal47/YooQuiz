import { useState }    from 'react'
import TeamEvalCard   from './TeamEvalCard'
import TeamEvalBuilder from './TeamEvalBuilder'

/**
 * Activity list + inline creation form for the TeamVote host flow.
 * Only handles team_evaluation type — this is the dedicated builder
 * for the VoteBlast system.
 *
 * Props:
 *  activities          – list of team_evaluation activities (sorted by order)
 *  onAdd(data)         – create a new team_evaluation activity
 *  onDelete(id)
 *  onReorder(from, to)
 *  onGoToLobby()
 */
export default function TeamVoteBuilder({ activities, onAdd, onDelete, onReorder, onGoToLobby }) {
  const [adding,  setAdding]  = useState(false)
  const [confirm, setConfirm] = useState(false)

  function moveUp(i)   { if (i > 0)                        onReorder(i, i - 1) }
  function moveDown(i) { if (i < activities.length - 1)    onReorder(i, i + 1) }

  return (
    <div className="min-h-screen dot-grid p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-orbitron text-2xl font-bold">Evaluation Builder</h1>
          <p className="text-text-secondary text-sm mt-1">
            {activities.length === 0
              ? 'No evaluations yet'
              : `${activities.length} evaluation${activities.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onGoToLobby} className="btn-ghost text-sm py-2 px-4">
            ← Lobby
          </button>
          <button
            onClick={onGoToLobby}
            disabled={activities.length === 0}
            className="btn-primary text-sm py-2 px-5 font-orbitron disabled:opacity-40"
          >
            Done →
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-3xl mx-auto w-full flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="btn-secondary text-sm py-2 px-5 disabled:opacity-40"
        >
          🗳️ Add Team Evaluation
        </button>
        {activities.length > 0 && !adding && (
          <button
            onClick={() => setConfirm(true)}
            className="btn-ghost text-sm py-2 px-4 text-danger border-danger/30 hover:border-danger ml-auto"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col gap-4">
        {/* Inline creation form */}
        {adding && (
          <TeamEvalBuilder
            onSave={data => { onAdd(data); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}

        {/* Activity list */}
        {activities.length === 0 && !adding ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-4 py-20">
            <div className="text-5xl opacity-30">🗳️</div>
            <p className="text-center">
              No evaluations yet.<br />
              Click "Add Team Evaluation" to create one.
            </p>
          </div>
        ) : (
          activities.map((a, i) => (
            <div key={a.activityId} className="relative">
              <TeamEvalCard
                activity={a}
                index={i}
                total={activities.length}
                onDelete={() => onDelete(a.activityId)}
                onMoveUp={() => moveUp(i)}
                onMoveDown={() => moveDown(i)}
              />
            </div>
          ))
        )}
      </div>

      {/* Clear all confirm */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,15,0.85)' }}
        >
          <div className="card p-6 max-w-sm w-full text-center animate-pop">
            <p className="text-lg font-semibold mb-2">Clear all evaluations?</p>
            <p className="text-text-secondary text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirm(false)} className="btn-ghost py-2 px-5">Cancel</button>
              <button
                onClick={() => { activities.forEach(a => onDelete(a.activityId)); setConfirm(false) }}
                className="btn-danger py-2 px-5"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
