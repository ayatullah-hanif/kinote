// What a physiotherapist can ask the camera to check, and how each check is graded.
export const CRITERIA_TYPES = {
  reps: { label: 'Complete all the prescribed repetitions', unit: 'repetitions', value: 8, min: 1, max: 50 },
  extension: { label: 'Straighten the arm on every repetition', unit: 'degrees or more', value: 150, min: 90, max: 180 },
  flexion: { label: 'Bend the elbow on every repetition', unit: 'degrees or less', value: 80, min: 20, max: 140 },
  pace: { label: 'Move slowly: time per repetition', unit: 'seconds or more', value: 1.5, min: 0.5, max: 10 },
  inview: { label: 'Keep the arm in view', unit: '% of the session or more', value: 90, min: 50, max: 100 },
  shoulders: { label: 'Keep the shoulders level', unit: 'degrees of tilt or less', value: 10, min: 2, max: 45 },
}

export const STATUS_LABEL = {
  met: 'Met', partly: 'Partly met', not_met: 'Not met', cannot_tell: "Can't tell", unchecked: 'Not checked yet',
}

export function describeCriterion(c) {
  switch (c.type) {
    case 'custom': return c.text
    case 'reps': return `Complete at least ${c.value} repetitions`
    case 'extension': return `Straighten the arm to ${c.value}° or more on every repetition`
    case 'flexion': return `Bend the elbow to ${c.value}° or less on every repetition`
    case 'pace': return `Take ${c.value} seconds or more per repetition`
    case 'inview': return `Keep the arm in view for ${c.value}% of the session or more`
    case 'shoulders': return `Keep the shoulders level (within ${c.value}° of tilt)`
    default: return String(c.type)
  }
}

function grade(k, total) {
  if (!total) return 'cannot_tell'
  if (k === total) return 'met'
  return k >= total / 2 ? 'partly' : 'not_met'
}
const fin = (a) => (a || []).filter(Number.isFinite)

// m = session metrics from analyzeSession. Returns one result per criterion.
export function evaluateCriteria(criteria, m) {
  return (criteria || []).map((c) => {
    const base = { id: c.id, type: c.type, label: describeCriterion(c), value: c.value ?? null, source: 'measured' }
    if (c.type === 'custom') {
      return { ...base, source: 'ai', status: 'unchecked', detail: 'Visual criterion. It is checked by the AI step, which has not run for this session.' }
    }
    if (!m || m.status !== 'recorded') {
      return { ...base, status: 'cannot_tell', detail: 'The arm was not tracked well enough in this session.' }
    }
    const v = Number(c.value)
    switch (c.type) {
      case 'reps': {
        const n = m.reps ?? 0
        return { ...base, status: n >= v ? 'met' : 'not_met', detail: `${n} repetitions counted, ${v} required.` }
      }
      case 'extension': {
        const a = fin(m.rep_max)
        const k = a.filter((x) => x >= v).length
        return { ...base, status: grade(k, a.length),
          detail: a.length ? `${k} of ${a.length} repetitions reached ${v}° (best ${Math.round(Math.max(...a))}°).` : 'No repetitions to check.' }
      }
      case 'flexion': {
        const a = fin(m.rep_min)
        const k = a.filter((x) => x <= v).length
        return { ...base, status: grade(k, a.length),
          detail: a.length ? `${k} of ${a.length} repetitions bent to ${v}° or less (best ${Math.round(Math.min(...a))}°).` : 'No repetitions to check.' }
      }
      case 'pace': {
        const p = fin(m.rep_periods)
        if (!p.length) return { ...base, status: 'cannot_tell', detail: 'Needs at least two repetitions to measure the pace.' }
        const k = p.filter((x) => x >= v).length
        const avg = p.reduce((s, x) => s + x, 0) / p.length
        return { ...base, status: grade(k, p.length), detail: `${k} of ${p.length} repetitions took ${v} s or more (average ${avg.toFixed(1)} s).` }
      }
      case 'inview': {
        const vis = (m.visibility || 0) * 100
        return { ...base, status: vis >= v ? 'met' : 'not_met', detail: `Arm tracked in ${Math.round(vis)}% of frames.` }
      }
      case 'shoulders': {
        if (m.tilt_median == null) return { ...base, status: 'cannot_tell', detail: 'Both shoulders were not clearly visible.' }
        const st = m.tilt_p90 <= v ? 'met' : m.tilt_median <= v ? 'partly' : 'not_met'
        return { ...base, status: st, detail: `Typical tilt ${m.tilt_median.toFixed(0)}°, worst 10% above ${m.tilt_p90.toFixed(0)}°.` }
      }
      default:
        return { ...base, status: 'cannot_tell', detail: 'Unknown check.' }
    }
  })
}
