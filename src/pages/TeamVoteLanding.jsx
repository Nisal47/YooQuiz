import { useNavigate } from 'react-router-dom'

export default function TeamVoteLanding() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 text-center">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-[#FF6B6B]/8 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-80 h-80 bg-warning/8 rounded-full blur-3xl" />

      <div className="relative z-10 animate-fade-in">
        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          ← YooQuiz
        </button>

        {/* Logo */}
        <div className="mb-6">
          <span
            className="font-orbitron font-black text-6xl md:text-8xl text-[#FF6B6B]"
            style={{ textShadow: '0 0 40px rgba(255,107,107,0.55)' }}
          >
            Vote
          </span>
          <span
            className="font-orbitron font-black text-6xl md:text-8xl text-warning"
            style={{ textShadow: '0 0 40px rgba(255,214,10,0.55)' }}
          >
            Blast
          </span>
        </div>

        <p className="text-text-secondary text-lg md:text-xl mb-12 max-w-md">
          Real-time peer evaluation for team presentations. Fast, fair, futuristic.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/teamvote/host')}
            className="btn-primary text-lg px-10 py-4 font-orbitron"
          >
            Host a Vote
          </button>
          <button
            onClick={() => navigate('/teamvote/join')}
            className="btn-ghost text-lg px-10 py-4 font-orbitron"
          >
            Join a Vote
          </button>
        </div>

        {/* Feature pills */}
        <div className="mt-14 flex flex-wrap justify-center gap-3 text-sm text-text-secondary">
          {[
            'Dynamic criteria',
            'Live vote counts',
            'Per-team ranking',
            'Best-in-category',
            'No account needed',
          ].map(f => (
            <span key={f} className="bg-surface border border-white/10 rounded-full px-4 py-1.5">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
