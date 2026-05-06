import { useState, useEffect, useCallback } from 'react'
import { getSessionsByHost }                from '../firebase/sessionService'

/**
 * Fetches ended sessions for a host filtered by module type.
 * Call refresh() after a delete to update the list.
 *
 * @param {string|null} hostId  – Firebase anonymous auth uid
 * @param {'quiz'|'team_evaluation'} type – module filter
 * @returns {{ sessions: Array, loading: boolean, refresh: () => void }}
 */
export function useHostSessions(hostId, type) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [tick,     setTick]     = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!hostId || !type) { setSessions([]); return }
    setLoading(true)
    getSessionsByHost(hostId, type)
      .then(list => { setSessions(list); setLoading(false) })
      .catch(()   => { setLoading(false) })
  }, [hostId, type, tick])

  return { sessions, loading, refresh }
}
