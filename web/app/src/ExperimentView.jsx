import { useEffect, useState } from 'react'
import { loadCsv, num } from './data'

const NAMES = {
  clean: 'No damage (all cues)',
  emg_noise_8: 'Muscle noise',
  emg_dropout_1: 'Loose electrode (muscle signal goes flat)',
  eeg_spike_10: 'Brain spikes',
}
const isDam = (v) => v === true || v === 1 || String(v).toLowerCase() === 'true'

function Bar({ label, v, color }) {
  const n = num(v) ?? 0
  return (
    <div className="hbar">
      <span>{label}</span>
      <div className="ht"><div style={{ width: Math.min(100, n) + '%', background: color }} /></div>
      <b>{n.toFixed(1)}%</b>
    </div>
  )
}

export default function ExperimentView() {
  const [share, setShare] = useState('25')
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    setRows(null); setErr('')
    loadCsv(`degradation_results_${share}pct.csv`).then(setRows).catch((e) => setErr(e.message))
  }, [share])

  const groups = rows ? rows.filter((r) => r.condition === 'clean' || isDam(r.damaged)) : []

  return (
    <>
      <div className="banner">[Replayed recording, simulated damage] Recordings from a research dataset were damaged on purpose. This is not patient data.</div>
      <div className="card">
        <h3>Does reliability-aware fusion stay steadier than ordinary fusion?</h3>
        <label className="muted small">Share of cues damaged in each recording</label>
        <select value={share} onChange={(e) => setShare(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="25">25% of cues damaged</option>
          <option value="50">50% of cues damaged</option>
        </select>
        <div className="legend">
          <span><i style={{ background: '#8aa0a6' }} />Wrong: ordinary fusion</span>
          <span><i style={{ background: '#0a6670' }} />Wrong: reliability-aware</span>
          <span><i style={{ background: '#c77d1a' }} />Cues withheld ("can't tell")</span>
        </div>
      </div>
      {err && <p className="msg-err">{err}</p>}
      {!rows && !err && <p className="muted">Loading…</p>}
      {groups.map((r) => (
        <div className="card" key={r.condition + r.damaged}>
          <h3>{NAMES[r.condition] || r.condition} <span className="muted small">({num(r.cues)} cues)</span></h3>
          <Bar label="Wrong: ordinary fusion" v={r.wrongEqual} color="#8aa0a6" />
          <Bar label="Wrong: reliability-aware" v={r.wrongQuality} color="#0a6670" />
          <Bar label="Cues withheld" v={r.withheld} color="#c77d1a" />
          <p className="muted small" style={{ marginBottom: 0 }}>
            Accuracy of the reliability-aware version on the cues it did answer: {num(r.accAnsweredQuality)?.toFixed(1)}%
          </p>
        </div>
      ))}
      <div className="card">
        <h3>How to read this</h3>
        <ul className="small muted">
          <li>Withheld cues count as "not wrong", which flatters the reliability-aware version. Read the withheld bar next to it.</li>
          <li>The loose-electrode result is the damage type the quality score was built to detect, and it is simulated. The gains for muscle noise and brain spikes are about 5 percentage points.</li>
          <li>At 50% damage the method breaks: it withholds many untouched cues too. It only works when most cues in a recording are clean.</li>
          <li>94 recordings from 3 dataset patients. All cut-offs are starting guesses, not tuned values.</li>
        </ul>
      </div>
    </>
  )
}