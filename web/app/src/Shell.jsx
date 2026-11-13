import { useState } from 'react'
import { supabase } from './supabaseClient'
import { displayName } from './constants'

function initials(p) {
  const s = ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase()
  return s || (p.email?.[0] || '?').toUpperCase()
}

export default function Shell({ profile, roleLabel, tabs, active, onTab, onSwitch, switchLabel, children }) {
  const [menu, setMenu] = useState(false)
  return (
    <div className="shell">
      <div className="side">
        <div className="brand">Kinote</div>
        {tabs.map((t) => (
          <button key={t} className={'tab' + (active === t ? ' active' : '')} onClick={() => onTab(t)}>{t}</button>
        ))}
        <div className="spacer" />
        <div className="account-wrap">
          {menu && <div style={{ position: 'fixed', inset: 0, zIndex: 15 }} onClick={() => setMenu(false)} />}
          {menu && (
            <div className="accmenu">
              <div className="email">{profile.email}</div>
              {onSwitch && <button onClick={() => { setMenu(false); onSwitch() }}>{switchLabel}</button>}
              <button onClick={() => supabase.auth.signOut()}>Sign out</button>
            </div>
          )}
          <button className="account" onClick={() => setMenu(!menu)}>
            <div className="avatar">{initials(profile)}</div>
            <div className="acctext">
              <div className="acctname">{displayName(profile)}</div>
              <div className="acctrole">{roleLabel}</div>
            </div>
          </button>
        </div>
      </div>
      <div className="main">{children}</div>
    </div>
  )
}