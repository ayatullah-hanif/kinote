import { supabase } from './supabaseClient'

// Takes one still picture from the live video, small and compressed. Returns base64 JPEG without the prefix.
export function captureFrame(video, holder, maxW = 512, quality = 0.6) {
  try {
    if (!video.videoWidth) return null
    if (!holder.cv) holder.cv = document.createElement('canvas')
    const w = Math.min(maxW, video.videoWidth)
    const h = Math.round((w * video.videoHeight) / video.videoWidth)
    holder.cv.width = w
    holder.cv.height = h
    holder.cv.getContext('2d').drawImage(video, 0, 0, w, h)
    return holder.cv.toDataURL('image/jpeg', quality).split(',')[1] || null
  } catch {
    return null
  }
}

// Picks n pictures spread evenly across the session.
export function pickFrames(shots, n = 8) {
  if (shots.length <= n) return shots
  const out = []
  for (let i = 0; i < n; i++) out.push(shots[Math.round((i * (shots.length - 1)) / (n - 1))])
  return out
}

export async function runVisualCheck(sessionId, criteria, frames) {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session && data.session.access_token
    if (!token) return { ok: false, error: 'Not signed in' }
    const r = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        session_id: sessionId,
        criteria: criteria.map((c) => ({ id: c.id, text: c.text })),
        frames: frames.map((f) => ({ t: f.t, data: f.data })),
      }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, error: j.error || 'Server error ' + r.status }
    return { ok: true, observations: j.observations }
  } catch (e) {
    return { ok: false, error: e.message || String(e) }
  }
}
