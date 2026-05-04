/**
 * Small pill showing live participant / response count.
 */
export default function ParticipantCount({ count, label = 'participants' }) {
  return (
    <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-full px-4 py-1.5">
      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
      <span className="font-orbitron text-sm font-semibold text-secondary">{count}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  )
}
