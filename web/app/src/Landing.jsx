import './landing.css'
function go(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function ArmSvg() {
  return (
    <svg viewBox="0 0 340 260" className="lp-svg" role="img" aria-label="Illustration of arm tracking">
      <defs>
        <linearGradient id="lpg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1d2f35" /><stop offset="1" stopColor="#0e191c" />
        </linearGradient>
      </defs>
      <rect width="340" height="260" rx="18" fill="url(#lpg)" />
      <circle cx="78" cy="46" r="24" fill="#243a41" />
      <rect x="28" y="76" width="100" height="190" rx="44" fill="#243a41" />
      <path d="M90 90 L175 165 L265 100" fill="none" stroke="#2fd06a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M149.5 142.5 A34 34 0 0 1 202.6 145.1" fill="none" stroke="#ffe14d" strokeWidth="2.5" />
      <text x="176" y="124" textAnchor="middle" fontSize="14" fontWeight="700" fill="#ffe14d">103°</text>
      {[[90, 90], [175, 165], [265, 100]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="8" fill="#ffe14d" />)}
      <rect x="16" y="214" width="170" height="32" rx="8" fill="rgba(255,255,255,.1)" />
      <text x="28" y="235" fontSize="14" fontWeight="700" fill="#fff">Elbow 103°  ·  Rep 5 of 8</text>
    </svg>
  )
}

const STEPS = [
  ['Your physiotherapist sets the exercise', 'They choose the exercise and the number of repetitions, and add a demonstration video or link so you know exactly what to do.'],
  ['You practise at home with guidance', 'Open the session, and the camera follows your arm, counts each repetition and tells you if you drift out of view.'],
  ['Kinote measures what happened', 'Joint angle, range of motion and repetitions come from the camera. Muscle and brain signals add what the camera cannot see.'],
  ['Your physiotherapist reviews it with confidence levels', 'They see results, the saved video if you agreed to share it, and how far each number can be trusted.'],
]

export default function Landing({ onSignIn, onSignUp }) {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-navin">
          <div className="lp-logo">Kinote</div>
          <nav className="lp-links">
            <button className="lp-link" onClick={() => go('how')}>How it works</button>
            <button className="lp-link" onClick={() => go('who')}>Who it is for</button>
            <button className="lp-link" onClick={() => go('why')}>Why Kinote</button>
          </nav>
          <div className="lp-sp" />
          <button className="btn btn-ghost" onClick={onSignIn}>Sign in</button>
          <button className="btn lp-hide-sm" onClick={onSignUp}>Create account</button>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap lp-herogrid">
          <div>
            <span className="pill">Stroke rehabilitation, at home</span>
            <h1>Recovery work you can do at home, and a physiotherapist who can trust what they see.</h1>
            <p className="lp-lead">
              Kinote lets stroke survivors practise guided exercises at home while their physiotherapist sees how each
              session really went: the movement from the camera, the muscle and brain activity beneath it, and a clear
              signal of how far to trust every number.
            </p>
            <div className="lp-cta">
              <button className="btn btn-lg" onClick={onSignUp}>Create a free account</button>
              <button className="btn btn-ghost btn-lg" onClick={() => go('how')}>See how it works</button>
            </div>
          </div>
          <div className="lp-visual">
            <ArmSvg />
            <div className="lp-chip lp-chip-ok">Arm tracked in 97% of frames</div>
            <div className="lp-mini">
              <div className="lp-minirow"><span className="pill">Measured</span> 8 repetitions, 137° range</div>
              <div className="lp-minirow"><span className="pill">Model estimate</span> Attempt detected on 78% of cues</div>
              <div className="lp-minirow"><span className="pill pill-warn">Can’t tell</span> Signal too poor to judge</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap">
          <h2>Recovery does not stop when the clinic closes</h2>
          <p className="lp-sub">Regular physiotherapy matters after a stroke, but the people who need it most often find it hardest to reach.</p>
          <div className="lp-cards3">
            <div className="lp-card"><div className="lp-ico">1</div><h3>Getting to the clinic is hard</h3><p>Transport costs, inaccessible buildings and caregivers taking time off work make regular visits difficult for many families.</p></div>
            <div className="lp-card"><div className="lp-ico">2</div><h3>Home practice goes unseen</h3><p>Between visits, nobody can tell whether exercises are being done, or done well, and patients are left guessing.</p></div>
            <div className="lp-card"><div className="lp-ico">3</div><h3>Poor data can mislead</h3><p>A bad camera angle or a loose sensor can look like progress or decline. Numbers without context can steer care the wrong way.</p></div>
          </div>
        </div>
      </section>

      <section className="lp-sec lp-alt" id="how">
        <div className="lp-wrap">
          <h2>How Kinote works</h2>
          <p className="lp-sub">One loop between the patient at home and the physiotherapist.</p>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={i}>
                <div className="lp-num">{i + 1}</div>
                <div><h3>{s[0]}</h3><p>{s[1]}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec" id="who">
        <div className="lp-wrap">
          <h2>Built for both sides of recovery</h2>
          <div className="lp-two">
            <div className="lp-card lp-big">
              <span className="pill">For patients and caregivers</span>
              <h3>Practise with confidence</h3>
              <ul>
                <li>See today’s exercise, the instructions and a demonstration video.</li>
                <li>Get live feedback: your elbow angle, your repetition count and a reminder to keep your arm in view.</li>
                <li>Choose whether a video of your session is saved. Nothing is recorded unless you agree.</li>
                <li>Follow your own progress, session by session.</li>
                <li>Message your physiotherapist directly.</li>
              </ul>
            </div>
            <div className="lp-card lp-big">
              <span className="pill">For physiotherapists</span>
              <h3>See the session, not just the score</h3>
              <ul>
                <li>Assign an exercise with a repetition target, instructions and a video.</li>
                <li>Review repetitions, range of motion and tracking quality for every session.</li>
                <li>Watch the saved video next to the angle curve with each repetition marked.</li>
                <li>Follow muscle and brain signal trends, shown with their uncertainty.</li>
                <li>Get honest comparisons: “no reliable change” when the data does not support more.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-sec lp-dark" id="why">
        <div className="lp-wrap">
          <h2>Most tools show you a number. Kinote also tells you whether to believe it.</h2>
          <p className="lp-sub">Recordings made outside a clinic are messy. Kinote is built around that fact.</p>
          <div className="lp-cards3">
            <div className="lp-card lp-cardd"><h3>Every source is scored</h3><p>Camera tracking, muscle signals and brain signals each get a quality score, so cleaner data counts for more.</p></div>
            <div className="lp-card lp-cardd"><h3>“Can’t tell” is an answer</h3><p>When a recording is too poor, Kinote withholds the result instead of guessing, so noise is never mistaken for a real change.</p></div>
            <div className="lp-card lp-cardd"><h3>Every figure is labelled</h3><p>Each number is marked <b>Measured</b> or <b>Model estimate</b>, so a physiotherapist always knows where it came from.</p></div>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap lp-two lp-center">
          <div>
            <h2>See beyond the movement</h2>
            <p className="lp-lead">A camera shows what the body did. Muscle (EMG) and brain (EEG) signals show the activity behind it, including effort that a camera alone can miss. Kinote brings the three together on one screen, and shows how much weight each deserves.</p>
          </div>
          <div className="lp-trio">
            <div><b>Camera</b><span>Angle, range of motion, repetitions</span></div>
            <div><b>Muscle (EMG)</b><span>How strongly the forearm responds</span></div>
            <div><b>Brain (EEG)</b><span>Motor-area rhythm during an attempt</span></div>
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap">
          <h2>Ready to see it for yourself?</h2>
          <p>Create an account and start your first session in minutes.</p>
          <div className="lp-cta lp-ctac">
            <button className="btn btn-lg lp-btnw" onClick={onSignUp}>Create a free account</button>
            <button className="btn btn-lg lp-btno" onClick={onSignIn}>Sign in</button>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">
          <b>Kinote</b>
          <span>Kinote supports, and does not replace, the judgement of a physiotherapist. It is a research prototype, not a medical device, and gives no diagnosis.</span>
        </div>
      </footer>
    </div>
  )
}