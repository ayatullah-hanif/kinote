export const SIDES = { right: [12, 14, 16], left: [11, 13, 15] } // shoulder, elbow, wrist
export const MIN_VIS = 0.5          // per-point confidence
export const EDGE = 0.025           // fraction of the picture treated as "edge"
export const MIN_FRAME_VIS = 0.6    // below this share of tracked frames, no numbers
export const MAX_SEC = 60

export function jointAngle(a, b, c) {
  const bax = a.x - b.x, bay = a.y - b.y, bcx = c.x - b.x, bcy = c.y - b.y
  const n = Math.hypot(bax, bay) * Math.hypot(bcx, bcy)
  if (n === 0) return NaN
  const cos = Math.min(1, Math.max(-1, (bax * bcx + bay * bcy) / n))
  return (Math.acos(cos) * 180) / Math.PI
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function percentile(arr, p) {
  const s = [...arr].sort((a, b) => a - b)
  const n = s.length
  const pos = (p / 100) * n + 0.5
  if (pos <= 1) return s[0]
  if (pos >= n) return s[n - 1]
  const lo = Math.floor(pos), f = pos - lo
  return s[lo - 1] + f * (s[lo] - s[lo - 1])
}

function movmean3(x) {
  return x.map((_, i) => {
    let s = 0, c = 0
    for (let j = i - 1; j <= i + 1; j++) {
      if (j >= 0 && j < x.length && Number.isFinite(x[j])) { s += x[j]; c++ }
    }
    return c ? s / c : NaN
  })
}

// Dips (local minima) deeper than minProm, at least minDist samples apart
function findDips(x, minProm, minDist) {
  const cands = []
  for (let i = 1; i < x.length - 1; i++) {
    if (x[i] < x[i - 1] && x[i] <= x[i + 1]) {
      let leftMax = x[i]
      for (let j = i - 1; j >= 0; j--) { if (x[j] < x[i]) break; leftMax = Math.max(leftMax, x[j]) }
      let rightMax = x[i]
      for (let j = i + 1; j < x.length; j++) { if (x[j] < x[i]) break; rightMax = Math.max(rightMax, x[j]) }
      const prom = Math.min(leftMax, rightMax) - x[i]
      if (prom >= minProm) cands.push({ i, prom })
    }
  }
  cands.sort((a, b) => b.prom - a.prom)
  const kept = []
  for (const c of cands) if (kept.every((k) => Math.abs(k.i - c.i) >= minDist)) kept.push(c)
  return kept.map((k) => k.i).sort((a, b) => a - b)
}

// frames: [{ t: seconds, angle: degrees or NaN, edge: boolean, tilt: degrees or NaN }]
export function analyzeSession(frames) {
  const n = frames.length
  const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null)
  const angles = frames.map((f) => f.angle)
  const good = angles.filter(Number.isFinite)
  const visibility = n ? good.length / n : 0
  const edgeFraction = n ? frames.filter((f) => f.edge).length / n : 0
  let reps = null, rom = null, repIdx = [], smooth = angles

  if (good.length >= 5) {
    const dts = []
    for (let i = 1; i < n; i++) dts.push(frames[i].t - frames[i - 1].t)
    const fs = 1 / median(dts)
    rom = percentile(good, 95) - percentile(good, 5)
    smooth = movmean3(angles)
    const med = median(good)
    const x = smooth.map((v) => (Number.isFinite(v) ? v : med))
    repIdx = findDips(x, 0.5 * rom, Math.round(0.8 * fs))
    reps = repIdx.length
  }

  const status = visibility < MIN_FRAME_VIS ? 'low_tracking_quality' : 'recorded'
  if (status !== 'recorded') { reps = null; rom = null; repIdx = [] }

  // Per-repetition measurements: extension reached before each dip, depth of the dip, time between dips
  const repMax = [], repMin = [], periods = []
  repIdx.forEach((idx, k) => {
    const prev = k ? repIdx[k - 1] : 0
    let mx = -Infinity
    for (let i = prev; i <= idx; i++) if (Number.isFinite(smooth[i])) mx = Math.max(mx, smooth[i])
    repMax.push(Number.isFinite(mx) ? r1(mx) : null)
    repMin.push(r1(smooth[idx]))
    if (k) periods.push(r1(frames[idx].t - frames[repIdx[k - 1]].t))
  })

  const tilts = frames.map((f) => f.tilt).filter(Number.isFinite)
  const metrics = {
    status,
    reps,
    rom: r1(rom),
    visibility: Math.round(visibility * 1000) / 1000,
    duration: r1(n ? frames[n - 1].t : 0),
    rep_max: repMax,
    rep_min: repMin,
    rep_periods: periods,
    tilt_median: tilts.length >= 5 ? r1(median(tilts)) : null,
    tilt_p90: tilts.length >= 5 ? r1(percentile(tilts, 90)) : null,
  }

  const curve = { t: frames.map((f) => r1(f.t)), a: smooth.map(r1), reps: repIdx }
  return { reps, rom, visibility, edgeFraction, status, curve, metrics }
}
