import { useState, useEffect, useRef } from 'react'
import { onActivityChange, onActivitiesChange } from '../firebase/activityService'

/**
 * Subscribe to a single activity document.
 * @param {string|null} activityId
 */
export function useActivity(activityId) {
  const [activity, setActivity] = useState(null)
  const [loading, setLoading]   = useState(true)
  const unsubRef = useRef(null)

  useEffect(() => {
    if (!activityId) { setActivity(null); setLoading(false); return }

    setLoading(true)
    unsubRef.current = onActivityChange(activityId, data => {
      setActivity(data)
      setLoading(false)
    })

    return () => { if (unsubRef.current) unsubRef.current() }
  }, [activityId])

  return { activity, loading }
}

/**
 * Subscribe to all activities for a session, sorted by order.
 * @param {string|null} sessionId
 */
export function useActivities(sessionId) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const unsubRef = useRef(null)

  useEffect(() => {
    if (!sessionId) { setActivities([]); setLoading(false); return }

    setLoading(true)
    unsubRef.current = onActivitiesChange(sessionId, list => {
      setActivities(list)
      setLoading(false)
    })

    return () => { if (unsubRef.current) unsubRef.current() }
  }, [sessionId])

  return { activities, loading }
}
