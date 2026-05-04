import { useState, useEffect } from 'react'
import Modal from '../shared/Modal'

const OPT_LABELS = ['A', 'B', 'C', 'D']

export default function CsvPreviewModal({ open, rows, onConfirm, onClose }) {
  const validIndices = rows.filter(r => r.errors.length === 0).map(r => r.index)

  // Re-sync whenever rows change (e.g. new file parsed while modal was already mounted)
  const [selected, setSelected] = useState(new Set(validIndices))
  useEffect(() => {
    setSelected(new Set(validIndices))
  }, [rows])  // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = validIndices.length > 0 && validIndices.every(i => selected.has(i))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(validIndices))
    }
  }

  function toggle(i) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const importCount = validIndices.filter(i => selected.has(i)).length

  function handleImport() {
    const questions = rows
      .filter(r => selected.has(r.index) && r.errors.length === 0)
      .map(r => r.parsed)
    onConfirm(questions)
  }

  return (
    <Modal open={open} onClose={onClose} title="CSV Import Preview" maxWidth="max-w-4xl">
      {/* Summary bar */}
      <div className="mb-4 flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
        <span className="text-secondary font-semibold">{validIndices.length} valid</span>
        <span className="text-text-secondary">·</span>
        <span className="text-danger font-semibold">{rows.length - validIndices.length} errors</span>
        <span className="text-text-secondary">·</span>
        <span className="text-text-secondary">{rows.length} total</span>

        {/* Select all / deselect all */}
        {validIndices.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg border transition-all
              border-primary/50 text-primary hover:bg-primary/10"
          >
            {allSelected ? 'Deselect All' : `Select All (${validIndices.length})`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[55vh] rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface border-b border-white/10">
            <tr>
              <th className="px-3 py-2 text-left text-text-secondary font-medium w-8">#</th>
              <th className="px-3 py-2 text-left text-text-secondary font-medium">Question</th>
              <th className="px-3 py-2 text-left text-text-secondary font-medium">Options</th>
              <th className="px-3 py-2 text-left text-text-secondary font-medium w-20">Correct</th>
              <th className="px-3 py-2 text-left text-text-secondary font-medium w-16">Time</th>
              <th className="px-3 py-2 text-center w-16">
                {/* Header checkbox for select-all */}
                <input
                  type="checkbox"
                  disabled={validIndices.length === 0}
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                  title={allSelected ? 'Deselect all' : 'Select all valid'}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const hasError = row.errors.length > 0
              return (
                <tr
                  key={row.index}
                  className={`border-b border-white/5 transition-colors
                    ${hasError ? 'opacity-50' : 'hover:bg-white/3 cursor-pointer'}`}
                  onClick={() => !hasError && toggle(row.index)}
                >
                  <td className="px-3 py-2.5 text-text-secondary">{row.index + 1}</td>

                  <td className="px-3 py-2.5 max-w-xs">
                    {hasError ? (
                      <div>
                        <span className="text-text-secondary text-xs line-through">
                          {String(row.rawRow.question || row.rawRow.Question || '—').slice(0, 60)}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {row.errors.map((e, ei) => (
                            <div key={ei} className="flex items-start gap-1 text-danger text-xs">
                              <span>⚠</span><span>{e}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-white">
                        {row.parsed.question.slice(0, 80)}{row.parsed.question.length > 80 ? '…' : ''}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {!hasError && (
                      <div className="flex flex-wrap gap-1">
                        {row.parsed.options.map((opt, i) => (
                          <span
                            key={i}
                            className={`text-xs px-1.5 py-0.5 rounded border
                              ${i === row.parsed.correctIndex
                                ? 'border-secondary text-secondary'
                                : 'border-white/10 text-text-secondary'}`}
                          >
                            {OPT_LABELS[i]}: {opt.slice(0, 20)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {!hasError && (
                      <span className="text-secondary font-semibold">
                        {OPT_LABELS[row.parsed.correctIndex]}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {!hasError && (
                      <span className="text-warning text-xs font-semibold">{row.parsed.timeLimit}s</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      disabled={hasError}
                      checked={!hasError && selected.has(row.index)}
                      onChange={() => toggle(row.index)}
                      className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5">
        <p className="text-text-secondary text-sm">
          <span className="text-white font-semibold">{importCount}</span> question{importCount !== 1 ? 's' : ''} selected
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button
            onClick={handleImport}
            disabled={importCount === 0}
            className="btn-primary text-sm py-2 px-5"
          >
            Import {importCount > 0 ? importCount : ''} question{importCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </Modal>
  )
}
