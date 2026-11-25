const W = 640, PL = 46, PR = 12, PT = 14, PB = 28

// A line chart against time in seconds, with optional vertical markers.
// series: [{ name, color, t: [..], y: [..] }]   markers: [{ t, color, label }]
export default function TimeSeriesChart({ title, tMax, series, markers = [], markerLegend = [], height = 190, fmt, refLine, note }) {
  const H = height
  const all = []
  series.forEach((s) => s.y.forEach((v) => { if (Number.isFinite(v)) all.push(v) }))
  if (!all.length || !(tMax > 0)) {
    return <div style={{ marginBottom: 14 }}><b>{title}</b><p className="muted small">No data.</p></div>
  }
  const f = fmt || ((v) => String(Math.round(v * 10) / 10))
  let lo = Math.min(...all), hi = Math.max(...all)
  if (refLine != null) { lo = Math.min(lo, refLine); hi = Math.max(hi, refLine) }
  const pad = (hi - lo || 1) * 0.08
  lo -= pad; hi += pad
  const x = (t) => PL + (t / tMax) * (W - PL - PR)
  const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB)
  const step = tMax <= 30 ? 5 : tMax <= 90 ? 10 : 20
  const xt = []
  for (let s = 0; s <= tMax; s += step) xt.push(s)
  const yt = [0, 1, 2, 3].map((k) => lo + (k * (hi - lo)) / 3)

  const path = (s) => {
    let d = '', pen = false
    for (let i = 0; i < s.y.length; i++) {
      const v = s.y[i], t = s.t[i]
      if (!Number.isFinite(v) || !Number.isFinite(t)) { pen = false; continue }
      d += (pen ? 'L' : 'M') + x(t).toFixed(1) + ' ' + y(v).toFixed(1) + ' '
      pen = true
    }
    return d
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <b>{title}</b>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={title}>
        {yt.map((g, k) => (
          <g key={k}>
            <line x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} stroke="#dfe6e8" />
            <text x={PL - 6} y={y(g) + 4} textAnchor="end" fontSize="11" style={{ fill: 'var(--muted)' }}>{f(g)}</text>
          </g>
        ))}
        {xt.map((s) => (
          <text key={s} x={x(s)} y={H - 8} textAnchor="middle" fontSize="11" style={{ fill: 'var(--muted)' }}>{s}s</text>
        ))}
        {refLine != null && <line x1={PL} x2={W - PR} y1={y(refLine)} y2={y(refLine)} stroke="#66757a" strokeDasharray="4 4" />}
        {markers.map((m, i) => (
          <line key={i} x1={x(m.t)} x2={x(m.t)} y1={PT} y2={H - PB} stroke={m.color} strokeOpacity="0.75" strokeWidth="1.5" strokeDasharray={m.solid ? undefined : '3 3'} />
        ))}
        {series.map((s) => <path key={s.name} d={path(s)} fill="none" stroke={s.color} strokeWidth="2" />)}
      </svg>
      <div className="legend">
        {series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}
        {markerLegend.map((m) => <span key={m.label}><i style={{ background: m.color }} />{m.label}</span>)}
      </div>
      {note && <p className="muted small" style={{ margin: '4px 0 0' }}>{note}</p>}
    </div>
  )
}
