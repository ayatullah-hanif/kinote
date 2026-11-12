import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { EXERCISE, displayName } from './constants'
import Shell from './Shell'
import SessionsView from './SessionsView'
import MessagesView from './MessagesView'
import SessionTracker from './SessionTracker'

export default function PatientApp({ profile }) {
  const [tab, setTab] = useState('Home')
  const [sessions, setSessions] = useState([])
  const [lastMsg, setLastMsg] = useState(null)

  useEffect(() => {
    supabase.from('sessions').select('*').eq('patient_id', profile.id)
      .order('created_at', { ascending: true }).then(({ data }) => setSessions(data || []))
    supabase.from('messages').select('*').eq('patient_id', profile.id).eq('sender', 'doctor')
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setLastMsg(data && data[0]))
  }, [profile.id, tab])

  return (
    <Shell who={'Patient: ' + displayName(profile)} tabs={['Home', 'Session', 'Progress', 'Messages']} active={tab} onTab={setTab}>
      {tab === 'Home' && (
        <>
          <h2>{profile.first_name ? 'Hello, ' + profile.first_name : "Today's exercise"}</h2>
          <div className="card">
            <h3>{EXERCISE.name} · {EXERCISE.target} repetitions</h3>
            <p>{EXERCISE.instruction}</p>
            <button className="btn" onClick={() => setTab('Session')}>Start session</button>
          </div>
          <h3>Latest message from your physiotherapist</h3>
          <div className="card">{lastMsg ? lastMsg.body : <span className="muted">No messages yet.</span>}</div>
        </>
      )}
       {tab === 'Session' && (
        <>
          <h2>Exercise session</h2>
          <SessionTracker profile={profile} />
        </>
      )}
      {tab === 'Progress' && (<><h2>Your progress</h2><SessionsView sessions={sessions} /></>)}
      {tab === 'Messages' && (<><h2>Messages</h2><MessagesView patientId={profile.id} sender="patient" /></>)}
    </Shell>
  )
}