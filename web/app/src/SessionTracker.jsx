import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { supabase } from './supabaseClient'
import { EXERCISE as DEFAULT_EXERCISE } from './constants'
import { SIDES, MIN_VIS, EDGE, MAX_SEC, jointAngle, analyzeSession } from './tracking'

async function loadLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  const make = (delegate) => PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: '/mediapipe/pose_landmarker_lite.task', delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
  try { return await make('GPU') } catch { return await make('CPU') }
}

function pickMime() {
  if (!window.MediaRecorder) return null
  const opts = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
  return opts.find((m) => MediaRecorder.isTypeSupported(m)) || ''
}

function stopRecorder(rec) {
  return new Promise((resolve) => {
    if (!rec || rec.state === 'inactive') return resolve()
    rec.onstop = () => resolve()
    rec.stop()
  })
}

export default function SessionTracker({ profile, exercise }) {
  const EXERCISE = exercise || DEFAULT_EXERCISE
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const streamRef = useRef(null)
  const runRef = useRef({ running: false, frames: [] })
  const [phase, setPhase] = useState('idle')   // idle | loading | running | saving
  const [side, setSide] = useState('right')
  const [saveVideo, setSaveVideo] = useState(false)
  const [ratio, setRatio] = useState(4 / 3)
  const [text, setText] = useState('Choose the arm to track, then press Start.')
  const [warn, setWarn] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => () => {
    runRef.current.running = false
    try { if (runRef.current.rec && runRef.current.rec.state !== 'inactive') runRef.current.rec.stop() } catch { /* ignore */ }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
  }, [])

  async function start() {
    setErr(''); setResult(null); setWarn(false)
    setPhase('loading'); setText('Loading the tracker. The first time takes a moment…')
    let stream
    try {
      if (!landmarkerRef.current) landmarkerRef.current = await loadLandmarker()
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current
      v.srcObject = stream
      await v.play()
      if (v.videoWidth) setRatio(v.videoWidth / v.videoHeight)
      try {
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities ? track.getCapabilities() : {}
        if (caps.zoom) await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min }] })
      } catch { /* zoom not supported, ignore */ }
    } catch (e) {
      setErr('Could not start the camera or tracker: ' + (e.message || e))
      setPhase('idle'); setText('Choose the arm to track, then press Start.')
      return
    }

    const idx = SIDES[side]
    const run = { running: true, frames: [], chunks: [], rec: null, reps: 0, down: false, t0: performance.now(), lastVT: -1, lastUi: 0 }
    runRef.current = run

    if (saveVideo && window.MediaRecorder) {
      try {
        const mime = pickMime()
        const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 600000 })
        rec.ondataavailable = (e) => { if (e.data && e.data.size) run.chunks.push(e.data) }
        rec.start(1000)
        run.rec = rec
      } catch { run.rec = null }
    }
    setPhase('running')

    const loop = () => {
      if (!run.running) return
      const v = videoRef.current
      const now = performance.now()
      if (v && v.readyState >= 2 && v.currentTime !== run.lastVT) {
        run.lastVT = v.currentTime
        const res = landmarkerRef.current.detectForVideo(v, now)
        const lm = res.landmarks && res.landmarks[0]
        let ok = false, angle = NaN, edge = false, pts = null
        if (lm) {
          pts = idx.map((i) => lm[i])
          edge = pts.some((p) => p.x < EDGE || p.x > 1 - EDGE || p.y < EDGE || p.y > 1 - EDGE)
          const vis = Math.min(...pts.map((p) => p.visibility ?? 0))
          ok = vis >= MIN_VIS && !edge
          if (ok) {
            const px = (p) => ({ x: p.x * v.videoWidth, y: p.y * v.videoHeight })
            angle = jointAngle(px(pts[0]), px(pts[1]), px(pts[2]))
            if (angle < 100) run.down = true
            if (run.down && angle > 140) { run.reps += 1; run.down = false }
          }
        }
        run.frames.push({ t: (now - run.t0) / 1000, angle, edge })

        const c = canvasRef.current
        if (c) {
          c.width = v.videoWidth; c.height = v.videoHeight
          const g = c.getContext('2d')
          g.clearRect(0, 0, c.width, c.height)
          if (pts) {
            g.strokeStyle = ok ? '#2fd06a' : '#f0a050'
            g.fillStyle = '#ffe14d'
            g.lineWidth = 4
            g.beginPath()
            pts.forEach((p, k) => (k ? g.lineTo(p.x * c.width, p.y * c.height) : g.moveTo(p.x * c.width, p.y * c.height)))
            g.stroke()
            pts.forEach((p) => { g.beginPath(); g.arc(p.x * c.width, p.y * c.height, 6, 0, 7); g.fill() })
          }
        }
        if (now - run.lastUi > 200) {
          run.lastUi = now
          setWarn(!ok)
          setText(ok
            ? `Elbow ${Math.round(angle)}°      Live count: ${run.reps} of ${EXERCISE.target}`
            : 'Keep your arm fully in view.')
        }
      }
      if ((now - run.t0) / 1000 > MAX_SEC) { finish(); return }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  async function finish() {
    const run = runRef.current
    if (!run.running) return
    run.running = false
    await stopRecorder(run.rec)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    const c = canvasRef.current
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setWarn(false)
    if (run.frames.length < 15) {
      setPhase('idle'); setText('Session too short to analyse. Please try again.')
      return
    }
    setPhase('saving'); setText('Analysing and saving…')
    const r = analyzeSession(run.frames)

    let clipPath = null, note = ''
    if (run.chunks.length) {
      const type = (run.rec && run.rec.mimeType) || 'video/webm'
      const ext = type.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(run.chunks, { type })
      const path = `${profile.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('clips').upload(path, blob, { contentType: type.split(';')[0] })
      if (upErr) note = ' The video could not be uploaded: ' + upErr.message
      else clipPath = path
    }

    const { error } = await supabase.from('sessions').insert({
      patient_id: profile.id,
      exercise: EXERCISE.name,
      target_reps: EXERCISE.target,
      repetitions: r.reps,
      range_of_motion_deg: r.rom === null ? null : Math.round(r.rom * 10) / 10,
      visibility: Math.round(r.visibility * 1000) / 1000,
      edge_fraction: Math.round(r.edgeFraction * 1000) / 1000,
      status: r.status,
      source: 'browser camera',
      angle_curve: r.curve,
      clip_path: clipPath,
    })
    setPhase('idle')
    if (error) { setErr('Could not save the session: ' + error.message); setText('Not saved.'); return }
    setResult(r)
    setText('Session saved. Your physiotherapist can review it.' + (clipPath ? ' The video was shared with them.' : '') + note)
  }

  const running = phase === 'running'
  return (
    <div className="card">
      <div className="camwrap" style={{ aspectRatio: ratio, width: `min(100%, ${Math.round(70 * ratio)}vh)` }}>
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} />
        {phase === 'idle' && !result && <div className="camhint">Camera is off</div>}
      </div>
      <p style={{ fontWeight: 700, fontSize: 17, color: warn ? 'var(--warn)' : 'var(--text)' }}>{text}</p>
      <p className="muted small">{EXERCISE.instruction} Keep your arm flat to the camera and fully inside the picture.</p>
      <label className="consent">
        <input type="checkbox" checked={saveVideo} disabled={phase !== 'idle'} onChange={(e) => setSaveVideo(e.target.checked)} />
        <span>Save a video of this session so my physiotherapist can watch it. Only my physiotherapist and I can see it. If I leave this unticked, no video is recorded.</span>
      </label>
      <div className="row" style={{ marginTop: 10 }}>
        <select style={{ width: 150, margin: 0 }} value={side} disabled={phase !== 'idle'} onChange={(e) => setSide(e.target.value)}>
          <option value="right">Right arm</option>
          <option value="left">Left arm</option>
        </select>
        <button className="btn" disabled={phase !== 'idle'} onClick={start}>Start</button>
        <button className="btn btn-ghost" disabled={!running} onClick={finish}>Stop</button>
      </div>
      {result && (
        <div className="card" style={{ marginTop: 14, background: result.status === 'recorded' ? 'var(--soft)' : '#fdeccd' }}>
          {result.status === 'recorded'
            ? <b>Done: {result.reps} repetitions, range of motion {Math.round(result.rom)}°, arm tracked in {Math.round(result.visibility * 100)}% of frames.</b>
            : <b>Your arm was not clearly tracked, so no result was recorded. Please try again with your arm fully in view.</b>}
        </div>
      )}
      <p className="msg-err">{err}</p>
    </div>
  )
}