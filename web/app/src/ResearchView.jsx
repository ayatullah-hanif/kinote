import { useEffect, useState } from 'react'
import { loadCsv, num } from './data'
import TrendChart from './TrendChart'
import ExperimentView from './ExperimentView'

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
const VERDICT = {
  'no earlier session': 'First session',
  'no reliable change': 'No reliable change',
  'clear rise': 'Rose, beyond normal variation',
  'clear fall': 'Fell, beyond normal variation',
  'not enough data': 'Not enough data',
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

function Details({ title, hint, children }) {
  return (
    <details className="card">
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
        {title} {hint && <span className="muted small" style={{ fontWeight: 400 }}>· {hint}</span>}
      </summary>
      <div style={{ marginTop: 12 }}>{children}</div>
    </details>
  )
}

function Stat({ big, title, sub }) {
  return (
    <div className="card" style={{ margin: 0 }}>
      <div className="muted small" style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', margin: '6px 0' }}>{big}</div>
      <div className="small" style={{ lineHeight: 1.5 }}>{sub}</div>
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
      loadCsv('degradation_results_25pct.csv'),
      loadCsv('tilt_experiment.csv').catch(() => null),
    ]).then(([auc, cal, rc, rcs, ctl, mdc, deg, tilt]) => setD({ auc, cal, rc, rcs, ctl, mdc, deg, tilt }))
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
  const clean = d.deg.find((r) => r.condition === 'clean')
  const loose = d.deg.find((r) => r.condition === 'emg_dropout_1' && yes(r.damaged))

  return (
    <>
      <div className="banner">[Replayed recording, simulated damage] Research results computed on a public dataset (4 patients, 94 recordings). Not patient data.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Stat title="Loose electrode, wrong answers"
          big={loose ? f1(loose.wrongEqual, 0) + '% → ' + f1(loose.wrongQuality, 1) + '%' : '–'}
          sub={loose ? <>Ordinary fusion against Kinote. Kinote withholds {f1(loose.withheld, 0)}% of those cues instead of guessing.</> : ''} />
        <Stat title="Wrong even on clean recordings"
          big={clean ? f1(clean.wrongEqual, 0) + '%' : '–'}
          sub="The model's own mistakes. No quality score can see them, so a cleaner signal does not make a single cue more right." />
        <Stat title="Smallest detectable change"
          big={smallest === null ? '–' : '≈ ' + Math.round(smallest) + ' pts'}
          sub="Change in attempt rate between two sessions before it exceeds the normal variation between repeat recordings." />
      </div>

      <div className="card scroll">
        <h3>Session-to-session change</h3>
        <p className="small">Read a row like this: if the change is smaller than the number needed, it is within normal variation and is not reported as progress or decline. This describes the recordings only, not recovery.</p>
        <table>
          <thead><tr><th>Patient</th><th>Session</th><th>Change (points)</th><th>Needed (points)</th><th>Result</th><th>Earlier version said</th></tr></thead>
          <tbody>
            {mdcRows.map((r, i) => {
              const differs = yes(r.verdicts_differ)
              return (
                <tr key={i} className={differs ? 'row-warn' : ''}>
                  <td>{r.patient}</td>
                  <td>{r.session} vs {r.prev_session}</td>
                  <td>{f1(r.change_points, 0)}</td>
                  <td>{f1(r.mdc_points, 0)}</td>
                  <td>{VERDICT[r.verdict_mdc] || r.verdict_mdc}</td>
                  <td>{differs ? (VERDICT[r.verdict_binomial] || r.verdict_binomial) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="muted small" style={{ marginBottom: 0 }}>Shaded rows are comparisons the earlier method called a rise or fall and the repeat-recording method does not. Sessions with a different mix of left and right recordings may differ for that reason alone.</p>
      </div>

      <div className="card">
        <h3>Key Findings</h3>
        <ul className="small" style={{ lineHeight: 1.6, marginBottom: 6 }}>
          <li><b>Kinote knows when not to answer.</b> When a muscle sensor is loose, it withholds the cue instead of guessing, where ordinary fusion is close to a coin flip.</li>
          <li><b>Quality checks cannot fix everything.</b> The base decision is wrong on roughly one clean cue in four, and withholding by quality lowers that only a little.</li>
          <li><b>Small session-to-session differences are mostly noise.</b> The dashboard says "no reliable change" far more often than the earlier version did.</li>
        </ul>
        <p className="muted small" style={{ marginBottom: 0 }}>Limits: damage is simulated; four dataset patients; labels come from the cue protocol; the camera and the EEG/EMG come from different people.</p>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>Detailed analyses</h3>

      <Details title="Damage detection by the quality score" hint="7 damage types, 3 scoring versions">
        <p className="muted small">Area under the ROC curve: 0.5 is chance, 1.0 is perfect. "Held out" means the damage type was not used to design the first score. The newer score was written with these types in view, so its held-out numbers are optimistic.</p>
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
      </Details>

      <Details title="Outcome for damaged cues" hint="withheld share and remaining errors, per damage type">
        <p className="muted small">Each rule's cut-off withholds 5% of clean cues, set without damage labels. "Wrong if forced" is the error rate if every cue were answered. Withheld cues are never counted as correct. The "worst check" version could not be calibrated: more than 5% of clean cues score zero on at least one check.</p>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Damage</th><th>Wrong if forced</th><th>v1 withheld</th><th>v1 wrong, answered</th><th>v2 withheld</th><th>v2 wrong, answered</th></tr>
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
      </Details>

      <Details title="Fusion comparison across all damage types" hint="ordinary against reliability-aware fusion">
        <ExperimentView />
      </Details>

      <Details title="Risk-coverage analysis" hint="chart and 95% intervals">
        <TrendChart title="Error among answered cues"
          sessions={covs} series={series} fixedRange={[0, 45]} fmt={(v) => Math.round(v) + '%'}
          xPrefix="" xSuffix="%"
          note="Horizontal axis: share of cues answered. Vertical: error among the answered cues. Random is no skill; Oracle is a perfect ranking. Stress mix: clean plus 7 damage types, 25% of cues damaged." />
        <div className="scroll">
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
        <p className="muted small" style={{ marginBottom: 0 }}>Overlapping intervals mean the difference is not established.</p>
      </Details>

      <Details title="Error-rate guarantee on a new patient" hint="cut-off chosen on three patients, tested on the fourth">
        <p className="muted small">0% answered means no cut-off qualified, so everything is withheld. With the current features, no rule met a 15% or 20% error target on a new patient.</p>
        <div className="scroll">
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
      </Details>

      <Details title="Camera angle with out-of-plane arm tilt" hint="protractor test">
        {d.tilt ? (
          <div className="scroll">
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
          </div>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>Not measured yet. Run the tilt experiment and add tilt_experiment.csv.</p>
        )}
      </Details>
    </>
  )
}