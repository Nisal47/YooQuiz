import { useEffect, useState, useRef } from 'react'

const SIZE   = 120
const STROKE = 10
const R      = (SIZE - STROKE) / 2
const CIRC   = 2 * Math.PI * R

/**
 * Circular countdown timer.
 * @param {number}   total        total seconds
 * @param {number}   startedAt    epoch ms when the question was launched
 * @param {boolean}  running      whether to count down
 * @param {function} onExpire     called once when time hits 0
 */
export default function Timer({ total, startedAt, running = true, onExpire }) {
  const [remaining, setRemaining] = useState(total)
  const expiredRef = useRef(false)

  useEffect(() => {
    expiredRef.current = false
    setRemaining(total)
  }, [startedAt, total])

  useEffect(() => {
    if (!running || !startedAt) return

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const left    = Math.max(0, total - elapsed)
      setRemaining(left)

      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire?.()
      }
    }

    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [running, startedAt, total, onExpire])

  const pct    = remaining / total
  const offset = CIRC * (1 - pct)

  // Color: green → yellow → red
  let ringColor = '#00F5D4'
  if (pct <= 0.25) ringColor = '#FF4D6D'
  else if (pct <= 0.5) ringColor = '#FFD60A'

  const secs = Math.ceil(remaining)

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />
        {/* Fill */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          className="timer-ring-fill"
          style={{ filter: `drop-shadow(0 0 6px ${ringColor})` }}
        />
      </svg>
      {/* Counter overlaid in center */}
      <div
        className="absolute font-orbitron font-bold text-2xl"
        style={{ color: ringColor, textShadow: `0 0 12px ${ringColor}` }}
      >
        {secs}
      </div>
    </div>
  )
}

/** Wrapper that keeps the number centred inside the SVG ring. */
export function TimerRing({ total, startedAt, running, onExpire }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Timer total={total} startedAt={startedAt} running={running} onExpire={onExpire} />
    </div>
  )
}
