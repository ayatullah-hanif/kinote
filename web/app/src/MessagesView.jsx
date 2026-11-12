import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function MessagesView({ patientId, sender }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')

  async function load() {
    const { data, error } = await supabase.from('messages').select('*')
      .eq('patient_id', patientId).order('created_at', { ascending: true })
    if (error) setErr(error.message); else setMsgs(data)
  }
  useEffect(() => { load() }, [patientId])

  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setErr('')
    const { error } = await supabase.from('messages').insert({ patient_id: patientId, sender, body })
    if (error) { setErr(error.message); return }
    setText(''); load()
  }

  return (
    <div className="card">
      <div className="chat">
        {msgs.length === 0 && <p className="muted">No messages yet.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={'bubble' + (m.sender === sender ? ' me' : '')}>
            <div>{m.body}</div>
            <div className="when">{m.sender === 'doctor' ? 'Physiotherapist' : 'Patient'} · {new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <form className="row" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder={sender === 'doctor' ? 'Write a message to the patient' : 'Write a message to your physiotherapist'} />
        <button className="btn" type="submit">Send</button>
        <button className="btn btn-ghost" type="button" onClick={load}>Refresh</button>
      </form>
      <p className="msg-err">{err}</p>
    </div>
  )
}