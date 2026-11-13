import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function parseUrl(s) {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u : null
  } catch { return null }
}

function embedFor(u) {
  const h = u.hostname.replace(/^www\./, '')
  let id = null
  if (h === 'youtu.be') id = u.pathname.slice(1)
  else if (h === 'youtube.com' || h === 'm.youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v')
    else {
      const m = u.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)
      if (m) id = m[1]
    }
  }
  return id && /^[\w-]{6,20}$/.test(id) ? 'https://www.youtube.com/embed/' + id : null
}

export default function ExerciseGuide({ exercise }) {
  const [url, setUrl] = useState(null)
  const [err, setErr] = useState('')
  const path = exercise ? exercise.video_path : null

  useEffect(() => {
    setUrl(null); setErr('')
    if (!path) return
    supabase.storage.from('exercise-videos').createSignedUrl(path, 3600)
      .then(({ data, error }) => { if (error) setErr(error.message); else setUrl(data.signedUrl) })
  }, [path])

  if (!exercise) return null
  const link = exercise.video_url ? parseUrl(exercise.video_url) : null
  if (!link && !path) return null
  const embed = link ? embedFor(link) : null

  return (
    <div className="videobox">
      {embed && (
        <div className="embedwrap">
          <iframe src={embed} title="Exercise video" allowFullScreen
            allow="accelerometer; encrypted-media; picture-in-picture" />
        </div>
      )}
      {link && (
        <p className="small">
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {embed ? 'Open the video in a new tab' : 'Open the exercise video'}
          </a>
        </p>
      )}
      {path && !url && !err && <p className="muted">Loading video…</p>}
      {err && <p className="msg-err">{err}</p>}
      {url && <video src={url} controls playsInline />}
    </div>
  )
}