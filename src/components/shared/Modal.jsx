import { useEffect } from 'react'

/**
 * Generic modal overlay.
 * @param {boolean}    open
 * @param {function}   onClose
 * @param {string}     title
 * @param {ReactNode}  children
 * @param {string}     maxWidth  Tailwind max-w class, default 'max-w-2xl'
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        className={`relative w-full ${maxWidth} bg-card border border-white/10 rounded-2xl shadow-2xl animate-pop`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-orbitron text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
