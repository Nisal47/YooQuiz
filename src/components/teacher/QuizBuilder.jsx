import { useState } from 'react'
import QuestionCard from './QuestionCard'
import CsvImporter from './CsvImporter'
import { buildCsvTemplate } from '../../utils/csvParser'

const BLANK_DRAFT = { question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30 }
const TIME_OPTIONS = [10, 20, 30, 60]
const OPT_LABELS   = ['A', 'B', 'C', 'D']

export default function QuizBuilder({ activities, onAdd, onUpdate, onDelete, onReorder, onGoToLobby }) {
  const [adding,  setAdding]  = useState(false)
  const [draft,   setDraft]   = useState({ ...BLANK_DRAFT, options: ['', '', '', ''] })
  const [showCsv, setShowCsv] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const totalTime = activities.reduce((s, a) => s + (a.timeLimit || 30), 0)

  function handleAddSave() {
    const opts = draft.options.filter(o => o.trim() !== '')
    if (draft.question.trim() === '' || opts.length < 2) return
    onAdd({
      question:     draft.question.trim(),
      options:      opts,
      correctIndex: Math.min(draft.correctIndex, opts.length - 1),
      timeLimit:    draft.timeLimit,
    })
    setDraft({ ...BLANK_DRAFT, options: ['', '', '', ''] })
    setAdding(false)
  }

  function moveUp(i) {
    if (i === 0) return
    onReorder(i, i - 1)
  }

  function moveDown(i) {
    if (i === activities.length - 1) return
    onReorder(i, i + 1)
  }

  function downloadTemplate() {
    const csv  = buildCsvTemplate()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'quiz_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen dot-grid p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-orbitron text-2xl font-bold">Quiz Builder</h1>
          <p className="text-text-secondary text-sm mt-1">
            {activities.length} question{activities.length !== 1 ? 's' : ''}
            {activities.length > 0 && ` · ~${totalTime}s total`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onGoToLobby} className="btn-ghost text-sm py-2 px-4">
            ← Lobby
          </button>
          <button
            onClick={onGoToLobby}
            disabled={activities.length === 0}
            className="btn-primary text-sm py-2 px-5 font-orbitron"
          >
            Done →
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-3xl mx-auto w-full flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => { setAdding(true); setDraft({ ...BLANK_DRAFT, options: ['', '', '', ''] }) }}
          className="btn-primary text-sm py-2 px-4"
          disabled={adding}
        >
          + Add Question
        </button>
        <button onClick={() => setShowCsv(true)} className="btn-ghost text-sm py-2 px-4">
          Import CSV
        </button>
        <button onClick={downloadTemplate} className="btn-ghost text-sm py-2 px-4">
          Download Template
        </button>
        {activities.length > 0 && (
          <button
            onClick={() => setConfirm(true)}
            className="btn-ghost text-sm py-2 px-4 text-danger border-danger/30 hover:border-danger ml-auto"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col gap-4">
        {/* Add form */}
        {adding && (
          <div className="card p-5 border border-primary/40 animate-slide-up">
            <h3 className="font-semibold mb-4">New Question</h3>
            <div className="space-y-4">
              <textarea
                rows={2}
                className="input resize-none"
                value={draft.question}
                onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
                placeholder="Enter your question…"
                autoFocus
              />
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">Time</span>
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
              <div className="flex gap-3 justify-end">
                <button onClick={() => setAdding(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
                <button
                  onClick={handleAddSave}
                  disabled={!draft.question.trim() || draft.options.filter(o => o.trim()).length < 2}
                  className="btn-primary text-sm py-2 px-5"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question list */}
        {activities.length === 0 && !adding ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-4 py-20">
            <div className="text-5xl opacity-30">📝</div>
            <p>No questions yet. Add one or import a CSV.</p>
          </div>
        ) : (
          activities.map((q, i) => (
            <QuestionCard
              key={q.activityId}
              question={q}
              index={i}
              total={activities.length}
              onUpdate={data => onUpdate(q.activityId, data)}
              onDelete={() => onDelete(q.activityId)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
            />
          ))
        )}
      </div>

      {/* CSV importer modal */}
      <CsvImporter
        open={showCsv}
        onClose={() => setShowCsv(false)}
        onImport={questions => {
          questions.forEach(q => onAdd(q))
          setShowCsv(false)
        }}
      />

      {/* Clear all confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,10,15,0.85)' }}>
          <div className="card p-6 max-w-sm w-full text-center animate-pop">
            <p className="text-lg font-semibold mb-2">Clear all questions?</p>
            <p className="text-text-secondary text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirm(false)} className="btn-ghost py-2 px-5">Cancel</button>
              <button onClick={() => { activities.forEach(a => onDelete(a.activityId)); setConfirm(false) }} className="btn-danger py-2 px-5">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
