import { useEffect, useState } from 'react'
import { loadCsv, num } from './data'
import TrendChart from './TrendChart'

const DATASET = ['L_01', 'L_06', 'R_02', 'R_10']
const VERDICT = {
  'no earlier session': ['First session, nothing to compare', false],
  'no reliable change': ['No reliable change', false],
  'clear rise': ['Attempt rate rose, beyond chance', false],
  'clear fall': ['Attempt rate fell, beyond chance', false],
  'not enough data': ['Not enough reliable data to compare', true],
}
const pct = (v) => { const n = num(v); return n === null ? null : n * 100 }

export default function SignalsView({ defaultPatient }) {
  const [ds, setDs] = useState(DATASET.includes(defaultPatient) ? defaultPatient : 'L_06')
  const [mode, setMode] = useState('clean')
  const [sess, setSess] = useState(null)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      loadCsv('fusion_results.csv'), loadCsv('fusion_results_degraded.csv'),
      loadCsv('insights.csv'), loadCsv('session_summary.csv'),
    ]).then(([clean, deg, ins, sum]) => setData({ clean, deg, ins, sum }))
      .catch((e) => setErr(e.message || String(e)))
  }, [])

  if (err) return <div className="card"><p className="msg-err">{err}</p></div>
  if (!data) return <div className="card"><p className="muted">Loading signal results…</p></div>

  const degAvail = data.deg.some((r) => r.patient === ds)
  const effMode = mode === 'degraded' && degAvail ? 'degraded' : 'clean'
  const rows = (effMode === 'degraded' ? data.deg : data.clean).filter((r) => r.patient === ds)
  const sessions = [...new Set(rows.map((r) => r.session))].sort((a, b) => a - b)
  const cur = sessions.includes(sess) ? sess : sessions[sessions.length - 1]
  const cues = rows.filter((r) => r.session === cur).sort((a, b) => a.cue_time - b.cue_time)
  const lines = data.ins
    .filter((r) => r.mode === effMode && r.patient === ds && r.session === cur)
    .sort((a, b) => a.line_no - b.line_no)

  const sum = data.sum.filter((r) => r.patient === ds).sort((a, b) => a.session - b.session)
  const xs = sum.map((r) => r.session)
  const attempt = [{
    name: 'Detected attempt rate (%)',
    values: sum.map((r) => {
      const y = pct(r.attempt_rate); if (y === null) return null
      const m = (num(r.margin) || 0) * 100
      return { y, lo: Math.max(0, y - m), hi: Math.min(100, y + m) }
    }),
  }]
  const two = (a, b, na, nb) => [
    { name: na, values: sum.map((r) => (num(r[a]) === null ? null : { y: num(r[a]) })) },
    { name: nb, values: sum.map((r) => (num(r[b]) === null ? null : { y: num(r[b]) })) },
  ]
  const quality = [
    { name: 'Median trust (%)', values: sum.map((r) => (pct(r.median_trust) === null ? null : { y: pct(r.median_trust) })) },
    { name: 'Cues withheld (%)', values: sum.map((r) => (pct(r.withheld_share) === null ? null : { y: pct(r.withheld_share) })) },
  ]

  const banner = effMode === 'degraded'
    ? `[Replayed recording, simulated damage] A loose muscle electrode was added to 25% of the cues in ${ds} session ${cur} to test how the system reacts.`
    : `[Replayed recording] Results from research dataset patient ${ds}, not this patient's live session.`

  return (
    <>
      <div className="banner">{banner}</div>
      <div className="card row" style={{ flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="muted small">Replayed dataset patient</label>
          <select value={ds} onChange={(e) => { setDs(e.target.value); setSess(null) }}>
            {DATASET.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="muted small">Recording</label>
          <select value={effMode} onChange={(e) => { setMode(e.target.value); setSess(null) }}>
            <option value="clean">Clean replay</option>
            <option value="degraded" disabled={!degAvail}>Degraded replay{degAvail ? '' : ' (L_06 only)'}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="muted small">Session</label>
          <select value={cur ?? ''} onChange={(e) => setSess(Number(e.target.value))}>
            {sessions.map((s) => <option key={s} value={s}>Session {s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <h3>Summary</h3>
        {lines.map((l, i) => (
          l.tag === 'Note'
            ? <p key={i} className="muted small tagline">{l.text}</p>
            : <p key={i} className="tagline"><span className="pill">{l.tag}</span> {l.text}</p>
        ))}
      </div>

      <h3>Trends across sessions (clean replay)</h3>
      <div className="grid2">
        <TrendChart title="Detected movement-attempt rate" sessions={xs} series={attempt}
          fixedRange={[0, 100]} fmt={(v) => Math.round(v) + '%'}
          note="Bars show the uncertainty from the number of cues. A change inside the bars is not reported as a change." />
        <TrendChart title="Muscle response (forearm activity ratio)" sessions={xs} refLine={1}
          series={two('emg_ratio_movement', 'emg_ratio_other', 'Movement cues', 'Other cues')}
          fmt={(v) => v.toFixed(1)}
          note="1 means no change from baseline. A clear gap between the lines means the muscle responded on movement cues." />
        <TrendChart title="Brain rhythm change (motor area, %)" sessions={xs} refLine={0}
          series={two('mu_change_movement', 'mu_change_other', 'Movement cues', 'Other cues')}
          fmt={(v) => Math.round(v) + '%'}
          note="A drop is expected during an attempt. In this dataset this feature separated attempts from other cues only weakly, so do not read it alone." />
        <TrendChart title="Recording quality" sessions={xs} series={quality}
          fixedRange={[0, 100]} fmt={(v) => Math.round(v) + '%'}
          note="Shows how far to trust the other charts. High withheld shares mean many cues were too poor to use." />
      </div>

      <div className="card scroll">
        <h3>Session comparison</h3>
        <table>
          <thead><tr><th>Session</th><th>Attempt rate</th><th>± margin</th><th>Answered cues</th><th>Withheld</th><th>Against previous session</th></tr></thead>
          <tbody>
            {sum.map((r) => {
              const v = VERDICT[r.verdict] || [String(r.verdict), false]
              return (
                <tr key={r.session}>
                  <td>{r.session}</td>
                  <td>{Math.round((num(r.attempt_rate) || 0) * 100)}%</td>
                  <td>{Math.round((num(r.margin) || 0) * 100)}</td>
                  <td>{num(r.n_target_answered)}</td>
                  <td>{Math.round((num(r.withheld_share) || 0) * 100)}%</td>
                  <td><span className={v[1] ? 'pill pill-warn' : 'pill'}>{v[0]}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="muted small">The attempt rate moves by 20 to 40 points between sessions in this data, and the model is right about 73% of the time on single cues. "No reliable change" is therefore the expected result, and "rose" or "fell" describes the recordings only, not recovery.</p>
      </div>

      <div className="card">
        <h3>Cue by cue, session {cur}</h3>
        <p className="muted small">Single cues are noisy. Read the summary above rather than individual rows.</p>
        <div className="scroll tall">
          <table>
            <thead>
              <tr><th>Cue time (s)</th><th>Cue</th><th>Recording</th><th>State</th><th>Fused score</th><th>Trust</th>{effMode === 'degraded' && <th>Damage</th>}</tr>
            </thead>
            <tbody>
              {cues.map((r, i) => {
                const w = r.state === "can't tell"
                const fused = num(r.fused)
                return (
                  <tr key={i} className={w ? 'row-warn' : ''}>
                    <td>{num(r.cue_time)?.toFixed(1)}</td>
                    <td>{r.cue}</td>
                    <td>{r.block}</td>
                    <td>{r.state}</td>
                    <td>{w ? 'withheld' : fused === null ? '' : fused.toFixed(2)}</td>
                    <td>{num(r.trust)?.toFixed(2)}</td>
                    {effMode === 'degraded' && <td>{num(r.damaged) === 1 || r.damaged === true ? 'simulated' : ''}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}