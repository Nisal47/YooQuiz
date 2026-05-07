import { useState } from 'react'
import ImageUrlInput from '../shared/ImageUrlInput'

const OPT_COLORS   = ['text-primary', 'text-secondary', 'text-[#FF6B6B]', 'text-warning']
const OPT_LABELS   = ['A', 'B', 'C', 'D']
const TIME_OPTIONS = [10, 20, 30, 60]

export default function QuestionCard({ question, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(null)

  function startEdit() {
    setDraft({
      question:     question.question,
      options:      [...question.options, '', '', ''].slice(0, 4),
      correctIndex: question.correctIndex,
      timeLimit:    question.timeLimit,
      imageUrl:     question.imageUrl || '',
    })
    setEditing(true)
  }

  function saveEdit() {
    const opts = draft.options.filter(o => o.trim() !== '')
    if (opts.length < 2) return
    onUpdate({
      question:     draft.question,
      options:      opts,
      correctIndex: Math.min(draft.correctIndex, opts.length - 1),
      timeLimit:    draft.timeLimit,
      imageUrl:     draft.imageUrl.trim() || null,
    })
    setEditing(false)
  }

  function cancelEdit() {
    setDraft(null)
    setEditing(false)
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="card p-5 border border-primary/40 animate-fade-in">
        <div className="space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Question</label>
            <textarea
              rows={2}
              className="input resize-none"
              value={draft.question}
              onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
              placeholder="Enter your question…"
            />
          </div>

          {/* Image URL (optional) */}
          <ImageUrlInput
            value={draft.imageUrl}
            onChange={url => setDraft(d => ({ ...d, imageUrl: url }))}
          />

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draft.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, correctIndex: i }))}
                  className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all
                    ${draft.correctIndex === i
                      ? 'bg-secondary border-secondary text-bg'
                      : 'border-white/20 text-text-secondary hover:border-secondary'}`}
                  title="Mark as correct"
                >
                  {OPT_LABELS[i]}
                </button>
                <input
                  className="input py-2"
                  value={opt}
                  onChange={e => {
                    const opts = [...draft.options]
                    opts[i] = e.target.value
                    setDraft(d => ({ ...d, options: opts }))
                  }}
                  placeholder={i < 2 ? `Option ${OPT_LABELS[i]} (required)` : `Option ${OPT_LABELS[i]} (optional)`}
                />
              </div>
            ))}
          </div>

          {/* Time limit */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">Time limit</span>
            <div className="flex gap-2">
              {TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, timeLimit: t }))}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all border
                    ${draft.timeLimit === t
                      ? 'bg-warning text-bg border-warning'
                      : 'border-white/20 text-text-secondary hover:border-warning/60'}`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={cancelEdit} className="btn-ghost text-sm py-2 px-4">Cancel</button>
            <button
              onClick={saveEdit}
              disabled={!draft.question.trim() || draft.options.filter(o => o.trim()).length < 2}
              className="btn-primary text-sm py-2 px-5"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── View mode ──────────────────────────────────────────────────────────────
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
        <p className="text-white font-medium mb-2 leading-snug">{question.question}</p>
        {question.imageUrl && (
          <div className="mb-2 rounded-lg overflow-hidden border border-white/8 max-h-32">
            <img
              src={question.imageUrl}
              alt=""
              className="w-full max-h-32 object-contain bg-surface/50"
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt, i) => (
            <span
              key={i}
              className={`text-xs px-2.5 py-1 rounded-full border
                ${i === question.correctIndex
                  ? 'border-secondary bg-secondary/15 text-secondary font-semibold'
                  : 'border-white/10 text-text-secondary'}`}
            >
              <span className={`font-bold mr-1 ${OPT_COLORS[i]}`}>{OPT_LABELS[i]}</span>
              {opt}
            </span>
          ))}
        </div>
      </div>

      {/* Meta + actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {question.imageUrl && (
            <span className="text-xs text-text-secondary" title="Has image">🖼️</span>
          )}
          <span className="bg-warning/15 text-warning text-xs font-semibold px-2 py-0.5 rounded-full">
            {question.timeLimit}s
          </span>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={startEdit}
            className="text-xs text-text-secondary hover:text-primary transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-text-secondary hover:text-danger transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
