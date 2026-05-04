import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS  = ['#6C63FF', '#00F5D4', '#FF6B6B', '#FFD60A']
const LABELS  = ['A', 'B', 'C', 'D']

export default function LiveResultsChart({ options, responses, correctIndex, revealed }) {
  // Count votes per option
  const counts = options.map((_, i) =>
    Object.values(responses).filter(r => r.value === i).length
  )
  const total = counts.reduce((s, c) => s + c, 0)

  const data = options.map((label, i) => ({
    name:  LABELS[i],
    label,
    count: counts[i],
    pct:   total > 0 ? Math.round((counts[i] / total) * 100) : 0,
  }))

  return (
    <div className="space-y-2">
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="20%">
          <XAxis dataKey="name" tick={{ fill: '#8B8BA0', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
            formatter={(v, _name, props) => [`${v} votes (${props.payload.pct}%)`, props.payload.label]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={revealed && i === correctIndex ? '#00F5D4' : COLORS[i % COLORS.length]}
                opacity={revealed && i !== correctIndex ? 0.35 : 1}
                style={revealed && i === correctIndex ? { filter: 'drop-shadow(0 0 8px rgba(0,245,212,0.7))' } : {}}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Option labels with counts */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {data.map((d, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-center transition-all border
              ${revealed && i === correctIndex
                ? 'border-secondary bg-secondary/15'
                : revealed
                  ? 'border-white/5 opacity-40'
                  : 'border-white/10 bg-surface'}`}
          >
            <div className="text-xs text-text-secondary mb-0.5">{LABELS[i]}</div>
            <div className="font-orbitron font-bold text-lg" style={{ color: COLORS[i % COLORS.length] }}>
              {d.count}
            </div>
            <div className="text-xs text-text-secondary">{d.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
