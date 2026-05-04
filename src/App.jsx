import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import HostPage    from './pages/HostPage'
import StudentPage from './pages/StudentPage'
import HostGate    from './components/shared/HostGate'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"     element={<LandingPage />} />
        <Route path="/host" element={<HostGate><HostPage /></HostGate>} />
        <Route path="/join" element={<StudentPage />} />
        <Route path="*"     element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
