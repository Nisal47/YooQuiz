import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

// Auth
import { AuthProvider } from './context/AuthContext'
import AuthGate         from './components/shared/AuthGate'
import AuthPage         from './pages/AuthPage'

// Hub
import YooQuizHome       from './pages/YooQuizHome'

// Quiz module
import LandingPage       from './pages/LandingPage'
import HostPage          from './pages/HostPage'
import StudentPage       from './pages/StudentPage'

// TeamVote module
import TeamVoteLanding     from './pages/TeamVoteLanding'
import TeamVoteHostPage    from './pages/TeamVoteHostPage'
import TeamVoteStudentPage from './pages/TeamVoteStudentPage'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* ── Hub ──────────────────────────────────────────────────── */}
          <Route path="/"     element={<YooQuizHome />} />

          {/* ── Auth (teacher sign-in / sign-up) ─────────────────────── */}
          <Route path="/auth" element={<AuthPage />} />

          {/* ── Quiz module ──────────────────────────────────────────── */}
          <Route path="/quiz"      element={<LandingPage />} />
          <Route path="/quiz/host" element={<AuthGate><HostPage /></AuthGate>} />
          <Route path="/quiz/join" element={<StudentPage />} />

          {/* ── TeamVote module ───────────────────────────────────────── */}
          <Route path="/teamvote"      element={<TeamVoteLanding />} />
          <Route path="/teamvote/host" element={<AuthGate><TeamVoteHostPage /></AuthGate>} />
          <Route path="/teamvote/join" element={<TeamVoteStudentPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
