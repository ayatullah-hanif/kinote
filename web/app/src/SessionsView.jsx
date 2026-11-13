export default function SessionsView({ sessions, onOpen, openId }) {
  if (!sessions.length) {
    return <div className="card"><p className="muted">No sessions yet.</p></div>
  }
  const tracked = sessions.filter((s) => s.status === 'recorded')
  const max = Math.max(8, ...tracked.map((s) => s.repetitions || 0))
  return (
    <>
      <div className="card">
        <h3>Repetitions per session</h3>
        <div className="bars">
          {sessions.map((s, i) => {
            const ok = s.status === 'recorded'
            const h = ok ? Math.max(4, ((s.repetitions || 0) / max) * 85) : 8
            return (
              <div className="barcol" key={s.id}>
                <div className="barwrap">
                  <div className="barval">{ok ? s.repetitions : 'n/a'}</div>
                  <div className={ok ? 'bar' : 'bar bar-off'} style={{ height: h + '%' }} />
                </div>
                <div className="barlab">S{i + 1}</div>
              </div>
            )
          })}
        </div>
        <p className="muted small">Oldest to newest. Hatched bars are sessions where the arm was not tracked well enough, so no result is given.</p>
      </div>
      <div className="card scroll">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              {onOpen && <th>Details</th>}
              <th>Repetitions</th><th>Range of motion</th><th>Tracking</th><th>Result</th><th>Source</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const ok = s.status === 'recorded'
              return (
                <tr key={s.id} style={openId === s.id ? { background: 'var(--soft)' } : undefined}>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  {onOpen && (
                    <td>
                      {(s.clip_path || s.angle_curve)
                        ? <button className="btn btn-ghost" style={{ padding: '5px 10px', whiteSpace: 'nowrap' }} onClick={() => onOpen(s)}>{s.clip_path ? 'Watch video' : 'View curve'}</button>
                        : <span className="muted small">None</span>}
                    </td>
                  )}
                  <td>{ok ? s.repetitions : 'not tracked'}</td>
                  <td>{ok ? Math.round(s.range_of_motion_deg) + '°' : 'not tracked'}</td>
                  <td>{Math.round((s.visibility || 0) * 100)}%</td>
                  <td>{ok ? <span className="pill">Tracked</span> : <span className="pill pill-warn">Withheld: poor tracking</span>}</td>
                  <td>{s.source}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}