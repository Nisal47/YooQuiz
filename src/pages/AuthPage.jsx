import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resendVerificationEmail,
  signOutTeacher,
} from '../firebase/authService'
import { createUserProfile } from '../firebase/userService'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase/config'

/* ─── Firebase error → human-readable message ─────────────────────────────── */
const ERROR_MAP = {
  'auth/invalid-credential':    'Invalid email or password.',
  'auth/user-not-found':        'Invalid email or password.',
  'auth/wrong-password':        'Invalid email or password.',
  'auth/email-already-in-use':  'An account with this email already exists.',
  'auth/weak-password':         'Password must be at least 6 characters.',
  'auth/invalid-email':         'Please enter a valid email address.',
  'auth/too-many-requests':     'Too many attempts. Please try again later.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
}
function friendly(err) {
  return ERROR_MAP[err?.code] || 'Something went wrong. Please try again.'
}

/* ─── Google logo SVG ─────────────────────────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

/* ─── Pending email verification screen ───────────────────────────────────── */
function VerifyEmailScreen({ email, onVerified }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  async function handleCheck() {
    setLoading(true)
    setError('')
    try {
      await auth.currentUser?.reload()
      if (auth.currentUser?.emailVerified) {
        onVerified()
      } else {
        setError('Email not verified yet. Check your inbox and click the link.')
      }
    } catch {
      setError('Could not check verification status. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    await resendVerificationEmail()
    setResent(true)
    setTimeout(() => setResent(false), 4000)
  }

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center px-4">
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        <div className="text-center mb-8">
          <span className="font-orbitron font-black text-4xl text-primary text-glow-primary">Yoo</span>
          <span className="font-orbitron font-black text-4xl text-secondary text-glow-secondary">Quiz</span>
        </div>

        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">📧</div>
          <h2 className="font-orbitron text-xl font-bold">Check your inbox</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-white font-medium">{email}</span>.
            Click the link to activate your account.
          </p>

          {error && (
            <p className="text-danger text-sm flex items-center justify-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}
          {resent && (
            <p className="text-success text-sm">Verification email resent!</p>
          )}

          <button
            onClick={handleCheck}
            disabled={loading}
            className="btn-primary w-full py-3 font-orbitron disabled:opacity-40"
          >
            {loading ? 'Checking…' : "I've verified my email →"}
          </button>

          <button
            onClick={handleResend}
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Resend verification email
          </button>

          <button
            onClick={signOutTeacher}
            className="text-xs text-text-secondary hover:text-danger transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main AuthPage ───────────────────────────────────────────────────────── */
export default function AuthPage() {
  const { teacher, teacherLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/'

  const [tab,           setTab]           = useState('signin') // 'signin' | 'signup'
  const [pendingVerify, setPendingVerify] = useState(false)
  const [verifyEmail,   setVerifyEmail]   = useState('')

  // Form fields
  const [displayName, setDisplayName] = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  // ─── Redirect if already authenticated ──────────────────────────────────
  useEffect(() => {
    if (teacherLoading || !teacher) return
    const isEmail = teacher.providerData[0]?.providerId === 'password'
    if (isEmail && !teacher.emailVerified) {
      // Signed in but email not yet verified — show verify screen
      setVerifyEmail(teacher.email)
      setPendingVerify(true)
      return
    }
    // Fully authenticated → send them where they were going
    navigate(from, { replace: true })
  }, [teacher, teacherLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function clearForm() {
    setError('')
    setEmail('')
    setPassword('')
    setDisplayName('')
  }

  // ─── Handlers ─────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      const user = await signInWithGoogle()
      await createUserProfile(user.uid, {
        displayName: user.displayName,
        email:       user.email,
        provider:    'google',
        photoURL:    user.photoURL,
      })
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendly(err))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await signInWithEmail(email, password)
      if (!user.emailVerified) {
        setVerifyEmail(user.email)
        setPendingVerify(true)
        return
      }
      await createUserProfile(user.uid, {
        displayName: user.displayName || email.split('@')[0],
        email:       user.email,
        provider:    'email',
        photoURL:    null,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendly(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await signUpWithEmail(email, password, displayName)
      await createUserProfile(user.uid, {
        displayName,
        email:   user.email,
        provider:'email',
        photoURL: null,
      })
      setVerifyEmail(user.email)
      setPendingVerify(true)
    } catch (err) {
      setError(friendly(err))
    } finally {
      setLoading(false)
    }
  }

  // ─── Loading (Firebase restoring session) ─────────────────────────────
  if (teacherLoading) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center">
        <p className="font-orbitron text-primary text-lg animate-pulse">Loading…</p>
      </div>
    )
  }

  // ─── Pending email verification ────────────────────────────────────────
  if (pendingVerify) {
    return (
      <VerifyEmailScreen
        email={verifyEmail}
        onVerified={() => navigate(from, { replace: true })}
      />
    )
  }

  // ─── Sign In / Sign Up form ────────────────────────────────────────────
  return (
    <div className="min-h-screen dot-grid flex items-center justify-center px-4">
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-orbitron font-black text-4xl text-primary text-glow-primary">Yoo</span>
          <span className="font-orbitron font-black text-4xl text-secondary text-glow-secondary">Quiz</span>
          <p className="text-text-secondary text-sm mt-2">Teacher Account</p>
        </div>

        <div className="card p-8 space-y-5">

          {/* Tabs */}
          <div className="flex rounded-lg bg-white/5 p-1">
            {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setTab(id); clearForm() }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all
                  ${tab === id
                    ? 'bg-primary text-black'
                    : 'text-text-secondary hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google — only on Sign In tab */}
          {tab === 'signin' && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                  bg-white text-gray-800 font-semibold text-sm
                  hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <GoogleLogo />
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-text-secondary text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {/* Sign In form */}
          {tab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <input
                type="email"
                className="input"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                required
              />
              <input
                type="password"
                className="input"
                placeholder="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                required
              />
              {error && (
                <p className="text-danger text-sm flex items-center gap-1.5">
                  <span>⚠</span> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary w-full py-3 font-orbitron disabled:opacity-40"
              >
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          )}

          {/* Create Account form */}
          {tab === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError('') }}
                autoComplete="name"
                required
              />
              <input
                type="email"
                className="input"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                required
              />
              <input
                type="password"
                className="input"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="new-password"
                minLength={6}
                required
              />
              {error && (
                <p className="text-danger text-sm flex items-center gap-1.5">
                  <span>⚠</span> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !email || !password || !displayName}
                className="btn-primary w-full py-3 font-orbitron disabled:opacity-40"
              >
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>
          )}
        </div>

        <p className="text-text-secondary text-xs text-center mt-4">
          Students go to{' '}
          <span className="text-primary">/quiz/join</span>
          {' '}or{' '}
          <span className="text-primary">/teamvote/join</span>
        </p>
      </div>
    </div>
  )
}
