// app.jsx — root: routing, command palette, tweaks panel.

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C7F84A",
  "density": "comfortable",
  "catalogLayout": "grid",
  "fontPair": "geist",
  "backgroundTone": "cool"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#C7F84A','#FFB58E','#B8A4FF','#7CC4FF','#4ADE80','#F87171'];

function CommandPalette({ open, onClose, setRoute }) {
  const [q, setQ] = useStateApp('');
  useEffectApp(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;

  const items = [
    ...window.AGENTS.map(a => ({ kind: 'agent', label: a.name, sub: a.provider.organization, icon: 'cube',
                                  go: () => setRoute({ name: 'detail', id: a.id, tab: 'overview' }) })),
    { kind: 'action', label: 'Register a new agent', sub: 'Open the builder', icon: 'plus',
      go: () => setRoute({ name: 'builder', step: 0 }) },
    { kind: 'action', label: 'Import Agent Card by URL', sub: 'Builder · Start', icon: 'upload',
      go: () => setRoute({ name: 'builder', step: 0 }) },
    { kind: 'nav', label: 'Test console', sub: 'Send a sample A2A request', icon: 'terminal',
      go: () => setRoute({ name: 'console' }) },
    { kind: 'nav', label: 'Activity', sub: 'Recent registry events', icon: 'activity',
      go: () => setRoute({ name: 'activity' }) },
    { kind: 'nav', label: 'Approvals', sub: 'Pending review', icon: 'flag',
      go: () => setRoute({ name: 'approvals' }) },
  ];

  const filtered = q ? items.filter(i => (i.label + ' ' + i.sub).toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk-panel fade-in" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input">
          <Icon name="search" size={16} className="muted"/>
          <input autoFocus placeholder="Search agents, skills, providers, or jump to a page…"
                 value={q} onChange={e => setQ(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Escape') onClose();
                   if (e.key === 'Enter' && filtered[0]) { filtered[0].go(); onClose(); }
                 }}/>
          <kbd>Esc</kbd>
        </div>
        <div className="cmdk-list">
          {filtered.length === 0 && <div className="cmdk-empty muted">No results for "{q}"</div>}
          {filtered.slice(0, 8).map((it, i) => (
            <button key={i} className="cmdk-item" onClick={() => { it.go(); onClose(); }}>
              <Icon name={it.icon} size={15} className="muted"/>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div>{it.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>{it.sub}</div>
              </div>
              <span className="badge badge-sm">{it.kind}</span>
            </button>
          ))}
        </div>
        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

function applyTweaks(t) {
  const r = document.documentElement;
  r.style.setProperty('--signal', t.accent);
  // derive dimmer & 2 variants
  const hex = t.accent.replace('#','');
  const dimAlpha = '24'; // hex 0x24 = ~14% alpha
  r.style.setProperty('--signal-dim', '#' + hex + dimAlpha);
  // brightness-ish
  r.style.setProperty('--signal-2', t.accent);
  // background tone
  if (t.backgroundTone === 'warm') {
    r.style.setProperty('--bg', '#0C0A09');
    r.style.setProperty('--bg-2', '#100D0B');
    r.style.setProperty('--surface', '#1A1612');
    r.style.setProperty('--surface-2', '#1F1A15');
    r.style.setProperty('--surface-3', '#26201A');
  } else if (t.backgroundTone === 'neutral') {
    r.style.setProperty('--bg', '#0B0B0B');
    r.style.setProperty('--bg-2', '#0F0F0F');
    r.style.setProperty('--surface', '#161616');
    r.style.setProperty('--surface-2', '#1B1B1B');
    r.style.setProperty('--surface-3', '#222222');
  } else {
    r.style.setProperty('--bg', '#0A0A0C');
    r.style.setProperty('--bg-2', '#0E0E11');
    r.style.setProperty('--surface', '#131318');
    r.style.setProperty('--surface-2', '#181820');
    r.style.setProperty('--surface-3', '#1F1F28');
  }
  // font pair
  const sans = t.fontPair === 'mono-first' ? "'Geist Mono', ui-monospace, monospace"
             : t.fontPair === 'serif-display' ? "'Geist', sans-serif"
             : "'Geist', ui-sans-serif, system-ui, sans-serif";
  r.style.setProperty('--font-sans', sans);
}

function App() {
  const [route, setRoute] = useStateApp({ name: 'registry' });
  const [cmdkOpen, setCmdkOpen] = useStateApp(false);
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  useEffectApp(() => { applyTweaks(t); }, [t]);

  useEffectApp(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdkOpen(o => !o); }
      if (e.key === 'Escape') setCmdkOpen(false);
    };
    const onCmdK = () => setCmdkOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pier:cmdk', onCmdK);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pier:cmdk', onCmdK); };
  }, []);

  return (
    <>
      <TopBar route={route} setRoute={setRoute} />
      <div className="app-body">
        <SideNav route={route} setRoute={setRoute} />
        <main className="content" key={route.name + (route.id || '')}>
          {route.name === 'registry' && <RegistryView route={route} setRoute={setRoute} layout={t.catalogLayout} density={t.density} />}
          {route.name === 'my' && <RegistryView route={{ ...route, filter: { ownerOrg: 'stratosphere' } }} setRoute={setRoute} layout={t.catalogLayout} density={t.density} />}
          {route.name === 'detail' && <ServiceDetail route={route} setRoute={setRoute} />}
          {route.name === 'builder' && <BuilderView route={route} setRoute={setRoute} />}
          {route.name === 'console' && <TestConsoleView route={route} setRoute={setRoute} />}
          {route.name === 'activity' && <ActivityView route={route} setRoute={setRoute} />}
          {route.name === 'approvals' && <ApprovalsView route={route} setRoute={setRoute} />}
          {(route.name === 'keys' || route.name === 'members' || route.name === 'settings') && (
            <GenericView title={route.name} subtitle="Workspace administration"/>
          )}
        </main>
      </div>

      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} setRoute={setRoute} />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Theme" />
        <window.TweakColor label="Signal accent" value={t.accent} options={ACCENT_OPTIONS}
                           onChange={v => setTweak('accent', v)} />
        <window.TweakRadio label="Background" value={t.backgroundTone}
                           options={['cool', 'warm', 'neutral']}
                           onChange={v => setTweak('backgroundTone', v)} />

        <window.TweakSection label="Catalog" />
        <window.TweakRadio label="Layout" value={t.catalogLayout}
                           options={['grid', 'list', 'table']}
                           onChange={v => setTweak('catalogLayout', v)} />
        <window.TweakRadio label="Density" value={t.density}
                           options={['comfortable', 'compact']}
                           onChange={v => setTweak('density', v)} />
      </window.TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
