/**
 * Returns a stable, tab-unique participant ID stored in sessionStorage.
 * Each browser tab gets its own ID so multiple students can join from
 * the same browser (e.g. during testing or shared-device scenarios).
 */
const KEY = 'qb_participant_id'

export function getParticipantId() {
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem(KEY, id)
  }
  return id
}
