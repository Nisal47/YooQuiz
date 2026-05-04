import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { parseQuizCsv } from '../../utils/csvParser'
import CsvPreviewModal from './CsvPreviewModal'

export default function CsvImporter({ open, onClose, onImport }) {
  const [rows,     setRows]     = useState([])
  const [preview,  setPreview]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef(null)

  if (!open) return null

  function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setError('Please select a .csv file')
      return
    }
    setError('')

    Papa.parse(file, {
      header:         true,
      skipEmptyLines: true,
      complete: result => {
        if (result.data.length === 0) { setError('CSV file is empty'); return }
        const { rows } = parseQuizCsv(result)
        setRows(rows)
        setPreview(true)
      },
      error: err => setError(`Parse error: ${err.message}`),
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <>
      {/* Drop-zone overlay */}
      {!preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <div className="card max-w-md w-full p-6 animate-pop">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-orbitron text-lg font-semibold">Import CSV</h2>
              <button onClick={onClose} className="text-text-secondary hover:text-white text-xl">✕</button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-primary/60 rounded-xl p-10 text-center cursor-pointer transition-colors"
            >
              <div className="text-4xl mb-3">📂</div>
              <p className="text-white font-semibold mb-1">Drop your CSV here</p>
              <p className="text-text-secondary text-sm">or click to browse</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {error && (
              <p className="mt-3 text-danger text-sm flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}

            <p className="mt-4 text-text-secondary text-xs leading-relaxed">
              Expected columns: <code className="text-primary">question, option_a, option_b, option_c, option_d, correct, time_limit</code>
              <br />
              <code>correct</code>: A/B/C/D or 0/1/2/3 · <code>option_c</code>, <code>option_d</code>, and <code>time_limit</code> are optional
            </p>
          </div>
        </div>
      )}

      {/* Preview modal */}
      <CsvPreviewModal
        open={preview}
        rows={rows}
        onConfirm={questions => { onImport(questions); setPreview(false) }}
        onClose={() => { setPreview(false); onClose() }}
      />
    </>
  )
}
