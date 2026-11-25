import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { STATUS_LABEL } from './criteria'
import SessionDetail from './SessionDetail'
import SessionTimeline from './SessionTimeline'

function StatusPill({ status }) {
  const label = STATUS_LABEL[status] || status
  if (status === 'met') return <span className="pill">{label}</span>
  if (status === 'partly' || status === 'not_met') return <span className="pill pill-warn">{label}</span>
  return <span className="muted small" style={{ fontWeight: 700 }}>{label}</span>
}

const count = (res, st) => (res || []).filter((r) => r.status === st).length

export default function SessionReview({ sessions, sessionId, onSelect, datasetPatient }) {
  const s = sessions.find((x) => x.id === sessionId) || sessions[sessions.length - 1]
  const sid = s ? s.id : null
  const [note, setNote] = useState('')
  const [plan, setPlan] = useState('')
  const [saved, setSaved] = useState('')
  const [fb, setFb] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setNote(''); setPlan(''); setSaved(''); setFb({})
    if (!sid) return
    supabase.from('session_reviews').select('*').eq('session_id', sid).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNote(data.note || ''); setPlan(data.plan || ''); setFb(data.ai_feedback || {})
          setSaved('Last saved ' + new Date(data.reviewed_at).toLocaleString())
        }
      })
  }, [sid])

  if (!s) return <div className="card"><p className="muted">No sessions recorded yet for this patient.</p></div>

  async function save() {
    setBusy(true); setSaved('')
    const { error } = await supabase.from('session_reviews').upsert({
      session_id: s.id, patient_id: s.patient_id,
      note: note.trim() || null, plan: plan.trim() || null,
      ai_feedback: Object.values(fb).some(Boolean) ? JSON.parse(JSON.stringify(fb)) : null,
      reviewed_at: new Date().toISOString(),
    }, { onConflict: 'session_id' })
    setBusy(false)
    setSaved(error ? 'Could not save: ' + error.message : 'Saved')
  }

  const ok = s.status === 'recorded'
  const ai = s.ai_observations && Array.isArray(s.ai_observations.results) ? s.ai_observations : null
  const aiMap = Object.fromEntries((ai ? ai.results : []).map((r) => [r.id, r]))
  const res = (s.criteria_results || []).map((r) => {
    const a = r.type === 'custom' ? aiMap[r.id] : null
    return a ? { ...r, status: a.status, detail: `${a.reason} (confidence: ${a.confidence})`, source: 'ai' } : r
  })
  const hasAi = res.some((r) => r.source === 'ai')
  const m = s.metrics
  const withResults = sessions.filter((x) => Array.isArray(x.criteria_results) && x.criteria_results.length)

  return (
    <>
      <div className="card">
        <label className="muted small">Session</label>
        <select value={s.id} onChange={(e) => onSelect(e.target.value)}>
          {[...sessions].reverse().map((x) => (
            <option key={x.id} value={x.id}>
              {new Date(x.created_at).toLocaleString()} · {x.status === 'recorded' ? x.repetitions + ' repetitions' : 'not tracked'}{x.clip_path ? ' · video' : ''}
            </option>
          ))}
        </select>
        <p className="muted small" style={{ marginBottom: 0 }}>{sessions.length} session{sessions.length === 1 ? '' : 's'} recorded. Pick any to review it.</p>
      </div>

      <SessionDetail session={s} />

      <SessionTimeline session={s} datasetPatient={datasetPatient} />

      <div className="card scroll">
        <h3>Checks set for this exercise</h3>
        {!res.length ? (
          <p className="muted" style={{ marginBottom: 0 }}>No checks were set for this session. Add them under Exercises and they apply to the next session.</p>
        ) : (
          <>
            <table>
              <thead><tr><th>Check</th><th>Result</th><th>Evidence</th><th>Source</th>{hasAi && <th>Your view</th>}</tr></thead>
              <tbody>
                {res.map((r) => (
                  <tr key={r.id}>
                    <td>{r.label}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td>{r.detail}</td>
                    <td><span className="small muted">{r.source === 'ai' ? 'AI-observed, unverified' : 'Measured'}</span></td>
                    {hasAi && (
                      <td>
                        {r.source === 'ai' && ['agree', 'disagree'].map((v) => (
                          <button key={v} type="button" className={fb[r.id] === v ? 'btn' : 'btn btn-ghost'}
                            style={{ padding: '3px 8px', marginRight: 4 }}
                            onClick={() => setFb((f) => ({ ...f, [r.id]: f[r.id] === v ? undefined : v }))}>{v === 'agree' ? 'Agree' : 'Disagree'}</button>
                        ))}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {hasAi && <p className="muted small">AI-observed rows come from a few still pictures sampled from the session and are unverified. Mark whether you agree, then save your review below.</p>}
            <p className="muted small" style={{ marginBottom: 0 }}>"Can't tell" means the camera could not support a judgement, for example because the arm or shoulders were not clearly visible. It is not a failure by the patient.</p>
          </>
        )}
      </div>

      {ok && m && Array.isArray(m.rep_max) && m.rep_max.length > 0 && (
        <div className="card scroll">
          <h3>Repetition by repetition</h3>
          <table>
            <thead><tr><th>Repetition</th><th>Straightest (°)</th><th>Most bent (°)</th><th>Time since previous (s)</th></tr></thead>
            <tbody>
              {m.rep_max.map((mx, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{mx ?? '–'}</td>
                  <td>{m.rep_min[i] ?? '–'}</td>
                  <td>{i === 0 ? '–' : (m.rep_periods[i - 1] ?? '–')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small" style={{ marginBottom: 0 }}>[Measured] Camera estimates. Typical error was about 2° under good conditions on the MATLAB version of the tracker; the browser version has not been checked against a protractor yet.</p>
        </div>
      )}

      {withResults.length > 1 && (
        <div className="card scroll">
          <h3>Checks across sessions</h3>
          <table>
            <thead><tr><th>Session</th><th>Met</th><th>Partly met</th><th>Not met</th><th>Can't tell</th></tr></thead>
            <tbody>
              {withResults.map((x) => (
                <tr key={x.id} onClick={() => onSelect(x.id)} style={{ cursor: 'pointer', background: x.id === s.id ? 'var(--soft)' : undefined }}>
                  <td>{new Date(x.created_at).toLocaleString()}</td>
                  <td>{count(x.criteria_results, 'met')}</td>
                  <td>{count(x.criteria_results, 'partly')}</td>
                  <td>{count(x.criteria_results, 'not_met')}</td>
                  <td>{count(x.criteria_results, 'cannot_tell')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small" style={{ marginBottom: 0 }}>Counts of checks, not a score. A single session is a small sample, so look for a pattern across several before changing the programme.</p>
        </div>
      )}

      <div className="card">
        <h3>Your review</h3>
        <label className="muted small">What you observed</label>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <label className="muted small">What to change in the next exercise instruction</label>
        <textarea rows={3} value={plan} onChange={(e) => setPlan(e.target.value)} />
        <div className="row">
          <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save review'}</button>
          <span className="muted small">{saved}</span>
        </div>
      </div>
    </>
  )
}
