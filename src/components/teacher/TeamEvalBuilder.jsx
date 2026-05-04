import { useState } from 'react'

const DEFAULT_CRITERIA = ['Clarity', 'Design', 'Content']
const SCALE_OPTIONS    = [3, 4, 5, 7, 10]

/**
 * Form for creating a new team_evaluation activity.
 * Rendered inline inside QuizBuilder when teacher clicks "Add Team Evaluation".
 *
 * Props:
 *  onSave(activityData)  — called with the fully-shaped activity object
 *  onCancel()
 */
export default function TeamEvalBuilder({ onSave, onCancel }) {
  const [title,        setTitle]        = useState('')
  const [criteria,     setCriteria]     = useState([...DEFAULT_CRITERIA])
  const [newCriterion, setNewCriterion] = useState('')
  const [teams,        setTeams]        = useState([
    { id: 't_' + Date.now() + '_0', name: '' },
    { id: 't_' + Date.now() + '_1', name: '' },
  ])
  const [scale, setScale] = useState(5)

  // ─── Criteria helpers ──────────────────────────────────────────────────────

  function addCriterion() {
    const t = newCriterion.trim()
    if (!t || criteria.includes(t)) return
    setCriteria(c => [...c, t])
    setNewCriterion('')
  }

  function removeCriterion(idx) {
    if (criteria.length <= 1) return          // keep at least 1
    setCriteria(c => c.filter((_, i) => i !== idx))
  }

  function moveCriterion(idx, dir) {
    const next = idx + dir
    if (next < 0 || next >= criteria.length) return
    setCriteria(c => {
      const arr = [...c]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  // ─── Team helpers ──────────────────────────────────────────────────────────

  function addTeam() {
    setTeams(ts => [...ts, { id: 't_' + Date.now(), name: '' }])
  }

  function removeTeam(idx) {
    if (teams.length <= 2) return             // minimum 2 teams
    setTeams(ts => ts.filter((_, i) => i !== idx))
  }

  function updateTeamName(idx, name) {
    setTeams(ts => ts.map((t, i) => i === idx ? { ...t, name } : t))
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  const canSave =
    title.trim().length > 0 &&
    criteria.length >= 1 &&
    teams.length >= 2 &&
    teams.every(t => t.name.trim().length > 0)

  function handleSave() {
    if (!canSave) return
    onSave({
      type:             'team_evaluation',
      title:            title.trim(),
      settings: {
        scale,
        criteria:       [...criteria],
        teams:          teams.map(t => ({ id: t.id, name: t.name.trim() })),
        allowVoteEdit:  false,
        showResultsLive: false,
      },
      currentTeamIndex: 0,
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="card p-6 border border-secondary/40 animate-slide-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🗳️</span>
        <div>
          <h3 className="font-orbitron font-semibold text-lg">Team Evaluation</h3>
          <p className="text-text-secondary text-sm">Students rate each team on multiple criteria</p>
        </div>
      </div>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Activity Title <span className="text-danger">*</span>
        </label>
        <input
          className="input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Project Presentation Evaluation"
          autoFocus
        />
      </div>

      {/* ── Criteria ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Criteria
          <span className="text-text-secondary font-normal ml-2">({criteria.length})</span>
        </label>

        <div className="space-y-2 mb-3">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveCriterion(i, -1)}
                  disabled={i === 0}
                  className="text-text-secondary hover:text-white disabled:opacity-20 text-[10px] leading-none"
                >▲</button>
                <button
                  type="button"
                  onClick={() => moveCriterion(i, 1)}
                  disabled={i === criteria.length - 1}
                  className="text-text-secondary hover:text-white disabled:opacity-20 text-[10px] leading-none"
                >▼</button>
              </div>
              <span className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                {c}
              </span>
              <button
                type="button"
                onClick={() => removeCriterion(i)}
                disabled={criteria.length <= 1}
                className="text-danger/60 hover:text-danger disabled:opacity-20 px-2 text-xl leading-none transition-colors"
                title="Remove"
              >×</button>
            </div>
          ))}
        </div>

        {/* Add criterion */}
        <div className="flex gap-2">
          <input
            className="input py-2 flex-1"
            value={newCriterion}
            onChange={e => setNewCriterion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCriterion() } }}
            placeholder="Add a criterion…"
          />
          <button
            type="button"
            onClick={addCriterion}
            disabled={!newCriterion.trim() || criteria.includes(newCriterion.trim())}
            className="btn-ghost text-sm py-2 px-4 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Teams ─────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Teams
          <span className="text-text-secondary font-normal ml-2">({teams.length} · min 2)</span>
        </label>

        <div className="space-y-2 mb-3">
          {teams.map((team, i) => (
            <div key={team.id} className="flex items-center gap-2">
              <span className="text-text-secondary text-xs w-6 text-center font-orbitron">{i + 1}</span>
              <input
                className="input py-2 flex-1"
                value={team.name}
                onChange={e => updateTeamName(i, e.target.value)}
                placeholder={`Team ${i + 1} name`}
              />
              <button
                type="button"
                onClick={() => removeTeam(i)}
                disabled={teams.length <= 2}
                className="text-danger/60 hover:text-danger disabled:opacity-20 px-2 text-xl leading-none transition-colors"
                title="Remove team"
              >×</button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTeam}
          className="btn-ghost text-sm py-2 px-4"
        >
          + Add Team
        </button>
      </div>

      {/* ── Rating Scale ──────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Rating Scale
          <span className="text-text-secondary font-normal ml-2">(1 – {scale})</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {SCALE_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                ${scale === s
                  ? 'bg-primary border-primary text-white'
                  : 'border-white/20 text-text-secondary hover:border-primary/60 hover:text-white'}`}
            >
              {s} stars
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Students pick a number from 1 to {scale} for each criterion.
        </p>
      </div>

      {/* ── Validation hint ───────────────────────────────────────────────── */}
      {!canSave && (
        <p className="text-xs text-warning/80">
          {!title.trim()
            ? '⚠ Enter a title.'
            : teams.some(t => !t.name.trim())
              ? '⚠ All team names are required.'
              : ''}
        </p>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex gap-3 justify-end pt-1 border-t border-white/5">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm py-2.5 px-5">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="btn-secondary text-sm py-2.5 px-6 font-orbitron disabled:opacity-40"
        >
          Add to Session →
        </button>
      </div>
    </div>
  )
}
