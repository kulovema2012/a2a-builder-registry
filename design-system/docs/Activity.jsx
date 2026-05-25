// Activity.jsx — recent registry events; Approvals — pending publish requests.

const { useState: useStateA, useEffect: useEffectA } = React;

const EVENT_META = {
  'validation.passed':   { icon: 'check2',   color: 'var(--ok)',     label: 'Validation passed' },
  'validation.failed':   { icon: 'alert',    color: 'var(--err)',    label: 'Validation failed' },
  'version.published':   { icon: 'bolt',     color: 'var(--signal)', label: 'Version published' },
  'service.registered':  { icon: 'plus',     color: 'var(--info)',   label: 'Service registered' },
  'service.suspended':   { icon: 'pause',    color: 'var(--err)',    label: 'Service suspended' },
  'approval.requested':  { icon: 'flag',     color: 'var(--warn)',   label: 'Approval requested' },
  'skill.added':         { icon: 'plus',     color: 'var(--violet)', label: 'Skill added' },
};

function ActivityView({ route, setRoute }) {
  // Tick to keep timestamps live-feeling
  const [, force] = useStateA(0);
  useEffectA(() => { const t = setInterval(() => force(x => x + 1), 30000); return () => clearInterval(t); }, []);

  const byAgent = window.AGENTS.reduce((m, a) => { m[a.id] = a; return m; }, {});

  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">Activity</div>
          <h1>Registry activity</h1>
          <p className="muted">Validations, version bumps, registrations, and admin actions across your workspace.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm"><Icon name="filter" size={13}/>Filter</button>
          <button className="btn btn-sm"><Icon name="download" size={13}/>Export</button>
        </div>
      </div>
      <ul className="activity-list">
        {window.ACTIVITY.map((ev, i) => {
          const meta = EVENT_META[ev.kind] || { icon: 'info', color: 'var(--text-2)', label: ev.kind };
          const agent = byAgent[ev.svcId];
          return (
            <li key={i} className="activity-item">
              <div className="activity-spine">
                <div className="activity-icon" style={{ color: meta.color, borderColor: meta.color + '40', background: meta.color + '14' }}>
                  <Icon name={meta.icon} size={13}/>
                </div>
                {i < window.ACTIVITY.length - 1 && <div className="activity-line"></div>}
              </div>
              <div className="activity-body card card-hover" onClick={() => agent && setRoute({ name: 'detail', id: agent.id, tab: 'overview' })}>
                <div className="activity-row">
                  <span className="mono" style={{ color: meta.color, fontSize: 12 }}>{ev.kind}</span>
                  <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{window.fmtAgo(ev.ts)}</span>
                </div>
                <div className="activity-row" style={{ marginTop: 4 }}>
                  {agent && <AgentMark agent={agent} size={20} />}
                  <span style={{ fontWeight: 500 }}>{agent?.name}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>v{agent?.version}</span>
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--text-2)', fontSize: 13 }}>{ev.summary}</p>
                <div className="activity-row" style={{ marginTop: 8 }}>
                  <span className="muted mono" style={{ fontSize: 11 }}>{ev.actor}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ApprovalsView({ route, setRoute }) {
  const pending = window.AGENTS.filter(a => a.status === 'beta' || a.status === 'draft').slice(0, 4);
  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">Approvals</div>
          <h1>Pending review</h1>
          <p className="muted">Services awaiting public listing approval. Reviewers can approve, reject, or suspend.</p>
        </div>
      </div>
      <div className="approvals">
        {pending.map(a => (
          <div key={a.id} className="card section approval-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AgentMark agent={a} size={36}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{a.name}</span>
                  <span className="badge badge-sm mono">v{a.version}</span>
                  <StatusPill s={a.status}/>
                </div>
                <div className="muted mono" style={{ fontSize: 12, marginTop: 2 }}>{a.provider.organization} · requested by {a.owner}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={() => setRoute({ name: 'detail', id: a.id })}>Review</button>
                <button className="btn btn-sm btn-danger"><Icon name="x" size={12}/>Reject</button>
                <button className="btn btn-primary btn-sm"><Icon name="check" size={12}/>Approve</button>
              </div>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '12px 0 0' }}>{a.description}</p>
            <div className="hr" style={{ margin: '12px 0' }}></div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
              <span className="muted">Validation: <span className={'mono ' + (a.validationStatus === 'passed' ? '' : '')} style={{ color: a.validationStatus === 'passed' ? 'var(--ok)' : a.validationStatus === 'warning' ? 'var(--warn)' : 'var(--err)' }}>{a.validationStatus} · {a.score}</span></span>
              <span className="muted">Skills: <span className="mono">{a.skills.length}</span></span>
              <span className="muted">Auth: <span className="mono">{a.auth.type}</span></span>
              <span className="muted">Visibility requested: <span className="mono">public</span></span>
              <span className="muted" style={{ marginLeft: 'auto' }}>{window.fmtAgo(a.lastValidated)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericView({ title, subtitle }) {
  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">{title}</div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
      </div>
      <div className="empty" style={{ marginTop: 32 }}>
        <Icon name="cog" size={28} className="muted"/>
        <h3>Coming soon</h3>
        <p className="muted">This surface is not part of the MVP scope.</p>
      </div>
    </div>
  );
}

Object.assign(window, { ActivityView, ApprovalsView, GenericView });
