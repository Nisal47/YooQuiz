import { useNavigate } from 'react-router-dom'

const MODULES = [
  {
    path:        '/quiz',
    accentLeft:  'text-primary',
    accentRight: 'text-secondary',
    glowLeft:    'rgba(108,99,255,0.5)',
    glowRight:   'rgba(0,245,212,0.5)',
    blobColor:   'bg-primary/10',
    borderHover: 'hover:border-primary/50',
    badgeClass:  'bg-primary/15 text-primary border-primary/25',
    icon:        '⚡',
    name:        ['Quiz', 'Blast'],
    tagline:     'Live MCQ quizzes with speed bonuses and leaderboards',
    features:    ['Timed questions', 'Speed scoring', 'CSV import', 'Live chart'],
    hostLabel:   'Host a Quiz',
    joinLabel:   'Join a Quiz',
    hostPath:    '/quiz/host',
    joinPath:    '/quiz/join',
  },
  {
    path:        '/teamvote',
    accentLeft:  'text-[#FF6B6B]',
    accentRight: 'text-warning',
    glowLeft:    'rgba(255,107,107,0.5)',
    glowRight:   'rgba(255,214,10,0.5)',
    blobColor:   'bg-[#FF6B6B]/8',
    borderHover: 'hover:border-[#FF6B6B]/40',
    badgeClass:  'bg-warning/10 text-warning border-warning/20',
    icon:        '🗳️',
    name:        ['Vote', 'Blast'],
    tagline:     'Real-time peer evaluation for team presentations',
    features:    ['Dynamic criteria', 'Live vote counts', 'Rankings', 'Best-in-category'],
    hostLabel:   'Host a Vote',
    joinLabel:   'Join a Vote',
    hostPath:    '/teamvote/host',
    joinPath:    '/teamvote/join',
  },
]

export default function YooQuizHome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center justify-center px-4 py-12">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-80 h-80 bg-[#FF6B6B]/6 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl animate-fade-in">
        {/* ── Brand ───────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="mb-3">
            <span
              className="font-orbitron font-black text-6xl md:text-7xl text-primary"
              style={{ textShadow: '0 0 40px rgba(108,99,255,0.55)' }}
            >
              Yoo
            </span>
            <span
              className="font-orbitron font-black text-6xl md:text-7xl text-secondary"
              style={{ textShadow: '0 0 40px rgba(0,245,212,0.55)' }}
            >
              Quiz
            </span>
          </div>
          <p className="text-text-secondary text-base md:text-lg max-w-sm mx-auto">
            Your interactive classroom suite
          </p>
        </div>

        {/* ── Module cards ─────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">
          {MODULES.map(mod => (
            <div
              key={mod.path}
              className={`card p-7 border border-white/8 ${mod.borderHover} transition-all duration-300 cursor-pointer group`}
              onClick={() => navigate(mod.path)}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="text-3xl">{mod.icon}</span>
                  <div className="mt-2">
                    <span
                      className={`font-orbitron font-black text-3xl ${mod.accentLeft}`}
                      style={{ textShadow: `0 0 20px ${mod.glowLeft}` }}
                    >
                      {mod.name[0]}
                    </span>
                    <span
                      className={`font-orbitron font-black text-3xl ${mod.accentRight}`}
                      style={{ textShadow: `0 0 20px ${mod.glowRight}` }}
                    >
                      {mod.name[1]}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm mt-1 leading-snug max-w-[200px]">
                    {mod.tagline}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${mod.badgeClass} flex-shrink-0 ml-3`}>
                  Enter →
                </span>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {mod.features.map(f => (
                  <span
                    key={f}
                    className="bg-surface border border-white/8 rounded-full text-xs text-text-secondary px-2.5 py-1"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Quick-action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={e => { e.stopPropagation(); navigate(mod.hostPath) }}
                  className="btn-primary flex-1 text-sm py-2.5 font-orbitron"
                >
                  {mod.hostLabel}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); navigate(mod.joinPath) }}
                  className="btn-ghost flex-1 text-sm py-2.5"
                >
                  {mod.joinLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-text-secondary text-xs mt-10 opacity-50">
          No account needed · Firebase real-time · Anonymous join
        </p>
      </div>
    </div>
  )
}
