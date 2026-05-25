// Registry.jsx — searchable catalog.

const { useState: useStateR, useMemo: useMemoR } = React;

function ValidationDot({ status, size = 6 }) {
  const color = status === 'passed' ? 'var(--ok)'
              : status === 'warning' ? 'var(--warn)'
              : status === 'failed' ? 'var(--err)'
              : 'var(--text-3)';
  return <span style={{
    display: 'inline-block', width: size, height: size,
    borderRadius: '50%', background: color, flexShrink: 0
  }}></span>;
}

function VisibilityBadge({ v }) {
  if (v === 'public') return <span className="badge badge-sm"><Icon name="globe" size={10}/> public</span>;
  if (v === 'internal') return <span className="badge badge-sm"><Icon name="building" size={10}/> internal</span>;
  return <span className="badge badge-sm"><Icon name="lock" size={10}/> private</span>;
}

function StatusPill({ s }) {
  const m = {
    active: { cls: 'badge-ok', label: 'active' },
    beta: { cls: 'badge-info', label: 'beta' },
    draft: { cls: 'badge-warn', label: 'draft' },
    suspended: { cls: 'badge-err', label: 'suspended' },
  }[s] || { cls: '', label: s };
  return <span className={'badge badge-sm ' + m.cls}><span className="dot"></span>{m.label}</span>;
}

function ProtocolBadge({ p }) {
  return <span className="badge badge-sm">{p}</span>;
}

