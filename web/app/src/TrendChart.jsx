const W = 640, H = 250, PL = 52, PR = 14, PT = 14, PB = 34
const COLORS = ['#0a6670', '#c77d1a']

export default function TrendChart({ title, note, sessions, series, fixedRange, refLine, fmt }) {
  const f = fmt || ((v) => String(Math.round(v * 10) / 10))
  const all = []
  series.forEach((s) => s.values.forEach((p) => {
    if (p) { all.push(p.y); if (p.lo != null) all.push(p.lo); if (p.hi != null) all.push(p.hi) }
  }))
  if (refLine != null) all.push(refLine)
  if (!all.length) {
    return <div className="card"><h3>{title}</h3><p className="muted">No data for this patient.</p></div>
  }
  let lo = fixedRange ? fixedRange[0] : Math.min(...all)
  let hi = fixedRange ? fixedRange[1] : Math.max(...all)
  if (!fixedRange) { const pad = (hi - lo || 1) * 0.12; lo -= pad; hi += pad }
  const n = sessions.length
  const x = (i) => (n === 1 ? (PL + W - PR) / 2 : PL + (i * (W - PL - PR)) / (n - 1))
  const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB)
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + (k * (hi - lo)) / 4)

  return (
    <div className="card">
      <h3>{title}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={title}>
        {ticks.map((t, k) => (
          <g key={k}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#dfe6e8" />
            <text x={PL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" style={{ fill: 'var(--muted)' }}>{f(t)}</text>
          </g>
        ))}
        {refLine != null && (
          <line x1={PL} x2={W - PR} y1={y(refLine)} y2={y(refLine)} stroke="#66757a" strokeDasharray="4 4" />
        )}
        {sessions.map((s, i) => (
          <text key={s} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" style={{ fill: 'var(--muted)' }}>S{s}</text>
        ))}
        {series.map((s, si) => {
          const color = s.color || COLORS[si % COLORS.length]
          const pts = s.values.map((p, i) => (p ? [x(i), y(p.y)] : null))
          const d = pts.filter(Boolean).map((p, k) => (k ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ')
          return (
            <g key={s.name}>
              {d && <path d={d} fill="none" stroke={color} strokeWidth="2.5" />}
              {s.values.map((p, i) => p && p.lo != null && p.hi != null && (
                <g key={'w' + i} stroke={color} strokeOpacity="0.55" strokeWidth="2">
                  <line x1={x(i)} x2={x(i)} y1={y(p.hi)} y2={y(p.lo)} />
                  <line x1={x(i) - 5} x2={x(i) + 5} y1={y(p.hi)} y2={y(p.hi)} />
                  <line x1={x(i) - 5} x2={x(i) + 5} y1={y(p.lo)} y2={y(p.lo)} />
                </g>
              ))}
              {pts.map((p, i) => p && (
                <circle key={'c' + i} cx={p[0]} cy={p[1]} r="4.5" fill={color}>
                  <title>{s.name + ', session ' + sessions[i] + ': ' + f(s.values[i].y)}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="legend">
        {series.map((s, si) => (
          <span key={s.name}><i style={{ background: s.color || COLORS[si % COLORS.length] }} />{s.name}</span>
        ))}
      </div>
      {note && <p className="muted small" style={{ marginBottom: 0 }}>{note}</p>}
    </div>
  )
}