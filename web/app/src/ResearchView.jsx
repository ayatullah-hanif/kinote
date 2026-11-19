import { useEffect, useState } from 'react'
import { loadCsv, num } from './data'
import TrendChart from './TrendChart'

const NICE = {
  emg_dropout_1: 'Loose electrode (muscle signal goes flat)',
  emg_noise_8: 'Muscle noise',
  eeg_spike_10: 'Brain spikes',
  emg_pops_10: 'Electrode pops',
  emg_hum_3: 'Mains hum (100 and 150 Hz)',
  'emg_attenuation_0.3': 'Weak electrode (signal shrinks)',
  eeg_noise_6: 'Brain noise',
}
const ORDER = Object.keys(NICE)
const R1 = 'v1 mean quality (current)'
const R2 = 'v2 mean quality'
const R2MIN = 'v2 min quality'
const COLORS = ['#0a6670', '#2fb8c0', '#c77d1a', '#7a5aa6', '#8aa0a6', '#11743a']
const yes = (v) => v === true || v === 1 || String(v).toLowerCase() === 'true'
const f1 = (v, d = 1) => (num(v) === null ? '–' : num(v).toFixed(d))
const median = (a) => {
  const s = a.filter(Number.isFinite).sort((x, y) => x - y)
  if (!s.length) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function Bar({ label, v, color, text }) {
  const n = num(v)
  return (
    <div className="hbar">
      <span>{label}</span>
      <div className="ht"><div style={{ width: n === null ? 0 : Math.min(100, n * 100) + '%', background: color }} /></div>
      <b>{text ?? (n === null ? '–' : n.toFixed(2))}</b>
    </div>
  )
}

export default function ResearchView() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      loadCsv('heldout_auc.csv'), loadCsv('heldout_calibrated.csv'), loadCsv('risk_coverage.csv'),
      loadCsv('risk_coverage_summary.csv'), loadCsv('risk_control_summary.csv'), loadCsv('mdc_results.csv'),
      loadCsv('tilt_experiment.csv').catch(() => null),
    ]).then(([auc, cal, rc, rcs, ctl, mdc, tilt]) => setD({ auc, cal, rc, rcs, ctl, mdc, tilt }))
      .catch((e) => setErr(e.message || String(e)))
  }, [])

  if (err) return <div className="card"><p className="msg-err">{err}</p></div>
  if (!d) return <div className="card"><p className="muted">Loading research results…</p></div>

  const aucRow = (c, rule) => d.auc.find((x) => x.condition === c && x.rule === rule)
  const calRow = (c, rule) => d.cal.find((x) => x.condition === c && x.rule === rule && yes(x.damaged_cues))

  const stress = d.rc.filter((r) => String(r.dataset).startsWith('Stress'))
  const methods = [...new Set(stress.map((r) => r.method))]
  const covs = [...new Set(stress.map((r) => num(r.coverage_pct)))].filter((v) => v !== null).sort((a, b) => a - b)
  const series = methods.map((m, i) => ({
    name: m,
    color: COLORS[i % COLORS.length],
    values: covs.map((c) => {
      const r = stress.find((x) => x.method === m && num(x.coverage_pct) === c)
      const y = r ? num(r.risk_pct) : null
      return y === null ? null : { y }
    }),
  }))

  const mdcRows = d.mdc.filter((r) => num(r.prev_session) !== null)
  const smallest = median(mdcRows.map((r) => num(r.mdc_points)))

  return (
    <>
      <div className="banner">[Replayed recording, simulated damage] Research results computed on a public dataset (4 patients, 94 recordings). Not patient data.</div>

      <div className="card">
        <h3>What the research found</h3>
        <ul className="small" style={{ lineHeight: 1.6 }}>
          <li><b>Detecting damage is not the same as being right.</b> The quality scores separate damaged cues from clean ones well, but withholding by quality lowers the error rate only a little, because the base decision is wrong on roughly one clean cue in four.</li>
          <li><b>The original quality score has blind spots.</b> It catches flat or very loud muscle signals, and misses electrode pops and brain-signal damage. The newer score (v2) uses several independent checks and detects those better, at the cost of weaker detection of a flat signal.</li>
          <li><b>No abstention rule met a 15% or 20% error target on a new patient.</b> The reliable fix is a better base decision, not a better cut-off.</li>
          <li><b>Session-to-session changes in the attempt rate are mostly within normal variation.</b> Repeat recordings in one session vary more than cue-count chance alone, so the dashboard reports "no reliable change" far more often than the earlier version.</li>
        </ul>
        <p className="muted small" style={{ marginBottom: 0 }}>Limits: damage is simulated; the v2 checks were written with these damage types in view, so the held-out results are optimistic; four patients only; labels come from the cue protocol.</p>
      </div>

      <div className="card">
        <h3>Can the quality score tell damaged cues from clean ones?</h3>
        <p className="muted small">Area under the ROC curve: 0.5 is chance, 1.0 is perfect. "Held out" means the damage type was not used to design the first score.</p>
        {ORDER.map((c) => {
          const g = aucRow(c, R1)?.group
          return (
            <div key={c} style={{ margin: '12px 0' }}>
              <b>{NICE[c]}</b> <span className={g === 'seen' ? 'pill' : 'pill pill-warn'}>{g === 'seen' ? 'Designed around' : 'Held out'}</span>
              <Bar label="v1 (current)" v={aucRow(c, R1)?.auc_damage_detection} color="#8aa0a6" />
              <Bar label="v2 (mean of checks)" v={aucRow(c, R2)?.auc_damage_detection} color="#2fb8c0" />
              <Bar label="v2 (worst check)" v={aucRow(c, R2MIN)?.auc_damage_detection} color="#0a6670" />
            </div>
          )
        })}
      </div>

      <div className="card scroll">
        <h3>What happens to the damaged cues</h3>
        <p className="muted small">Each rule's cut-off is set to withhold 5% of clean cues, using no damage labels. "Wrong if forced" is the error rate if every cue were answered. Withheld cues are never counted as correct. The "worst check" version could not be calibrated: more than 5% of clean cues score zero on at least one check, so its checks need softer tolerances.</p>
        <table>
          <thead>
            <tr>
              <th>Damage</th><th>Wrong if forced</th>
              <th>v1 withheld</th><th>v1 wrong, answered</th>
              <th>v2 withheld</th><th>v2 wrong, answered</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((c) => {
              const a = calRow(c, R1), b = calRow(c, R2)
              return (
                <tr key={c}>
                  <td>{NICE[c]}</td>
                  <td>{f1(a?.wrong_if_forced_pct)}%</td>
                  <td>{f1(a?.withheld_pct, 0)}%</td>
                  <td>{f1(a?.wrong_among_answered_pct)}%</td>
                  <td>{f1(b?.withheld_pct, 0)}%</td>
                  <td>{f1(b?.wrong_among_answered_pct)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TrendChart title="Risk-coverage: error among answered cues"
        sessions={covs} series={series} fixedRange={[0, 45]} fmt={(v) => Math.round(v) + '%'}
        xPrefix="" xSuffix="%"
        note="Horizontal axis: share of cues answered. Vertical: error rate among the answered cues. Random is no skill; Oracle is a perfect ranking. Stress mix: clean plus 7 damage types, 25% of cues damaged." />

      <div className="card scroll">
        <h3>Average error across coverage levels, with 95% intervals</h3>
        <p className="muted small">Intervals come from resampling whole recordings. Overlapping intervals mean the difference is not established.</p>
        <table>
          <thead><tr><th>Data</th><th>Ranking</th><th>Mean error</th><th>95% interval</th><th>At 80% coverage</th></tr></thead>
          <tbody>
            {d.rcs.map((r, i) => (
              <tr key={i}>
                <td>{String(r.dataset).startsWith('Stress') ? 'Stress mix' : 'Clean'}</td>
                <td>{r.method}</td>
                <td>{f1(r.mean_risk_pct)}%</td>
                <td>{f1(r.lo_pct)} to {f1(r.hi_pct)}%</td>
                <td>{f1(r.risk_at_80pct_coverage)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card scroll">
        <h3>Can a cut-off be chosen to guarantee an error rate?</h3>
        <p className="muted small">The cut-off was chosen on three patients and tested on the fourth. 0% answered means no cut-off qualified, so everything is withheld.</p>
        <table>
          <thead><tr><th>Ranking</th><th>Target error</th><th>Answered (new patient)</th><th>Wrong among answered</th><th>Patients meeting target</th></tr></thead>
          <tbody>
            {d.ctl.map((r, i) => (
              <tr key={i}>
                <td>{r.method}</td>
                <td>{f1(r.target_pct, 0)}%</td>
                <td>{f1(r.fun1_test_answered_pct)}%</td>
                <td>{f1(r.fun1_test_wrong_among_answered_pct)}%</td>
                <td>{num(r.fun1_target_met) === null ? 'n/a' : Math.round(num(r.fun1_target_met) * 100) + '%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card scroll">
        <h3>How big must a change be to count?</h3>
        <p>
          Between two sessions, the attempt rate must change by about <b>{smallest === null ? '–' : Math.round(smallest)} points</b> before the change is larger than the variation between repeat recordings.
        </p>
        <table>
          <thead><tr><th>Patient</th><th>Session</th><th>Change (points)</th><th>Needed (points)</th><th>Earlier method</th><th>Repeat-recording method</th></tr></thead>
          <tbody>
            {mdcRows.map((r, i) => (
              <tr key={i} className={yes(r.verdicts_differ) ? 'row-warn' : ''}>
                <td>{r.patient}</td>
                <td>{r.session} vs {r.prev_session}</td>
                <td>{f1(r.change_points, 0)}</td>
                <td>{f1(r.mdc_points, 0)}</td>
                <td>{r.verdict_binomial}</td>
                <td>{r.verdict_mdc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginBottom: 0 }}>Shaded rows are where the two methods disagree. Sessions with a different mix of left and right recordings may differ for that reason alone.</p>
      </div>

      <div className="card scroll">
        <h3>Camera angle when the arm turns away</h3>
        {d.tilt ? (
          <table>
            <thead><tr><th>Turn (°)</th><th>Protractor (°)</th><th>Camera (°)</th><th>Error (°)</th><th>Flatness</th><th>Flagged</th></tr></thead>
            <tbody>
              {d.tilt.map((r, i) => (
                <tr key={i}>
                  <td>{f1(r.tilt_deg, 0)}</td><td>{f1(r.real_deg, 0)}</td><td>{f1(r.camera_deg, 1)}</td>
                  <td>{f1(r.error_deg, 1)}</td><td>{f1(r.flatness, 2)}</td><td>{yes(r.flagged) ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Not measured yet. Run the tilt experiment and add tilt_experiment.csv.</p>
        )}
      </div>
    </>
  )
}