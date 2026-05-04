import { useState, useEffect, useRef } from 'react'
import { onSessionChange } from '../firebase/sessionService'

/**
 * Subscribe to a session document.
 * @param {string|null} sessionId
 * @returns {{ session: object|null, loading: boolean }}
 */
export function useSession(sessionId) {
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const unsubRef = useRef(null)

  useEffect(() => {
    if (!sessionId) { setSession(null); setLoading(false); return }

    setLoading(true)
    unsubRef.current = onSessionChange(sessionId, data => {
      setSession(data)
      setLoading(false)
    })

    return () => { if (unsubRef.current) unsubRef.current() }
  }, [sessionId])

  return { session, loading }
}
