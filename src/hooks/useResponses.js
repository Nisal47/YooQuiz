import { useState, useEffect, useRef } from 'react'
import { onResponsesChange } from '../firebase/responseService'

/**
 * Subscribe to all responses for an activity.
 * Returns { responses: Record<studentId, ResponseData>, count: number }
 */
export function useResponses(activityId) {
  const [responses, setResponses] = useState({})
  const unsubRef = useRef(null)

  useEffect(() => {
    if (!activityId) { setResponses({}); return }

    unsubRef.current = onResponsesChange(activityId, data => setResponses(data))
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [activityId])

  return { responses, count: Object.keys(responses).length }
}
