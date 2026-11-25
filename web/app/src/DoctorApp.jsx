import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { displayName } from './constants'
import Shell from './Shell'
import SessionsView from './SessionsView'
import SessionReview from './SessionReview'
import MessagesView from './MessagesView'
import SignalsView from './SignalsView'
import ResearchView from './ResearchView'
import ExercisesView from './ExercisesView'

export default function DoctorApp({ profile, onSwitch }) {
  const [tab, setTab] = useState('Sessions')
  const [patients, setPatients] = useState([])
  const [sel, setSel] = useState('')
  const [sessions, setSessions] = useState([])
  const [selSession, setSelSession] = useState('')
  const [perr, setPerr] = useState('')

  function loadPatients() {
    return supabase.from('profiles').select('*').eq('role', 'patient').order('created_at')
      .then(({ data, error }) => {
        if (error) { setPerr(error.message); return }
        setPerr('')
        setPatients(data || [])
        setSel((cur) => cur || (data && data[0] ? data[0].id : ''))
      })
  }

  useEffect(() => { loadPatients() }, [tab])
  useEffect(() => { setSelSession('') }, [sel])

  useEffect(() => {
    if (!sel) { setSessions([]); return }
    supabase.from('sessions').select('*').eq('patient_id', sel)
      .order('created_at', { ascending: true }).then(({ data }) => setSessions(data || []))
  }, [sel, tab])

  const current = patients.find((p) => p.id === sel)

  return (
    <Shell profile={profile} roleLabel="Physiotherapist"
      tabs={['Sessions', 'Exercises', 'Muscle and brain signals', 'Research', 'Messages']} active={tab} onTab={setTab}
      onSwitch={onSwitch} switchLabel="Switch to patient view">
      <h2>Physiotherapist dashboard</h2>
      {tab === 'Research' ? (
        <ResearchView />
      ) : patients.length === 0 ? (
        <div className="card">
          <p className="muted">No patients have signed up yet.</p>
          <p className="msg-err">{perr}</p>
          <button className="btn btn-ghost" onClick={loadPatients}>Refresh list</button>
        </div>
      ) : (
        <>
          <div className="card">
            <label className="muted small">Patient ({patients.length} signed up)</label>
            <div className="row">
              <select style={{ margin: 0 }} value={sel} onChange={(e) => setSel(e.target.value)}>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{displayName(p)}{p.first_name ? ' (' + p.email + ')' : ''}</option>
                ))}
              </select>
              <button className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }} onClick={loadPatients}>Refresh list</button>
            </div>
            <p className="msg-err">{perr}</p>
          </div>
          {tab === 'Sessions' && (
            <>
              <SessionReview sessions={sessions} sessionId={selSession} onSelect={setSelSession} datasetPatient={current?.dataset_patient} />
              <h3 style={{ margin: '22px 0 10px' }}>All sessions</h3>
              <SessionsView sessions={sessions}
                onOpen={(x) => { setSelSession(x.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                openId={selSession} />
            </>
          )}
          {tab === 'Exercises' && (
            <ExercisesView key={sel} patientId={sel} patientName={displayName(current)} />
          )}
          {tab === 'Muscle and brain signals' && (
            <SignalsView key={sel} defaultPatient={current?.dataset_patient} />
          )}
          {tab === 'Messages' && <MessagesView key={sel} patientId={sel} sender="doctor" />}
        </>
      )}
    </Shell>
  )
}
