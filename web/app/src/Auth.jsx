import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMsg(''); setBusy(true)
    const fn = mode === 'in'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { data, error } = await fn
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Account created. Check your email to confirm, then sign in.')
  }

  return (
    <form className="auth" onSubmit={submit}>
      <div className="brand">Kinote</div>
      <p className="muted">{mode === 'in' ? 'Sign in to continue' : 'Create a patient account'}</p>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <button className="btn" disabled={busy} type="submit" style={{ width: '100%' }}>
        {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Sign up'}
      </button>
      <p className="msg-err">{msg}</p>
      <p className="small muted">
        {mode === 'in' ? 'New here? ' : 'Already have an account? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setMsg(''); setMode(mode === 'in' ? 'up' : 'in') }}>
          {mode === 'in' ? 'Create an account' : 'Sign in'}
        </a>
      </p>
    </form>
  )
}