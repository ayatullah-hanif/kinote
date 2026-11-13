import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { EXERCISE } from './constants'
import Shell from './Shell'
import SessionsView from './SessionsView'
import MessagesView from './MessagesView'
import SessionTracker from './SessionTracker'
import ExerciseGuide from './ExerciseGuide'

export default function PatientApp({ profile, onSwitch }) {
  const [tab, setTab] = useState('Home')
  const [sessions, setSessions] = useState([])
  const [lastMsg, setLastMsg] = useState(null)
  const [assigned, setAssigned] = useState(null)

  useEffect(() => {
    supabase.from('sessions').select('*').eq('patient_id', profile.id)
      .order('created_at', { ascending: true }).then(({ data }) => setSessions(data || []))
    supabase.from('messages').select('*').eq('patient_id', profile.id).eq('sender', 'doctor')
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setLastMsg(data && data[0]))
    supabase.from('exercises').select('*').eq('patient_id', profile.id).eq('active', true)
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setAssigned((data && data[0]) || null))
  }, [profile.id, tab])

  const ex = assigned
    ? { name: assigned.name, target: assigned.target_reps, instruction: assigned.instruction || EXERCISE.instruction }
    : EXERCISE
  const hasVideo = assigned && (assigned.video_url || assigned.video_path)

  return (
    <Shell profile={profile} roleLabel="Patient" tabs={['Home', 'Session', 'Progress', 'Messages']} active={tab} onTab={setTab}
      onSwitch={onSwitch} switchLabel="Switch to doctor view">
      {tab === 'Home' && (
        <>
          <h2>{profile.first_name ? 'Hello, ' + profile.first_name : "Today's exercise"}</h2>
          <div className="card">
            <span className={assigned ? 'pill' : 'pill pill-warn'}>
              {assigned ? 'Assigned by your physiotherapist' : 'Default exercise, none assigned yet'}
            </span>
            <h3 style={{ marginTop: 10 }}>{ex.name} · {ex.target} repetitions</h3>
            <p>{ex.instruction}</p>
            <ExerciseGuide exercise={assigned} />
            <button className="btn" onClick={() => setTab('Session')}>Start session</button>
          </div>
          <h3>Latest message from your physiotherapist</h3>
          <div className="card">{lastMsg ? lastMsg.body : <span className="muted">No messages yet.</span>}</div>
        </>
      )}
      {tab === 'Session' && (
        <>
          <h2>Exercise session</h2>
          {hasVideo && (
            <details className="card">
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Watch the exercise video first</summary>
              <ExerciseGuide exercise={assigned} />
            </details>
          )}
          <SessionTracker profile={profile} exercise={ex} />
        </>
      )}
      {tab === 'Progress' && (<><h2>Your progress</h2><SessionsView sessions={sessions} /></>)}
      {tab === 'Messages' && (<><h2>Messages</h2><MessagesView patientId={profile.id} sender="patient" /></>)}
    </Shell>
  )
}