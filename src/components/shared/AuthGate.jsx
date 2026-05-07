import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { signOutTeacher } from '../../firebase/authService'

/**
 * Wraps teacher-only routes.
 *
 * Guards:
 *  1. teacherLoading → show spinner (Firebase restoring session from IndexedDB)
 *  2. No teacher     → redirect to /auth, passing current path as `from`
 *  3. Email user with unverified email → show inline prompt to verify
 *  4. All clear      → render children
 */
export default function AuthGate({ children }) {
  const { teacher, teacherLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    if (teacherLoading) return
    if (!teacher) {
      navigate('/auth', { state: { from: location.pathname }, replace: true })
    }
  }, [teacher, teacherLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Still loading Firebase auth state ───────────────────────────────────
  if (teacherLoading) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center">
        <p className="font-orbitron text-primary text-lg animate-pulse">Loading…</p>
      </div>
    )
  }

  // ── Not signed in (redirect fires via useEffect) ─────────────────────────
  if (!teacher) return null

  // ── Email/password user hasn't verified their email yet ──────────────────
  const isEmailUser = teacher.providerData[0]?.providerId === 'password'
  if (isEmailUser && !teacher.emailVerified) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center px-4">
        <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 w-full max-w-sm card p-8 text-center space-y-5 animate-slide-up">
          <div className="text-5xl">📧</div>
          <h2 className="font-orbitron text-xl font-bold">Verify your email</h2>
          <p className="text-text-secondary text-sm">
            A verification link was sent to{' '}
            <span className="text-white font-medium">{teacher.email}</span>.
            Please verify your email before accessing the teacher dashboard.
          </p>
          <a
            href="/auth"
            className="btn-primary block w-full py-3 font-orbitron text-center"
            onClick={e => { e.preventDefault(); navigate('/auth') }}
          >
            Go to verification
          </a>
          <button
            onClick={signOutTeacher}
            className="text-sm text-text-secondary hover:text-danger transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // ── All clear — render children with a floating sign-out chip ──────────
  const label = teacher.displayName || teacher.email || 'Teacher'

  return (
    <div>
      {/* Floating teacher indicator — top-right corner, above everything */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <span
          className="hidden sm:block text-xs text-text-secondary truncate max-w-[160px]"
          title={teacher.email}
        >
          {label}
        </span>
        <button
          onClick={signOutTeacher}
          className="text-xs text-text-secondary hover:text-danger
            border border-white/10 hover:border-danger/50
            px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
        >
          Sign out
        </button>
      </div>

      {children}
    </div>
  )
}
