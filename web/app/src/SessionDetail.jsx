import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function AngleCurve({ curve }) {
  const W = 640, H = 220, PL = 40, PR = 10, PT = 10, PB = 28
  const t = curve.t || [], a = curve.a || []
  const tmax = Math.max(1, t[t.length - 1] || 1)
  const x = (v) => PL + (v / tmax) * (W - PL - PR)
  const y = (v) => PT + (1 - v / 180) * (H - PT - PB)
  let d = '', pen = false
  a.forEach((v, i) => {
    if (v == null || t[i] == null) { pen = false; return }
    d += (pen ? 'L' : 'M') + x(t[i]).toFixed(1) + ' ' + y(v).toFixed(1) + ' '
    pen = true
  })
  const reps = (curve.reps || []).filter((i) => a[i] != null && t[i] != null)
  const xt = []
  for (let s = 0; s <= tmax; s += 10) xt.push(s)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Elbow angle over time">
      {[0, 45, 90, 135, 180].map((g) => (
        <g key={g}>
          <line x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} stroke="#dfe6e8" />
          <text x={PL - 6} y={y(g) + 4} textAnchor="end" fontSize="11" style={{ fill: 'var(--muted)' }}>{g}°</text>
        </g>
      ))}
      {xt.map((s) => (
        <text key={s} x={x(s)} y={H - 8} textAnchor="middle" fontSize="11" style={{ fill: 'var(--muted)' }}>{s}s</text>
      ))}
      {d && <path d={d} fill="none" stroke="#0a6670" strokeWidth="2.5" />}
      {reps.map((i) => (
        <circle key={i} cx={x(t[i])} cy={y(a[i])} r="6" fill="none" stroke="#c77d1a" strokeWidth="3" />
      ))}
    </svg>
  )
}

export default function SessionDetail({ session, onClose }) {
  const [url, setUrl] = useState(null)
  const [err, setErr] = useState('')
  const ok = session.status === 'recorded'

  useEffect(() => {
    setUrl(null); setErr('')
    if (!session.clip_path) return
    supabase.storage.from('clips').createSignedUrl(session.clip_path, 3600)
      .then(({ data, error }) => { if (error) setErr(error.message); else setUrl(data.signedUrl) })
  }, [session.id, session.clip_path])

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Session on {new Date(session.created_at).toLocaleString()}</h3>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
      <p>
        {ok
          ? <>[Measured] {session.repetitions} repetitions, range of motion {Math.round(session.range_of_motion_deg)}°, arm tracked in {Math.round((session.visibility || 0) * 100)}% of frames.</>
          : <>No numbers are given for this session because the arm was tracked in only {Math.round((session.visibility || 0) * 100)}% of frames. The video and curve below let you see what happened.</>}
      </p>
      <div className="grid2">
        <div className="videobox">
          <h3>Video</h3>
          {!session.clip_path && <p className="muted">No video. The patient did not choose to save one for this session.</p>}
          {session.clip_path && !url && !err && <p className="muted">Loading video…</p>}
          {err && <p className="msg-err">{err}</p>}
          {url && <video src={url} controls playsInline />}
        </div>
        <div>
          <h3>Elbow angle over time</h3>
          {session.angle_curve
            ? <AngleCurve curve={session.angle_curve} />
            : <p className="muted">No angle curve was saved for this session.</p>}
          <p className="muted small">Orange rings mark the counted repetitions. Gaps in the line are moments the arm was not tracked well. This is a camera estimate, not a clinical measurement.</p>
        </div>
      </div>
    </div>
  )
}