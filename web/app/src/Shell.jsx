import { useState } from 'react'
import { supabase } from './supabaseClient'
import { displayName } from './constants'

function initials(p) {
  const s = ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase()
  return s || (p.email?.[0] || '?').toUpperCase()
}

export default function Shell({ profile, roleLabel, tabs, active, onTab, onSwitch, switchLabel, children }) {
  const [menu, setMenu] = useState(false)
  const [drawer, setDrawer] = useState(false)

  function pick(t) { onTab(t); setDrawer(false) }

  return (
    <div className="app">
      <header className="topbar">
        <button className="burger" aria-label="Open menu" onClick={() => setDrawer(true)}>
          <span /><span /><span />
        </button>
        <div className="tbrand">Kinote</div>
        <nav className="navtabs">
          {tabs.map((t) => (
            <button key={t} className={'ntab' + (active === t ? ' on' : '')} onClick={() => pick(t)}>{t}</button>
          ))}
        </nav>
        <div className="tspacer" />
        <div className="acc-wrap">
          <button className="acc-btn" onClick={() => setMenu(!menu)}>
            <span className="av">{initials(profile)}</span>
            <span className="acc-text">
              <b>{displayName(profile)}</b>
              <small>{roleLabel}</small>
            </span>
          </button>
          {menu && <div className="clickaway" onClick={() => setMenu(false)} />}
          {menu && (
            <div className="accmenu2">
              <div className="em">{profile.email}</div>
              {onSwitch && <button onClick={() => { setMenu(false); onSwitch() }}>{switchLabel}</button>}
              <button onClick={() => supabase.auth.signOut()}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}
      <aside className={'drawer' + (drawer ? ' open' : '')}>
        <div className="drawer-head">
          <div className="tbrand">Kinote</div>
          <button className="dclose" aria-label="Close menu" onClick={() => setDrawer(false)}>×</button>
        </div>
        {tabs.map((t) => (
          <button key={t} className={'dtab' + (active === t ? ' on' : '')} onClick={() => pick(t)}>{t}</button>
        ))}
      </aside>

      <main className="content">{children}</main>
    </div>
  )
}