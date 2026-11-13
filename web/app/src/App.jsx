import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Landing from './Landing'
import Auth from './Auth'
import PatientApp from './PatientApp'
import DoctorApp from './DoctorApp'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [err, setErr] = useState('')
  const [screen, setScreen] = useState('landing') // landing | in | up
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('kinote_view') || 'doctor' } catch { return 'doctor' }
  })
  const uid = session ? session.user.id : null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setScreen('landing')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!uid) { setProfile(null); return }
    setErr('')
    supabase.from('profiles').select('*').eq('id', uid).single()
      .then(({ data, error }) => (error ? setErr(error.message) : setProfile(data)))
  }, [uid])

  function switchView(v) {
    setView(v)
    try { localStorage.setItem('kinote_view', v) } catch { /* ignore */ }
  }

  if (session === undefined) return <div className="center">Loading…</div>
  if (!session) {
    if (screen === 'landing') return <Landing onSignIn={() => setScreen('in')} onSignUp={() => setScreen('up')} />
    return <Auth key={screen} initialMode={screen} onBack={() => setScreen('landing')} />
  }
  if (err) return <div className="center"><p className="msg-err">{err}</p></div>
  if (!profile) return <div className="center">Loading…</div>

  if (profile.role !== 'admin') return <PatientApp profile={profile} />
  return view === 'doctor'
    ? <DoctorApp profile={profile} onSwitch={() => switchView('patient')} />
    : <PatientApp profile={profile} onSwitch={() => switchView('doctor')} />
}