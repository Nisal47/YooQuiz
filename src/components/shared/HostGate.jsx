import { useState } from 'react'

const SESSION_KEY = 'qb_host_authed'
const CORRECT_PIN = import.meta.env.VITE_HOST_PIN ?? 'admin'

/**
 * Wraps any teacher-only route.
 * Checks sessionStorage so the teacher only types the PIN once per browser session.
 */
export default function HostGate({ children }) {
  const [authed,  setAuthed]  = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [input,   setInput]   = useState('')
  const [error,   setError]   = useState(false)
  const [shake,   setShake]   = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
    }
  }

  if (authed) return children

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-xs animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-orbitron font-black text-4xl text-primary text-glow-primary">Quiz</span>
          <span className="font-orbitron font-black text-4xl text-secondary text-glow-secondary">Blast</span>
          <p className="text-text-secondary text-sm mt-2">Teacher Access</p>
        </div>

        <div
          className={`card p-7 border transition-all duration-150
            ${shake ? 'border-danger glow-danger' : 'border-white/10'}`}
          style={shake ? { animation: 'shakeCard 0.5s ease-out' } : {}}
        >
          <div className="flex justify-center mb-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 text-2xl
              ${error ? 'border-danger bg-danger/10' : 'border-primary/40 bg-primary/10'}`}>
              🔐
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 uppercase tracking-widest text-center">
                Host PIN
              </label>
              <input
                type="password"
                className={`input text-center text-xl tracking-widest font-orbitron transition-colors
                  ${error ? 'border-danger/60 focus:border-danger' : ''}`}
                value={input}
                onChange={e => { setInput(e.target.value); setError(false) }}
                placeholder="••••••"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-danger text-sm text-center flex items-center justify-center gap-1 animate-fade-in">
                <span>⚠</span> Incorrect PIN
              </p>
            )}

            <button
              type="submit"
              disabled={!input}
              className="btn-primary w-full py-3 font-orbitron disabled:opacity-40"
            >
              Enter
            </button>
          </form>
        </div>

        <p className="text-text-secondary text-xs text-center mt-4">
          Students: go to <span className="text-primary">/join</span> instead
        </p>
      </div>

      <style>{`
        @keyframes shakeCard {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
