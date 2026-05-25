// app-print.jsx — renders Pier as a stack of fixed-size frames for PDF export.

const { useState: usePS, useEffect: usePE } = React;

// A test-console scene that's pre-populated with a sample exchange (so the PDF page
// shows real content rather than the empty state).
function TestConsolePrintScene() {
  const agent = window.AGENTS.find(a => a.id === 'svc_weatherwise');
  const messages = [
    { role: 'user',  kind: 'text', text: 'Forecast for 37.77,-122.42 next 24h' },
    { role: 'agent', kind: 'text', text: 'San Francisco, next 24h:\n\n• Tonight: 54°F, mostly clear, 0% precip.\n• Sun morning: 58°F, low marine layer clearing by 10am.\n• Sun afternoon: 67°F, sunny, breezy from the west 12 mph.\n• Sun evening: 60°F, partly cloudy.\n\nConfidence: high (model ensemble agreement 0.94).' },
  ];
  const rpcRequest = {
    jsonrpc: '2.0', id: 'tc-29704',
    method: 'message/stream',
    params: { message: { role: 'user', parts: [{ kind: 'text', text: messages[0].text }] }, skill: 'forecast.hourly' }
  };

  return (
    <div className="tc-page">
      <div className="tc-page-head">
        <div>
          <div className="tiny">Test console</div>
          <h1>Send a sample A2A request</h1>
          <p className="muted" style={{ maxWidth: 560 }}>Pick any registered agent and send a message through Pier's controlled test runner. Credentials are read from the secret store and never exposed.</p>
        </div>
        <div>
          <div className="tiny" style={{ marginBottom: 6 }}>Agent</div>
          <div className="select" style={{ width: 280, display: 'flex', alignItems: 'center' }}>WeatherWise — Stratosphere Labs</div>
        </div>
      </div>
      <div className="tc">
        <div className="tc-controls">
          <div className="tc-control">
            <div className="tiny">Endpoint</div>
            <div className="tc-endpoint mono">{agent.supportedInterfaces[0].url}</div>
          </div>
          <div className="tc-control" style={{ minWidth: 200 }}>
            <div className="tiny">Skill</div>
            <div className="select" style={{ display: 'flex', alignItems: 'center' }}>Hourly forecast (forecast.hourly)</div>
          </div>
          <div className="tc-control" style={{ minWidth: 180 }}>
            <div className="tiny">Auth profile</div>
            <div className="select" style={{ display: 'flex', alignItems: 'center' }}>dev (secret_ref:dev-key)</div>
          </div>
        </div>
        <div className="tc-grid">
          <div className="tc-pane">
            <div className="tc-pane-head">
              <span className="tiny">Conversation</span>
              <div className="tc-state">
                <window.ValidationDot status="passed"/>
                <span className="muted mono" style={{ fontSize: 11 }}>completed</span>
              </div>
            </div>
            <div className="tc-log">
              {messages.map((m, i) => (
                <div key={i} className={'tc-msg ' + m.role}>
                  <div className="tc-msg-meta">
                    <span className="badge badge-sm">{m.role}</span>
                    <span className="muted mono" style={{ fontSize: 11 }}>{m.kind}</span>
                  </div>
                  <div className="tc-msg-body">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="tc-input-row">
              <div className="textarea" style={{ flex: 1, minHeight: 44, padding: '10px 12px', color: 'var(--text-4)' }}>Type a message…</div>
              <div className="btn btn-primary">
                <window.Icon name="send" size={13}/>Send
              </div>
            </div>
          </div>
          <div className="tc-pane">
            <div className="tc-pane-head">
              <span className="tiny">Raw transport</span>
              <div className="seg seg-sm">
                <button className="on">Request</button>
                <button>Response</button>
              </div>
            </div>
            <window.HighlightedJSON obj={rpcRequest} style={{ flex: 1, minHeight: 0, border: 0, borderRadius: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintFrame({ idx, total, title, route, children }) {
  return (
    <div className="print-page">
      <window.TopBar route={route} setRoute={() => {}} />
      <div className="app-body">
        <window.SideNav route={route} setRoute={() => {}} />
        <main className="content">{children}</main>
      </div>
      <div className="print-caption">
        <span>{title}</span>
        <span><span className="num">{String(idx + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

function PrintApp() {
  // Apply default signal accent (the tweaks don't run in print mode).
  usePE(() => {
    document.documentElement.style.setProperty('--signal', '#C7F84A');
  }, []);

  const frames = [
    { title: 'Registry · catalog',           route: { name: 'registry' },
      body: r => <window.RegistryView route={r} setRoute={() => {}} layout="grid" density="comfortable" /> },
    { title: 'Service detail · overview',    route: { name: 'detail', id: 'svc_weatherwise', tab: 'overview' },
      body: r => <window.ServiceDetail route={r} setRoute={() => {}} /> },
    { title: 'Service detail · agent card',  route: { name: 'detail', id: 'svc_codereviewer', tab: 'card' },
      body: r => <window.ServiceDetail route={r} setRoute={() => {}} /> },
    { title: 'Builder · identity step',      route: { name: 'builder', step: 1 },
      body: r => <window.BuilderView route={r} setRoute={() => {}} /> },
    { title: 'Test console · in flight',     route: { name: 'console' },
      body: r => <TestConsolePrintScene /> },
    { title: 'Activity · registry events',   route: { name: 'activity' },
      body: r => <window.ActivityView route={r} setRoute={() => {}} /> },
  ];

  return (
    <>
      {frames.map((f, i) => (
        <PrintFrame key={i} idx={i} total={frames.length} title={f.title} route={f.route}>
          {f.body(f.route)}
        </PrintFrame>
      ))}
    </>
  );
}

// Initial render. Wait for fonts + a paint cycle, then auto-print.
ReactDOM.createRoot(document.getElementById('root')).render(<PrintApp/>);

// Wait for fonts to load and components to settle before triggering the print dialog.
function startPrint() {
  // Give one more frame to ensure all layout is committed.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    setTimeout(() => window.print(), 500);
  }));
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(startPrint);
} else {
  setTimeout(startPrint, 1500);
}
