import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { loadCsv, num } from './data'
import TimeSeriesChart from './TimeSeriesChart'

const DATASET = ['L_01', 'L_06', 'R_02', 'R_10']
const GREEN = '#0a6670', BLUE = '#c77d1a'

const lastOf = (a) => (a.length ? a[a.length - 1] : 0)

export default function SessionTimeline({ session, datasetPatient }) {
  const [ds, setDs] = useState(DATASET.includes(datasetPatient) ? datasetPatient : 'L_06')
  const [index, setIndex] = useState(null)
  const [fusion, setFusion] = useState(null)
  const [file, setFile] = useState('')
  const [rows, setRows] = useState(null)
  const [device, setDevice] = useState(null)
  const [band, setBand] = useState('mu')
  const [err, setErr] = useState('')

  useEffect(() => {
    setDevice(null)
    supabase.from('session_signals').select('*').eq('session_id', session.id).maybeSingle()
      .then(({ data }) => setDevice(data || null))
  }, [session.id])

  useEffect(() => {
    Promise.all([loadCsv('signals_index.csv'), loadCsv('fusion_results.csv')])
      .then(([i, f]) => { setIndex(i); setFusion(f) })
      .catch((e) => setErr(e.message || String(e)))
  }, [])

  const recs = index ? index.filter((r) => r.patient === ds) : []
  const cur = recs.find((r) => r.csv === file) || recs[0]
  const csvName = cur ? cur.csv : null

  useEffect(() => {
    setRows(null)
    if (!csvName) return
    loadCsv('signals/' + csvName).then(setRows).catch((e) => setErr(e.message || String(e)))
  }, [csvName])

  const curve = session.angle_curve
  const camT = curve && curve.t ? curve.t : []
  const camTmax = lastOf(camT)
  const repMarks = curve && curve.reps ? curve.reps.filter((i) => camT[i] != null).map((i) => ({ t: camT[i], color: BLUE, solid: true })) : []

  // Replayed recording, on its own time axis
  let rep = null
  if (rows && rows.length) {
    const t = rows.map((r) => num(r.t))
    const col = (k) => rows.map((r) => num(r[k]))
    const cues = fusion && cur ? fusion.filter((r) => r.file === cur.recording) : []
    rep = {
      t, tMax: lastOf(t.filter((v) => v !== null)),
      emg: [{ name: 'Left forearm', color: GREEN, t, y: col('emgL') }, { name: 'Right forearm', color: BLUE, t, y: col('emgR') }],
      mu: [{ name: 'Left motor area', color: GREEN, t, y: col('muL') }, { name: 'Right motor area', color: BLUE, t, y: col('muR') }],
      beta: [{ name: 'Left motor area', color: GREEN, t, y: col('betaL') }, { name: 'Right motor area', color: BLUE, t, y: col('betaR') }],
      marks: cues.map((c) => {
        const target = c.truth === true || c.truth === 1 || String(c.truth).toLowerCase() === 'true'
        return { t: num(c.cue_time), color: target ? '#11743a' : '#8aa0a6' }
      }).filter((m) => m.t !== null),
    }
  }

  // Signals recorded together with this session (real hardware, later)
  let dev = null
  if (device && device.series && device.fs > 0) {
    const mk = (key, name, color) => {
      const y = device.series[key]
      return y ? { name, color, t: y.map((_, i) => i / device.fs), y } : null
    }
    const longest = Math.max(0, ...Object.values(device.series).map((a) => a.length / device.fs))
    dev = {
      tMax: Math.max(camTmax, longest),
      emg: [mk('emg_l', 'Left forearm', GREEN), mk('emg_r', 'Right forearm', BLUE)].filter(Boolean),
      mu: [mk('eeg_mu_l', 'Left motor area', GREEN), mk('eeg_mu_r', 'Right motor area', BLUE)].filter(Boolean),
      beta: [mk('eeg_beta_l', 'Left motor area', GREEN), mk('eeg_beta_r', 'Right motor area', BLUE)].filter(Boolean),
    }
  }
  const sig = dev || rep
  const bandSeries = sig ? (band === 'mu' ? sig.mu : sig.beta) : []
  const camSeries = [{ name: 'Elbow angle', color: GREEN, t: camT, y: curve && curve.a ? curve.a : [] }]

  return (
    <div className="card">
      <h3>Session timeline</h3>
      <p className="muted small">Camera and signal charts for this session. Orange rings on the angle chart are the counted repetitions.</p>

      <div className="banner" style={{ background: 'var(--soft)', color: 'var(--primary)' }}>[Measured] Camera, this patient's session{camTmax ? ` (${Math.round(camTmax)} s)` : ''}</div>
      {curve ? (
        <TimeSeriesChart title="Elbow angle" tMax={dev ? dev.tMax : camTmax} series={camSeries}
          markers={repMarks} fmt={(v) => Math.round(v) + '°'} markerLegend={[{ label: 'Counted repetition', color: BLUE }]} />
      ) : <p className="muted">No angle curve was saved for this session.</p>}

      {dev ? (
        <div className="banner" style={{ background: 'var(--soft)', color: 'var(--primary)' }}>[Measured] EMG and EEG recorded together with this session, on the same time axis</div>
      ) : (
        <div className="banner">[Replayed recording] EMG and EEG from a research dataset recording, not from this patient. It has its own time axis{rep ? ` (${Math.round(rep.tMax)} s)` : ''} and is not aligned to the video above.</div>
      )}

      {!dev && (
        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="muted small">Dataset patient</label>
            <select value={ds} onChange={(e) => { setDs(e.target.value); setFile('') }}>
              {DATASET.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="muted small">Recording</label>
            <select value={cur ? cur.csv : ''} onChange={(e) => setFile(e.target.value)}>
              {recs.map((r) => <option key={r.csv} value={r.csv}>Session {r.session} · {r.block} · {Math.round(num(r.duration_s))} s</option>)}
            </select>
          </div>
        </div>
      )}

      {err && <p className="msg-err">{err}</p>}
      {!sig && !err && <p className="muted">Loading signals…</p>}

      {sig && (
        <>
          <TimeSeriesChart title="Muscle activity (EMG), relative to this recording's typical level" tMax={sig.tMax}
            series={sig.emg} markers={rep && !dev ? rep.marks : []} refLine={1} fmt={(v) => v.toFixed(1) + '×'}
            markerLegend={rep && !dev ? [{ label: 'Movement cue', color: '#11743a' }, { label: 'Other cue', color: '#8aa0a6' }] : []}
            note="1× is the typical level. Bursts above it are muscle activity." />
          <div className="row" style={{ margin: '4px 0 8px' }}>
            <span className="muted small">Brain rhythm band</span>
            <select style={{ width: 200, margin: 0 }} value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="mu">8 to 12 Hz</option>
              <option value="beta">13 to 30 Hz</option>
            </select>
          </div>
          <TimeSeriesChart title="Brain rhythm (EEG) over the motor areas, relative to typical" tMax={sig.tMax}
            series={bandSeries} markers={rep && !dev ? rep.marks : []} refLine={1} fmt={(v) => v.toFixed(1) + '×'}
            note="A drop below 1× over the side opposite the moving hand is expected during an attempt. In this dataset the effect was weak, so do not read it alone." />
        </>
      )}
    </div>
  )
}