function AgentMark({ agent, size = 36 }) {
  // Deterministic color per agent.
  const hashes = ['#C7F84A','#B8A4FF','#7CC4FF','#FFB58E','#F87171','#4ADE80','#F5B544','#FF9DCE'];
  const i = (agent.name.charCodeAt(0) + agent.name.charCodeAt(1 % agent.name.length)) % hashes.length;
  const c = hashes[i];
  return (
    <div className="agent-mark" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${c}33, ${c}11)`,
      border: '1px solid ' + c + '33',
      color: c,
      fontSize: size * 0.5,
    }}>
      {agent.icon || agent.name[0]}
    </div>
  );
}

function AgentCard({ agent, onOpen, dense }) {
  return (
    <div className={'agent-card' + (dense ? ' dense' : '')} role="button" tabIndex={0}
         onClick={() => onOpen(agent)}
         onKeyDown={(e) => { if (e.key === 'Enter') onOpen(agent); }}>
      <div className="agent-card-head">
        <AgentMark agent={agent} size={dense ? 30 : 36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="agent-card-title">
            <span>{agent.name}</span>
            <ValidationDot status={agent.validationStatus} />
          </div>
          <div className="agent-card-provider">
            <span className="mono">{agent.provider.organization}</span>
            <span className="muted"> · v{agent.version}</span>
          </div>
        </div>
        <span className="btn-ghost btn btn-icon btn-sm" role="button" onClick={(e) => { e.stopPropagation(); }}>
          <Icon name="more" size={14} />
        </span>
      </div>
      <p className="agent-card-desc">{agent.description}</p>
      <div className="agent-card-skills">
        {agent.skills.slice(0, 3).map(s => (
          <span key={s.id} className="skill"><span className="dot"></span>{s.name}</span>
        ))}
        {agent.skills.length > 3 && <span className="skill muted">+{agent.skills.length - 3}</span>}
      </div>
      <div className="agent-card-foot">
        <div className="agent-card-meta">
          <VisibilityBadge v={agent.visibility} />
          <ProtocolBadge p={agent.supportedInterfaces[0].protocolBinding} />
          {agent.capabilities.streaming && <span className="badge badge-sm"><Icon name="zap" size={10}/> stream</span>}
        </div>
        <div className="agent-card-stats tnum mono">
          <span>{window.fmtNum(agent.calls7d)} / 7d</span>
          {agent.uptime != null && <span className="muted">{agent.uptime}%</span>}
        </div>
      </div>
    </div>
  );
}

function AgentRow({ agent, onOpen }) {
  return (
    <button className="agent-row" onClick={() => onOpen(agent)}>
      <div className="agent-row-name">
        <AgentMark agent={agent} size={28} />
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{agent.name}</span>
            <ValidationDot status={agent.validationStatus} />
            <span className="muted mono" style={{ fontSize: 11 }}>v{agent.version}</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>{agent.provider.organization}</div>
        </div>
      </div>
      <div className="agent-row-desc">{agent.description}</div>
      <div className="agent-row-skills">
        {agent.skills.slice(0, 2).map(s => (
          <span key={s.id} className="skill"><span className="dot"></span>{s.name}</span>
        ))}
        {agent.skills.length > 2 && <span className="muted" style={{ fontSize: 11 }}>+{agent.skills.length - 2}</span>}
      </div>
      <div className="agent-row-meta">
        <ProtocolBadge p={agent.supportedInterfaces[0].protocolBinding} />
        <VisibilityBadge v={agent.visibility} />
      </div>
      <div className="agent-row-calls mono tnum muted">{window.fmtNum(agent.calls7d)}</div>
      <Icon name="chevronRight" size={14} className="muted" />
    </button>
  );
}

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useStateR(defaultOpen);
  return (
    <div className="filter-group">
      <button className="filter-head" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
      </button>
      {open && <div className="filter-body">{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count }) {
  return (
    <label className="check-row">
      <span className={'check' + (checked ? ' on' : '')}>
        {checked && <Icon name="check" size={11} stroke={2.5} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="muted mono" style={{ fontSize: 11 }}>{count}</span>}
    </label>
  );
}

function RegistryView({ route, setRoute, layout, density }) {
  const [q, setQ] = useStateR('');
  const [view, setView] = useStateR(layout || 'grid'); // grid | list | table
  const [filters, setFilters] = useStateR({
    visibility: new Set(),
    protocol: new Set(),
    auth: new Set(),
    status: new Set(),
    category: new Set(route.filter?.category ? [route.filter.category] : []),
    capability: new Set(),
  });
  const [sort, setSort] = useStateR('relevance');

  const toggle = (group, val) => setFilters(f => {
    const s = new Set(f[group]);
    s.has(val) ? s.delete(val) : s.add(val);
    return { ...f, [group]: s };
  });

  const filtered = useMemoR(() => {
    let list = window.AGENTS.filter(a => {
      if (q && !(a.name + ' ' + a.description + ' ' + a.tags.join(' ') + ' ' + a.skills.map(s => s.name).join(' '))
              .toLowerCase().includes(q.toLowerCase())) return false;
      if (filters.visibility.size && !filters.visibility.has(a.visibility)) return false;
      if (filters.protocol.size && !a.supportedInterfaces.some(i => filters.protocol.has(i.protocolBinding))) return false;
      if (filters.auth.size && !filters.auth.has(a.auth.type)) return false;
      if (filters.status.size && !filters.status.has(a.status)) return false;
      if (filters.category.size && !filters.category.has(a.category)) return false;
      if (filters.capability.size) {
        for (const c of filters.capability) if (!a.capabilities[c]) return false;
      }
      return true;
    });
    if (sort === 'calls') list = list.sort((a,b) => (b.calls7d||0) - (a.calls7d||0));
    else if (sort === 'score') list = list.sort((a,b) => b.score - a.score);
    else if (sort === 'recent') list = list.sort((a,b) => new Date(b.lastValidated) - new Date(a.lastValidated));
    return list;
  }, [q, filters, sort]);

  const onOpen = (a) => setRoute({ name: 'detail', id: a.id, tab: 'overview' });

  const totalActive = window.AGENTS.filter(a => a.status === 'active').length;

  // Counts for filter facets (over current minus this facet, but simpler: total)
  const counts = useMemoR(() => {
    const c = { visibility: {}, protocol: {}, auth: {}, status: {}, category: {} };
    window.AGENTS.forEach(a => {
      c.visibility[a.visibility] = (c.visibility[a.visibility] || 0) + 1;
      a.supportedInterfaces.forEach(i => c.protocol[i.protocolBinding] = (c.protocol[i.protocolBinding] || 0) + 1);
      c.auth[a.auth.type] = (c.auth[a.auth.type] || 0) + 1;
      c.status[a.status] = (c.status[a.status] || 0) + 1;
      c.category[a.category] = (c.category[a.category] || 0) + 1;
    });
    return c;
  }, []);

  const activeFilterCount =
    filters.visibility.size + filters.protocol.size + filters.auth.size +
    filters.status.size + filters.category.size + filters.capability.size;

  return (
    <div className="registry">
      <div className="registry-head">
        <div className="registry-title">
          <h1>Registry</h1>
          <span className="tiny">{filtered.length} of {window.AGENTS.length} services · {totalActive} active</span>
        </div>
        <div className="registry-actions">
          <button className="btn btn-sm"><Icon name="upload" size={14}/>Import card URL</button>
          <button className="btn btn-primary btn-sm" onClick={() => setRoute({ name: 'builder', step: 0 })}>
            <Icon name="plus" size={14}/>Register agent
          </button>
        </div>
      </div>

      <div className="registry-toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input className="search-input" placeholder="Search by name, skill, tag, capability…"
                 value={q} onChange={e => setQ(e.target.value)} />
          {q && <button className="btn-ghost btn btn-icon btn-sm" onClick={() => setQ('')}><Icon name="x" size={12}/></button>}
        </div>
        <div className="vr" style={{ height: 22 }}></div>
        <div className="seg">
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} title="Grid"><Icon name="grid" size={14}/></button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} title="List"><Icon name="list" size={14}/></button>
          <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')} title="Table"><Icon name="table" size={14}/></button>
        </div>
        <div className="vr" style={{ height: 22 }}></div>
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="relevance">Sort: Relevance</option>
          <option value="calls">Sort: Most calls</option>
          <option value="score">Sort: Validation score</option>
          <option value="recent">Sort: Recently validated</option>
        </select>
      </div>

      <div className="registry-body">
        <aside className="filters">
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 10px' }}>
            <div className="tiny">Filters {activeFilterCount > 0 && <span className="badge badge-sm badge-signal">{activeFilterCount}</span>}</div>
            {activeFilterCount > 0 && (
              <button className="btn-ghost btn btn-sm" style={{ marginLeft: 'auto' }}
                      onClick={() => setFilters({ visibility: new Set(), protocol: new Set(), auth: new Set(), status: new Set(), category: new Set(), capability: new Set() })}>
                Clear
              </button>
            )}
          </div>

          <FilterGroup title="Visibility">
            {['public','internal','private'].map(v => (
              <CheckRow key={v} label={v} count={counts.visibility[v] || 0}
                        checked={filters.visibility.has(v)} onChange={() => toggle('visibility', v)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Protocol binding">
            {['JSONRPC','GRPC','HTTP+JSON'].map(p => (
              <CheckRow key={p} label={p} count={counts.protocol[p] || 0}
                        checked={filters.protocol.has(p)} onChange={() => toggle('protocol', p)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Authentication">
            {['apiKey','oauth2','none'].map(a => (
              <CheckRow key={a} label={a} count={counts.auth[a] || 0}
                        checked={filters.auth.has(a)} onChange={() => toggle('auth', a)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Status">
            {['active','beta','draft','suspended'].map(s => (
              <CheckRow key={s} label={s} count={counts.status[s] || 0}
                        checked={filters.status.has(s)} onChange={() => toggle('status', s)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Capability">
            {[['streaming','streaming'],['pushNotifications','push notifications'],['extendedAgentCard','extended card']].map(([k,l]) => (
              <CheckRow key={k} label={l}
                        checked={filters.capability.has(k)} onChange={() => toggle('capability', k)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Category" defaultOpen={false}>
            {window.CATEGORIES.map(c => (
              <CheckRow key={c} label={c} count={counts.category[c] || 0}
                        checked={filters.category.has(c)} onChange={() => toggle('category', c)} />
            ))}
          </FilterGroup>
        </aside>

        <main className="catalog">
          {filtered.length === 0 ? (
            <div className="empty">
              <Icon name="search" size={28} className="muted" />
              <h3>No agents match</h3>
              <p className="muted">Try clearing filters or import an Agent Card by URL.</p>
            </div>
          ) : view === 'grid' ? (
            <div className={'grid' + (density === 'compact' ? ' compact' : '')}>
              {filtered.map(a => <AgentCard key={a.id} agent={a} onOpen={onOpen} dense={density === 'compact'} />)}
            </div>
          ) : view === 'list' ? (
            <div className="list">
              <div className="list-head">
                <div>Agent</div>
                <div>Description</div>
                <div>Top skills</div>
                <div>Protocol · Visibility</div>
                <div style={{ textAlign: 'right' }}>Calls / 7d</div>
                <div></div>
              </div>
              {filtered.map(a => <AgentRow key={a.id} agent={a} onOpen={onOpen} />)}
            </div>
          ) : (
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Agent</th><th>Provider</th><th>Skills</th>
                  <th>Protocol</th><th>Auth</th><th>Visibility</th>
                  <th>Status</th><th>Score</th><th>Calls/7d</th><th>Validated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} onClick={() => onOpen(a)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ValidationDot status={a.validationStatus} />
                        <span style={{ fontWeight: 500 }}>{a.name}</span>
                        <span className="muted mono" style={{ fontSize: 11 }}>v{a.version}</span>
                      </div>
                    </td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{a.provider.organization}</td>
                    <td className="muted">{a.skills.length} skills</td>
                    <td><ProtocolBadge p={a.supportedInterfaces[0].protocolBinding}/></td>
                    <td className="mono" style={{ fontSize: 12 }}>{a.auth.type}</td>
                    <td><VisibilityBadge v={a.visibility}/></td>
                    <td><StatusPill s={a.status}/></td>
                    <td className="mono tnum">{a.score}</td>
                    <td className="mono tnum muted">{window.fmtNum(a.calls7d)}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{window.fmtAgo(a.lastValidated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { RegistryView, AgentMark, ValidationDot, VisibilityBadge, StatusPill, ProtocolBadge });
