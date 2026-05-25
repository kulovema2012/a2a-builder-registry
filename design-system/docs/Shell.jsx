// Shell.jsx — app chrome: top bar + sidebar.

const { useState } = React;

function PierMark({ size = 22 }) {
  // Custom wordmark glyph — stacked dock/pier silhouette.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17h18"/>
        <path d="M3 13h18"/>
        <path d="M6 21V13"/>
        <path d="M18 21V13"/>
        <path d="M10 13V7l2-3 2 3v6"/>
      </g>
      <circle cx="12" cy="5" r="1.4" fill="var(--signal)"/>
    </svg>
  );
}

function CmdK() {
  return (
    <div className="cmdk" onClick={() => window.dispatchEvent(new CustomEvent('pier:cmdk'))}>
      <Icon name="search" size={14} />
      <span className="muted">Search registry, skills, providers…</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        <kbd>⌘</kbd><kbd>K</kbd>
      </div>
    </div>
  );
}

function TopBar({ route, setRoute }) {
  const [orgOpen, setOrgOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="brand" onClick={() => setRoute({ name: 'registry' })}>
          <PierMark size={20} />
          <span className="brand-word">Pier</span>
          <span className="brand-tag">/ a2a</span>
        </button>
        <span className="vr" style={{ height: 18, margin: '0 4px' }}></span>
        <button className="org" onClick={() => setOrgOpen(o => !o)}>
          <div className="org-mark">SL</div>
          <span>Stratosphere Labs</span>
          <span className="badge badge-sm" style={{ marginLeft: 4 }}>Team</span>
          <Icon name="chevronDown" size={14} />
        </button>
      </div>

      <div className="topbar-center">
        <CmdK />
      </div>

      <div className="topbar-right">
        <button className="btn btn-ghost btn-sm" title="Activity" onClick={() => setRoute({ name: 'activity' })}>
          <Icon name="activity" size={15} />
        </button>
        <button className="btn btn-ghost btn-sm" title="Docs">
          <Icon name="fileText" size={15} />
        </button>
        <button className="btn btn-ghost btn-sm" title="Notifications" style={{ position: 'relative' }}>
          <Icon name="bell" size={15} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--signal)' }}></span>
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setRoute({ name: 'builder', step: 0, draft: null })}>
          <Icon name="plus" size={14} />
          Register agent
        </button>
        <button className="avatar" title={window.ME.email}>
          <span>MC</span>
        </button>
      </div>
    </header>
  );
}

function SideNav({ route, setRoute }) {
  const items = [
    { id: 'registry', label: 'Registry', icon: 'cube', count: 12 },
    { id: 'my', label: 'My agents', icon: 'package', count: 3 },
    { id: 'builder', label: 'Builder', icon: 'beaker' },
    { id: 'console', label: 'Test console', icon: 'terminal' },
    { id: 'activity', label: 'Activity', icon: 'activity' },
    { id: 'approvals', label: 'Approvals', icon: 'flag', count: 2, danger: true },
  ];
  const settings = [
    { id: 'keys', label: 'API keys', icon: 'key' },
    { id: 'members', label: 'Members', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'cog' },
  ];
  return (
    <aside className="sidenav">
      <nav className="sidenav-section">
        <div className="tiny" style={{ padding: '0 10px 6px' }}>Workspace</div>
        {items.map(it => {
          const active = route.name === it.id;
          return (
            <button key={it.id} className={'sidenav-item' + (active ? ' active' : '')}
                    onClick={() => setRoute({ name: it.id })}>
              <Icon name={it.icon} size={15} />
              <span>{it.label}</span>
              {it.count != null && (
                <span className={'sidenav-count' + (it.danger ? ' danger' : '')}>{it.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="hr" style={{ margin: '12px 8px' }}></div>

      <nav className="sidenav-section">
        <div className="tiny" style={{ padding: '0 10px 6px' }}>Categories</div>
        {window.CATEGORIES.slice(0, 6).map(c => (
          <button key={c} className="sidenav-item small"
                  onClick={() => setRoute({ name: 'registry', filter: { category: c } })}>
            <span className="cat-dot"></span>
            <span>{c}</span>
          </button>
        ))}
        <button className="sidenav-item small muted">
          <Icon name="more" size={14} />
          <span>3 more…</span>
        </button>
      </nav>

      <div style={{ flex: 1 }}></div>

      <nav className="sidenav-section">
        {settings.map(it => (
          <button key={it.id} className="sidenav-item small muted"
                  onClick={() => setRoute({ name: it.id })}>
            <Icon name={it.icon} size={14} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidenav-foot">
        <div className="live-dot"></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Registry healthy</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>12 agents · 99.9% uptime</div>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { TopBar, SideNav, PierMark });
