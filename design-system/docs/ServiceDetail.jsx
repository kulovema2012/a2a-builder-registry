// ServiceDetail.jsx — full agent detail with tabs.

const { useState: useStateD, useMemo: useMemoD } = React;

function CodeSnippet({ lang, code, copyId }) {
  const [copied, setCopied] = useStateD(false);
  return (
    <div className="snippet">
      <div className="snippet-head">
        <span className="tiny">{lang}</span>
        <button className="btn-ghost btn btn-sm" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          <Icon name={copied ? 'check' : 'copy'} size={12} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-block" style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>{code}</pre>
    </div>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={'tab' + (active === t.id ? ' active' : '')}
                onClick={() => onSelect(t.id)}>
          {t.icon && <Icon name={t.icon} size={14} />}
          <span>{t.label}</span>
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function MetaRow({ k, children, mono }) {
  return (
    <div className="meta-row">
      <div className="meta-k">{k}</div>
      <div className={'meta-v' + (mono ? ' mono' : '')}>{children}</div>
    </div>
  );
}

function ValidationSummary({ agent }) {
  const checks = [
    { id: 'reach', label: 'Agent Card reachable', state: 'ok', detail: 'Fetched in 312ms, valid JSON' },
    { id: 'schema', label: 'Schema valid', state: 'ok', detail: 'All required fields present' },
    { id: 'interfaces', label: 'Supported interfaces resolve', state: agent.validationStatus === 'failed' ? 'err' : 'ok', detail: agent.supportedInterfaces.length + ' interface(s) checked' },
    { id: 'caps', label: 'Capabilities match behavior', state: agent.validationStatus === 'warning' ? 'warn' : 'ok', detail: agent.capabilities.streaming ? 'Streaming response confirmed' : 'No streaming declared' },
    { id: 'secrets', label: 'No plaintext credentials', state: 'ok', detail: 'Public card scanned' },
    { id: 'auth', label: 'Auth scheme well-formed', state: 'ok', detail: agent.auth.type + ' scheme documented' },
    { id: 'modes', label: 'Default modes are valid media types', state: 'ok', detail: agent.defaultOutputModes.join(', ') },
    { id: 'version', label: 'Version/checksum present', state: agent.validationStatus === 'warning' ? 'warn' : 'ok', detail: 'v' + agent.version },
  ];
  const stateClass = { ok: 'badge-ok', warn: 'badge-warn', err: 'badge-err' };
  const stateIcon = { ok: 'check2', warn: 'warning', err: 'alert' };

  return (
    <div className="card validation-panel">
      <div className="vp-head">
        <div>
          <div className="tiny">Validation</div>
          <div className="vp-score">
            <span className="vp-score-num tnum mono">{agent.score}</span>
            <span className="vp-score-out muted">/ 100</span>
            <span className={'badge ' + (agent.validationStatus === 'passed' ? 'badge-ok' : agent.validationStatus === 'warning' ? 'badge-warn' : 'badge-err')}
                  style={{ marginLeft: 8 }}>
              <Icon name={stateIcon[agent.validationStatus === 'passed' ? 'ok' : agent.validationStatus === 'warning' ? 'warn' : 'err']} size={11}/>
              {agent.validationStatus}
            </span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Last run {window.fmtAgo(agent.lastValidated)} · response {checks.length ? '312ms' : '—'}</div>
        </div>
        <button className="btn btn-sm"><Icon name="refresh" size={13}/>Re-run</button>
      </div>
      <div className="hr"></div>
      <ul className="vp-checks">
        {checks.map(c => (
          <li key={c.id}>
            <span className={'vp-state ' + stateClass[c.state]}>
              <Icon name={stateIcon[c.state]} size={11} />
            </span>
            <div style={{ flex: 1 }}>
              <div>{c.label}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewTab({ agent }) {
  const card = useMemoD(() => window.buildAgentCardJSON(agent), [agent]);
  const cardURL = (agent.supportedInterfaces[0].url.replace(/\/$/, '') + '/.well-known/agent-card.json');
  return (
    <div className="detail-overview">
      <div className="detail-overview-main">
        <section className="card section">
          <div className="section-head">
            <h3>About</h3>
          </div>
          <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6, maxWidth: 720 }}>{agent.description}</p>
          <div className="tag-row" style={{ marginTop: 12 }}>
            {agent.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>
        </section>

        <section className="card section">
          <div className="section-head">
            <h3>Skills</h3>
            <span className="muted mono" style={{ fontSize: 12 }}>{agent.skills.length} skills declared</span>
          </div>
          <ul className="skills-list">
            {agent.skills.map(s => (
              <li key={s.id} className="skill-item">
                <div className="skill-item-head">
                  <span className="mono" style={{ fontSize: 12, color: 'var(--signal)' }}>{s.id}</span>
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                </div>
                <p className="muted" style={{ margin: '4px 0 8px', fontSize: 13 }}>{s.description}</p>
                <div className="skill-item-foot">
                  <div className="tag-row">
                    {s.tags.map(t => <span key={t} className="tag" style={{ fontSize: 10.5, height: 18, padding: '0 6px' }}>{t}</span>)}
                  </div>
                  {s.examples?.[0] && (
                    <div className="skill-example mono">
                      <Icon name="chevronRight" size={11} className="muted" />
                      <span>{s.examples[0]}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card section">
          <div className="section-head">
            <h3>Connect from a client agent</h3>
            <div className="seg seg-sm">
              <button className="on">curl</button>
              <button>TypeScript</button>
              <button>Python</button>
            </div>
          </div>
          <CodeSnippet lang="bash" code={`# Send a JSON-RPC message to ${agent.name}
curl -X POST ${agent.supportedInterfaces[0].url} \\
  -H "Content-Type: application/json" \\
  -H "${agent.auth.name || 'Authorization'}: $${agent.auth.type.toUpperCase()}_TOKEN" \\
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{ "kind": "text", "text": "${agent.skills[0]?.examples?.[0] || 'Hello'}" }]
      }
    }
  }'`} />
        </section>
      </div>

      <aside className="detail-overview-side">
        <div className="card section">
          <div className="tiny" style={{ marginBottom: 12 }}>Identity</div>
          <MetaRow k="Provider">{agent.provider.organization}</MetaRow>
          <MetaRow k="Provider URL" mono>
            <a href="#" style={{ color: 'var(--info)' }}>{agent.provider.url}<Icon name="external" size={11} style={{ marginLeft: 4, display: 'inline' }} /></a>
          </MetaRow>
          <MetaRow k="Version" mono>v{agent.version}</MetaRow>
          <MetaRow k="Owner" mono>{agent.owner}</MetaRow>
          <MetaRow k="Category">{agent.category}</MetaRow>
        </div>

        <div className="card section">
          <div className="tiny" style={{ marginBottom: 12 }}>Capabilities</div>
          <div className="cap-grid">
            <CapTile on={agent.capabilities.streaming} label="Streaming" icon="zap"/>
            <CapTile on={agent.capabilities.pushNotifications} label="Push notif." icon="bell"/>
            <CapTile on={agent.capabilities.extendedAgentCard} label="Extended card" icon="layers"/>
          </div>
        </div>

        <div className="card section">
          <div className="tiny" style={{ marginBottom: 12 }}>Discovery</div>
          <MetaRow k="Card URL" mono>
            <span className="kvline">
              <span>{cardURL}</span>
              <button className="btn-ghost btn btn-icon btn-sm"><Icon name="copy" size={12}/></button>
            </span>
          </MetaRow>
          <MetaRow k="Status"><StatusPill s={agent.status}/></MetaRow>
          <MetaRow k="Visibility"><VisibilityBadge v={agent.visibility}/></MetaRow>
        </div>

        <ValidationSummary agent={agent} />
      </aside>
    </div>
  );
}

function CapTile({ on, label, icon }) {
  return (
    <div className={'cap-tile' + (on ? ' on' : '')}>
      <Icon name={icon} size={14} />
      <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
      <span className={'badge badge-sm ' + (on ? 'badge-ok' : '')}>{on ? 'on' : 'off'}</span>
    </div>
  );
}

function InterfacesTab({ agent }) {
  return (
    <div className="card section" style={{ maxWidth: 880 }}>
      <div className="section-head">
        <h3>Supported interfaces</h3>
        <button className="btn btn-sm"><Icon name="plus" size={13}/>Add interface</button>
      </div>
      <ul className="iface-list">
        {agent.supportedInterfaces.map((i, idx) => (
          <li key={idx} className="iface-item">
            <div className="iface-item-head">
              <ProtocolBadge p={i.protocolBinding}/>
              <span className="muted mono" style={{ fontSize: 11 }}>v{i.protocolVersion}</span>
              {i.preferred && <span className="badge badge-sm badge-signal"><span className="dot"></span>preferred</span>}
            </div>
            <div className="iface-url mono">{i.url}</div>
            <div className="iface-foot">
              <span className="muted" style={{ fontSize: 11.5 }}>Reachable · 312ms</span>
              <button className="btn-ghost btn btn-sm"><Icon name="terminal" size={12}/>Test</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardTab({ agent }) {
  const card = useMemoD(() => window.buildAgentCardJSON(agent), [agent]);
  return (
    <div className="detail-card-tab">
      <div className="card section" style={{ flex: 1, minWidth: 0 }}>
        <div className="section-head">
          <h3>Agent Card snapshot</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm"><Icon name="download" size={12}/>Download</button>
            <button className="btn btn-sm"><Icon name="copy" size={12}/>Copy</button>
            <button className="btn btn-sm"><Icon name="history" size={12}/>Diff vs previous</button>
          </div>
        </div>
        <window.HighlightedJSON obj={card} style={{ maxHeight: 'calc(100vh - 280px)' }} />
      </div>
      <aside style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card section">
          <div className="tiny" style={{ marginBottom: 10 }}>Snapshot</div>
          <MetaRow k="Schema" mono>a2a/0.3</MetaRow>
          <MetaRow k="Checksum" mono>sha256:a3f2…b81e</MetaRow>
          <MetaRow k="Fetched" mono>{window.fmtAgo(agent.lastValidated)}</MetaRow>
          <MetaRow k="Size" mono>2.4 KB</MetaRow>
        </div>
        <div className="card section">
          <div className="tiny" style={{ marginBottom: 10 }}>Version history</div>
          <ul className="ver-list">
            <li className="ver-item current">
              <span className="ver-dot signal"></span>
              <span className="mono">v{agent.version}</span>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>now</span>
            </li>
            <li className="ver-item">
              <span className="ver-dot"></span>
              <span className="mono muted">v{agent.version.replace(/\d+$/, n => String(Math.max(0, +n - 1)))}</span>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>3d ago</span>
            </li>
            <li className="ver-item">
              <span className="ver-dot"></span>
              <span className="mono muted">v{agent.version.replace(/(\d+)\.\d+$/, (_,n) => (+n)+'.0')}</span>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>2w ago</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ValidationTab({ agent }) {
  const runs = [
    { id: 1, ts: agent.lastValidated, status: agent.validationStatus, score: agent.score, ms: 312 },
    { id: 2, ts: '2026-05-24T17:00:00Z', status: 'passed', score: agent.score - 2, ms: 287 },
    { id: 3, ts: '2026-05-23T17:00:00Z', status: 'passed', score: agent.score - 1, ms: 401 },
    { id: 4, ts: '2026-05-22T17:00:00Z', status: 'warning', score: 76, ms: 522 },
    { id: 5, ts: '2026-05-21T17:00:00Z', status: 'passed', score: agent.score - 3, ms: 298 },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <ValidationSummary agent={agent} />
      <div className="card section" style={{ flex: 1 }}>
        <div className="section-head">
          <h3>Run history</h3>
          <button className="btn btn-sm"><Icon name="refresh" size={13}/>Run now</button>
        </div>
        <table className="run-table">
          <thead><tr><th>When</th><th>Status</th><th>Score</th><th>Response</th><th></th></tr></thead>
          <tbody>
            {runs.map(r => (
              <tr key={r.id}>
                <td>{window.fmtAgo(r.ts)}</td>
                <td><ValidationDot status={r.status}/> <span className="muted" style={{ fontSize: 12, marginLeft: 6 }}>{r.status}</span></td>
                <td className="mono tnum">{r.score}</td>
                <td className="mono tnum muted">{r.ms}ms</td>
                <td style={{ textAlign: 'right' }}><button className="btn-ghost btn btn-sm">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceDetail({ route, setRoute }) {
  const agent = window.AGENTS.find(a => a.id === route.id);
  if (!agent) return <div style={{ padding: 40 }}>Not found</div>;
  const tab = route.tab || 'overview';
  const setTab = (t) => setRoute({ ...route, tab: t });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'cube' },
    { id: 'interfaces', label: 'Interfaces', icon: 'link', count: agent.supportedInterfaces.length },
    { id: 'card', label: 'Agent Card', icon: 'fileJson' },
    { id: 'validation', label: 'Validation', icon: 'shield' },
    { id: 'test', label: 'Test console', icon: 'terminal' },
    { id: 'history', label: 'Versions', icon: 'history' },
  ];

  return (
    <div className="detail">
      <div className="detail-head">
        <button className="btn btn-ghost btn-sm" onClick={() => setRoute({ name: 'registry' })}>
          <Icon name="chevronLeft" size={14}/>Registry
        </button>
        <Icon name="chevronRight" size={12} className="muted" />
        <span className="mono muted" style={{ fontSize: 12 }}>{agent.provider.organization}</span>
        <Icon name="chevronRight" size={12} className="muted" />
        <span style={{ fontWeight: 500 }}>{agent.name}</span>
      </div>

      <div className="detail-hero">
        <AgentMark agent={agent} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-hero-title">
            <h1>{agent.name}</h1>
            <span className="badge badge-sm mono">v{agent.version}</span>
            <StatusPill s={agent.status}/>
            <VisibilityBadge v={agent.visibility}/>
            <span className={'badge badge-sm ' + (agent.validationStatus === 'passed' ? 'badge-ok' : agent.validationStatus === 'warning' ? 'badge-warn' : 'badge-err')}>
              <ValidationDot status={agent.validationStatus} size={6} />
              {agent.validationStatus} · {agent.score}
            </span>
          </div>
          <p className="detail-hero-desc">{agent.description}</p>
        </div>
        <div className="detail-hero-actions">
          <button className="btn btn-sm"><Icon name="bookmark" size={13}/></button>
          <button className="btn btn-sm" onClick={() => setTab('test')}><Icon name="terminal" size={13}/>Test</button>
          <button className="btn btn-sm"><Icon name="copy" size={13}/>Copy connection</button>
          <button className="btn btn-primary btn-sm"><Icon name="bolt" size={13}/>Use this agent</button>
        </div>
      </div>

      <TabBar tabs={tabs} active={tab} onSelect={setTab} />

      <div className="detail-body">
        {tab === 'overview' && <OverviewTab agent={agent} />}
        {tab === 'interfaces' && <InterfacesTab agent={agent} />}
        {tab === 'card' && <CardTab agent={agent} />}
        {tab === 'validation' && <ValidationTab agent={agent} />}
        {tab === 'test' && <window.TestConsoleEmbedded agent={agent} />}
        {tab === 'history' && <CardTab agent={agent} />}
      </div>
    </div>
  );
}

Object.assign(window, { ServiceDetail, CodeSnippet, TabBar });
