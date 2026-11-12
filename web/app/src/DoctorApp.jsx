import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { displayName } from './constants'
import Shell from './Shell'
import SessionsView from './SessionsView'
import MessagesView from './MessagesView'
import SignalsView from './SignalsView'
import ExperimentView from './ExperimentView'

export default function DoctorApp({ profile }) {
  const [tab, setTab] = useState('Movement')
  const [patients, setPatients] = useState([])
  const [sel, setSel] = useState('')
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'patient').order('created_at')
      .then(({ data }) => { setPatients(data || []); if (data && data[0]) setSel(data[0].id) })
  }, [])

  useEffect(() => {
    if (!sel) { setSessions([]); return }
    supabase.from('sessions').select('*').eq('patient_id', sel)
      .order('created_at', { ascending: true }).then(({ data }) => setSessions(data || []))
  }, [sel, tab])

  const current = patients.find((p) => p.id === sel)

  return (
    <Shell who={'Physiotherapist: ' + displayName(profile)}
      tabs={['Movement', 'Muscle and brain signals', 'Experiment', 'Messages']} active={tab} onTab={setTab}>
      <h2>Physiotherapist dashboard</h2>
      {tab === 'Experiment' ? (
        <ExperimentView />
      ) : patients.length === 0 ? (
        <div className="card"><p className="muted">No patients have signed up yet.</p></div>
      ) : (
        <>
          <div className="card">
            <label className="muted small">Patient</label>
            <select value={sel} onChange={(e) => setSel(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{displayName(p)}{p.first_name ? ' (' + p.email + ')' : ''}</option>
              ))}
            </select>
          </div>
          {tab === 'Movement' && (
            <>
              <p className="muted">[Measured] Camera movement analysis of this patient's sessions</p>
              <SessionsView sessions={sessions} />
            </>
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