import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

// Hub
import YooQuizHome       from './pages/YooQuizHome'

// Quiz module
import LandingPage       from './pages/LandingPage'
import HostPage          from './pages/HostPage'
import StudentPage       from './pages/StudentPage'

// TeamVote module
import TeamVoteLanding   from './pages/TeamVoteLanding'
import TeamVoteHostPage  from './pages/TeamVoteHostPage'
import TeamVoteStudentPage from './pages/TeamVoteStudentPage'

// Shared gate
import HostGate          from './components/shared/HostGate'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* ── Hub ──────────────────────────────────────────────────── */}
        <Route path="/"                 element={<YooQuizHome />} />

        {/* ── Quiz module ──────────────────────────────────────────── */}
        <Route path="/quiz"             element={<LandingPage />} />
        <Route path="/quiz/host"        element={<HostGate><HostPage /></HostGate>} />
        <Route path="/quiz/join"        element={<StudentPage />} />

        {/* ── TeamVote module ───────────────────────────────────────── */}
        <Route path="/teamvote"         element={<TeamVoteLanding />} />
        <Route path="/teamvote/host"    element={<HostGate><TeamVoteHostPage /></HostGate>} />
        <Route path="/teamvote/join"    element={<TeamVoteStudentPage />} />

        {/* Catch-all */}
        <Route path="*"                 element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
