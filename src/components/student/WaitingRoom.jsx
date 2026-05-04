import { useLeaderboard } from '../../hooks/useLeaderboard'

export default function WaitingRoom({ session, studentId, nickname }) {
  const participants = useLeaderboard(session.sessionId)

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center">
      {/* Ambient */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 space-y-8 animate-fade-in w-full max-w-sm">
        {/* Join code */}
        <div>
          <p className="text-text-secondary text-sm uppercase tracking-widest mb-2">Room Code</p>
          <div
            className="font-orbitron font-black text-5xl tracking-widest text-white"
            style={{ textShadow: '0 0 25px rgba(108,99,255,0.5)' }}
          >
            {session.code}
          </div>
        </div>

        {/* Pulsing waiting indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center pulse-ring">
            <div className="w-8 h-8 rounded-full bg-primary/70" />
          </div>
          <p className="text-text-secondary animate-pulse-slow">
            Waiting for teacher to start…
          </p>
        </div>

        {/* Your nickname */}
        <div className="card px-6 py-4">
          <p className="text-text-secondary text-sm mb-1">You're in as</p>
          <p className="font-orbitron font-bold text-xl text-secondary">{nickname}</p>
          <p className="text-text-secondary text-sm mt-1">Score: 0</p>
        </div>

        {/* Player count */}
        <p className="text-text-secondary text-sm">
          <span className="text-white font-semibold">{participants.length}</span>{' '}
          player{participants.length !== 1 ? 's' : ''} in the room
        </p>
      </div>
    </div>
  )
}
