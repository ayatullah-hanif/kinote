import { validateBody, SYSTEM, buildContent, parseModelJson } from './_lib.js'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const key = process.env.ANTHROPIC_API_KEY
  const sbUrl = process.env.VITE_SUPABASE_URL
  const sbKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!key || !sbUrl || !sbKey) return res.status(500).json({ error: 'The server is not configured' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Sign in first' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = null } }
  const bad = validateBody(body)
  if (bad) return res.status(400).json({ error: bad })

  const sb = { apikey: sbKey, Authorization: 'Bearer ' + token }

  // 1. Who is calling?
  const u = await fetch(`${sbUrl}/auth/v1/user`, { headers: sb })
  if (!u.ok) return res.status(401).json({ error: 'Sign in again' })
  const user = await u.json()

  // 2. The session must belong to them and must not have been analysed yet.
  const q = await fetch(`${sbUrl}/rest/v1/sessions?id=eq.${body.session_id}&select=id,patient_id,ai_observations`, { headers: sb })
  const rows = q.ok ? await q.json() : []
  if (!Array.isArray(rows) || !rows.length || rows[0].patient_id !== user.id) return res.status(404).json({ error: 'Session not found' })
  if (rows[0].ai_observations) return res.status(409).json({ error: 'This session was already analysed' })

  // 3. Ask the model.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 55000)
  let r
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: 'user', content: buildContent(body.criteria, body.frames) }],
      }),
    })
  } catch {
    clearTimeout(timer)
    return res.status(504).json({ error: 'The AI service did not answer in time' })
  }
  clearTimeout(timer)
  if (!r.ok) return res.status(502).json({ error: 'The AI service returned an error' })
  const data = await r.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')

  const obs = {
    model: MODEL,
    analysed_at: new Date().toISOString(),
    n_frames: body.frames.length,
    results: parseModelJson(text, body.criteria),
    note: 'Visual judgements from a few still pictures. Unverified.',
  }

  // 4. Store it for the doctor. The database function only allows the owner, once.
  const s = await fetch(`${sbUrl}/rest/v1/rpc/set_ai_observations`, {
    method: 'POST',
    headers: { ...sb, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_session_id: body.session_id, p_obs: obs }),
  })
  if (!s.ok) return res.status(500).json({ error: 'The result could not be saved' })
  return res.status(200).json({ ok: true, observations: obs })
}
