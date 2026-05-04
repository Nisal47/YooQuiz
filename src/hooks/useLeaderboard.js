import { useState, useEffect, useRef } from 'react'
import { onLeaderboardChange } from '../firebase/scoreService'

/**
 * Subscribe to the live leaderboard for a session.
 * Returns an array sorted by totalScore descending, each entry with { studentId, nickname, totalScore }.
 */
export function useLeaderboard(sessionId) {
  const [leaderboard, setLeaderboard] = useState([])
  const unsubRef = useRef(null)

  useEffect(() => {
    if (!sessionId) { setLeaderboard([]); return }

    unsubRef.current = onLeaderboardChange(sessionId, list => setLeaderboard(list))
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [sessionId])

  return leaderboard
}
