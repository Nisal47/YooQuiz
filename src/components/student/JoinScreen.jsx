import { useState } from 'react'
import { getSessionByCode } from '../../firebase/sessionService'
import { addParticipant } from '../../firebase/scoreService'
import { ensureAuth } from '../../firebase/config'
import { getParticipantId } from '../../utils/tabId'

export default function JoinScreen({ onJoined }) {
  const [code,     setCode]     = useState('')
  const [nickname, setNickname] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleJoin(e) {
    e.preventDefault()
    const trimCode = code.trim().toUpperCase()
    const trimNick = nickname.trim()
    if (trimCode.length !== 6) { setError('Enter a valid 6-character code'); return }
    if (!trimNick)              { setError('Choose a nickname'); return }

    setLoading(true)
    setError('')

    try {
      const session = await getSessionByCode(trimCode)
      if (!session)                     { setError('Session not found. Check your code.'); return }
      if (session.status === 'ended')   { setError('This quiz has already ended.'); return }

      await ensureAuth()                        // just need to be authenticated
      const participantId = getParticipantId()  // stable per browser tab

      await addParticipant(session.sessionId, participantId, trimNick)
      onJoined({ session, studentId: participantId, nickname: trimNick })
    } catch (err) {
      setError('Something went wrong. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4">
      {/* Glow */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-orbitron font-black text-4xl text-primary text-glow-primary">Quiz</span>
          <span className="font-orbitron font-black text-4xl text-secondary text-glow-secondary">Blast</span>
        </div>

        <div className="card p-8 space-y-5">
          <h1 className="font-orbitron text-xl font-bold text-center">Join Quiz</h1>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 uppercase tracking-wide">
                Join Code
              </label>
              <input
                className="input text-center font-orbitron text-2xl tracking-[0.3em] uppercase"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                maxLength={6}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1.5 uppercase tracking-wide">
                Nickname
              </label>
              <input
                className="input text-center text-lg"
                value={nickname}
                onChange={e => setNickname(e.target.value.slice(0, 20))}
                placeholder="Your name…"
                maxLength={20}
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-danger text-sm text-center flex items-center justify-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6 || !nickname.trim()}
              className="btn-primary w-full py-4 font-orbitron text-lg mt-2"
            >
              {loading ? 'Joining…' : 'Join →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
