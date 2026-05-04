import { useState, useEffect, useRef } from 'react'
import { onTeamVotesChange, onAllTeamVotesChange } from '../firebase/teamEvalService'

/**
 * Subscribe to votes for ONE specific team in real-time.
 * Used by TeacherEvalController to show live participation count.
 *
 * @param {string|null} activityId
 * @param {string|null} teamId
 * @returns {{ votes: Record<studentId, VoteData>, count: number }}
 */
export function useTeamVotes(activityId, teamId) {
  const [votes, setVotes] = useState({})
  const unsubRef = useRef(null)

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    if (!activityId || !teamId) { setVotes({}); return }

    unsubRef.current = onTeamVotesChange(activityId, teamId, data => setVotes(data))
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [activityId, teamId])

  return { votes, count: Object.keys(votes).length }
}

/**
 * Subscribe to ALL votes across ALL teams for an activity in real-time.
 * Used by TeamEvalResults to compute rankings.
 *
 * @param {string|null} activityId
 * @returns {{ allVotes: Record<teamId, Record<studentId, VoteData>> }}
 */
export function useAllTeamVotes(activityId) {
  const [allVotes, setAllVotes] = useState({})
  const unsubRef = useRef(null)

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    if (!activityId) { setAllVotes({}); return }

    unsubRef.current = onAllTeamVotesChange(activityId, data => setAllVotes(data))
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [activityId])

  return { allVotes }
}
