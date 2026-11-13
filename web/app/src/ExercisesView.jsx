import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ExerciseGuide from './ExerciseGuide'

function validUrl(s) {
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

export default function ExercisesView({ patientId, patientName }) {
  const [list, setList] = useState([])
  const [target, setTarget] = useState(8)
  const [instruction, setInstruction] = useState('Sit upright with your arm out to the side. Bend and straighten slowly.')
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

  async function assign(e) {
    e.preventDefault()
    setErr(''); setOk('')
    const n = Number(target)
    if (!Number.isInteger(n) || n < 1 || n > 50) { setErr('Repetitions must be a whole number from 1 to 50.'); return }
    const l = link.trim()
    if (l && !validUrl(l)) { setErr('The video link must start with http:// or https://'); return }
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
      instruction: instruction.trim() || null, video_url: l || null, video_path: videoPath, active: true,
    }).select().single()
    if (error) { setBusy(false); setErr(error.message); return }
    await supabase.from('exercises').update({ active: false }).eq('patient_id', patientId).neq('id', data.id)
    setBusy(false)
    setOk('Assigned. The patient will see it on their Home page.')
    setLink(''); setFile(null); setFileKey((k) => k + 1)
    load()
  }

  async function remove(x) {
    if (!window.confirm('Remove this exercise?')) return
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
        <p className="muted small">Exercise: Elbow bend. This is the exercise the camera can track and count. The newest assignment replaces the current one on the patient's Home page.</p>
        <label className="muted small">Repetitions</label>
        <input type="number" min="1" max="50" value={target} onChange={(e) => setTarget(e.target.value)} style={{ maxWidth: 140 }} />
        <label className="muted small">Instructions for the patient</label>
        <textarea rows={3} value={instruction} onChange={(e) => setInstruction(e.target.value)} />
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
          <ExerciseGuide exercise={active} />
        </div>
      )}

      <div className="card scroll">
        <h3>Assignment history</h3>
        {list.length === 0 ? <p className="muted">Nothing assigned yet. The patient sees a default elbow-bend exercise.</p> : (
          <table>
            <thead><tr><th>Assigned</th><th>Repetitions</th><th>Video</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>{new Date(x.created_at).toLocaleString()}</td>
                  <td>{x.target_reps}</td>
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