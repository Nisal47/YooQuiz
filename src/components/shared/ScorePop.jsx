import { useEffect, useState } from 'react'

/**
 * Floating score pop-up animation.
 * Re-mounts whenever `points` changes (key trick used in parent).
 * @param {number}  points  points to display
 * @param {boolean} show
 */
export default function ScorePop({ points, show }) {
  if (!show || points <= 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-40">
      <span
        className="font-orbitron font-black text-5xl text-secondary score-pop"
        style={{ textShadow: '0 0 20px rgba(0,245,212,0.8)' }}
      >
        +{points}
      </span>
    </div>
  )
}
