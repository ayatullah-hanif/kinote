import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ExerciseGuide from './ExerciseGuide'
import { CRITERIA_TYPES, describeCriterion } from './criteria'

function validUrl(s) {
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

const initCrit = () => Object.fromEntries(
  Object.entries(CRITERIA_TYPES).map(([k, t]) => [k, { on: k === 'reps', value: t.value }]),
)

export default function ExercisesView({ patientId, patientName }) {
  const [list, setList] = useState([])
  const [target, setTarget] = useState(8)
  const [instruction, setInstruction] = useState('Sit upright with your arm out to the side. Bend and straighten slowly.')
  const [crit, setCrit] = useState(initCrit)
  const [custom, setCustom] = useState([])
  const [customText, setCustomText] = useState('')
  const [link, setLink] = useState('')
  const [file, setFile] = useState(null)
  const [fileKey, setFileKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  async function load() {
    const { data, error } = await supabase.from('exercises').select('*')
      .eq('patient_id', patientId).order('created_at', { ascending: false })
    if (error) setErr(error.message); else setList(data || [])
  }
  useEffect(() => { load() }, [patientId])

  function setC(type, patch) { setCrit((c) => ({ ...c, [type]: { ...c[type], ...patch } })) }
  function addCustom() {
    const t = customText.trim()
    if (!t) return
    setCustom((c) => [...c, t]); setCustomText('')
  }

  async function assign(e) {
    e.preventDefault()
    setErr(''); setOk('')
    const n = Number(target)
    if (!Number.isInteger(n) || n < 1 || n > 50) { setErr('Repetitions must be a whole number from 1 to 50.'); return }
    const l = link.trim()
    if (l && !validUrl(l)) { setErr('The video link must start with http:// or https://'); return }

    const criteria = []
    for (const [type, c] of Object.entries(crit)) {
      if (!c.on) continue
      const t = CRITERIA_TYPES[type]
      const v = type === 'reps' ? n : Number(c.value)
      if (!Number.isFinite(v) || v < t.min || v > t.max) {
        setErr(`"${t.label}" needs a value between ${t.min} and ${t.max}.`); return
      }
      criteria.push({ id: type, type, value: v })
    }
    custom.forEach((text, i) => criteria.push({ id: 'custom' + i, type: 'custom', text }))

    setBusy(true)
    let videoPath = null
    if (file) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${patientId}/${Date.now()}-${safe}`
      const { error: upErr } = await supabase.storage.from('exercise-videos')
        .upload(path, file, { contentType: file.type })
      if (upErr) { setBusy(false); setErr('Video upload failed: ' + upErr.message); return }
      videoPath = path
    }
    const { data, error } = await supabase.from('exercises').insert({
      patient_id: patientId, name: 'Elbow bend', target_reps: n,
      instruction: instruction.trim() || null, video_url: l || null, video_path: videoPath,
      criteria, active: true,
    }).select().single()
    if (error) { setBusy(false); setErr(error.message); return }
    await supabase.from('exercises').update({ active: false }).eq('patient_id', patientId).neq('id', data.id)
    setBusy(false)
    setOk('Assigned. The patient will see it, with the checks, on their Home page.')
    setLink(''); setFile(null); setFileKey((k) => k + 1)
    load()
  }

  async function remove(x) {
    if (!window.confirm('Remove this exercise? Sessions already recorded keep their results.')) return
    const { error } = await supabase.from('exercises').delete().eq('id', x.id)
    if (error) { setErr(error.message); return }
    if (x.video_path) await supabase.storage.from('exercise-videos').remove([x.video_path])
    load()
  }

  const active = list.find((x) => x.active)

  return (
    <>
      <form className="card" onSubmit={assign}>
        <h3>Assign an exercise to {patientName}</h3>
        <p className="muted small">Exercise: Elbow bend, the movement the camera can track. The newest assignment replaces the current one on the patient's Home page.</p>
        <label className="muted small">Repetitions</label>
        <input type="number" min="1" max="50" value={target} onChange={(e) => setTarget(e.target.value)} style={{ maxWidth: 140 }} />
        <label className="muted small">Instructions for the patient</label>
        <textarea rows={3} value={instruction} onChange={(e) => setInstruction(e.target.value)} />

        <h3 style={{ marginTop: 14 }}>What should be checked after each session</h3>
        <p className="muted small">Tick what you want checked. The camera measures these from the patient's session, and the result shows on the session review as met, partly met, not met, or can't tell.</p>
        {Object.entries(CRITERIA_TYPES).map(([type, t]) => (
          <div key={type} className="row" style={{ margin: '6px 0', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 240 }}>
              <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={crit[type].on}
                onChange={(e) => setC(type, { on: e.target.checked })} />
              {t.label}
            </label>
            {type === 'reps' ? (
              <span className="muted small">{target} repetitions (from the number above)</span>
            ) : (
              <span className="row" style={{ gap: 6 }}>
                <input type="number" step="any" style={{ width: 90 }} disabled={!crit[type].on}
                  value={crit[type].value} onChange={(e) => setC(type, { value: e.target.value })} />
                <span className="muted small">{t.unit}</span>
              </span>
            )}
          </div>
        ))}

        <label className="muted small" style={{ display: 'block', marginTop: 12 }}>Other things to look for (judged visually, not measured)</label>
        {custom.map((t, i) => (
          <div key={i} className="row" style={{ margin: '4px 0' }}>
            <span style={{ flex: 1 }}>{t}</span>
            <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px' }}
              onClick={() => setCustom((c) => c.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <div className="row">
          <input placeholder="For example: keep the trunk upright" value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} />
          <button type="button" className="btn btn-ghost" onClick={addCustom}>Add</button>
        </div>
        <p className="muted small">Visual checks are looked at by an AI model only if the patient agrees at the start of a session, using a few still pictures. The doctor can agree or disagree with each judgement on the session review.</p>

        <label className="muted small">Video link (YouTube or any web address, optional)</label>
        <input placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
        <label className="muted small">Or upload a video (MP4 or WebM, up to 30 MB, optional)</label>
        <input key={fileKey} type="file" accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => setFile(e.target.files[0] || null)} />
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Assigning…' : 'Assign exercise'}</button>
        <p className="msg-err">{err}</p>
        {ok && <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{ok}</p>}
      </form>

      {active && (
        <div className="card">
          <h3>What the patient sees now</h3>
          <p><b>{active.name} · {active.target_reps} repetitions</b></p>
          <p>{active.instruction}</p>
          {(active.criteria || []).length > 0 && (
            <ul className="small">{active.criteria.map((c) => <li key={c.id}>{describeCriterion(c)}</li>)}</ul>
          )}
          <ExerciseGuide exercise={active} />
        </div>
      )}

      <div className="card scroll">
        <h3>Assignment history</h3>
        {list.length === 0 ? <p className="muted">Nothing assigned yet. The patient sees a default elbow-bend exercise.</p> : (
          <table>
            <thead><tr><th>Assigned</th><th>Repetitions</th><th>Checks</th><th>Video</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>{new Date(x.created_at).toLocaleString()}</td>
                  <td>{x.target_reps}</td>
                  <td>{(x.criteria || []).length}</td>
                  <td>{x.video_path ? 'Uploaded' : x.video_url ? 'Link' : 'None'}</td>
                  <td>{x.active ? <span className="pill">Current</span> : <span className="muted small">Replaced</span>}</td>
                  <td><button type="button" className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={() => remove(x)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
