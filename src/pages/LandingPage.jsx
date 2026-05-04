import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="mb-6">
          <span
            className="font-orbitron font-black text-6xl md:text-8xl text-primary"
            style={{ textShadow: '0 0 40px rgba(108,99,255,0.6)' }}
          >
            Quiz
          </span>
          <span
            className="font-orbitron font-black text-6xl md:text-8xl text-secondary"
            style={{ textShadow: '0 0 40px rgba(0,245,212,0.6)' }}
          >
            Blast
          </span>
        </div>

        <p className="text-text-secondary text-lg md:text-xl mb-12 max-w-md">
          Real-time interactive classroom quizzes. Fast, fun, futuristic.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/host')}
            className="btn-primary text-lg px-10 py-4 font-orbitron"
          >
            Host a Quiz
          </button>
          <button
            onClick={() => navigate('/join')}
            className="btn-ghost text-lg px-10 py-4 font-orbitron"
          >
            Join a Quiz
          </button>
        </div>

        {/* Feature pills */}
        <div className="mt-14 flex flex-wrap justify-center gap-3 text-sm text-text-secondary">
          {['Live leaderboards', 'Speed bonuses', 'CSV import', 'QR join code', 'No account needed'].map(f => (
            <span key={f} className="bg-surface border border-white/10 rounded-full px-4 py-1.5">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
