import { supabase } from './supabaseClient'

export default function Shell({ who, tabs, active, onTab, children }) {
  return (
    <div className="shell">
      <div className="side">
        <div className="brand">Kinote</div>
        <div className="who">{who}</div>
        {tabs.map((t) => (
          <button key={t} className={'tab' + (active === t ? ' active' : '')} onClick={() => onTab(t)}>{t}</button>
        ))}
        <div className="spacer" />
        <button className="tab" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      <div className="main">{children}</div>
    </div>
  )
}