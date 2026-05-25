// TestConsole.jsx — send a sample A2A request and view response.

const { useState: useStateT, useEffect: useEffectT, useRef: useRefT } = React;

const SAMPLE_RESPONSES = {
  svc_weatherwise: [
    { role: 'agent', kind: 'text', text: 'San Francisco, next 24h:\n\n• Tonight: 54°F, mostly clear, 0% precip.\n• Sun morning: 58°F, low marine layer clearing by 10am.\n• Sun afternoon: 67°F, sunny, breezy from the west 12 mph.\n• Sun evening: 60°F, partly cloudy.\n\nConfidence: high (model ensemble agreement 0.94).' },
  ],
  svc_marketscout: [
    { role: 'agent', kind: 'text', text: '**NVDA — briefing**\n\nFundamentals: rev ttm $138B, gross margin 75%, fwd P/E 31x.\nRecent: Q1 beat on data-center segment, raised FY guide.\nAnalyst consensus: Buy (38 / 45). PT median $1,250.\nKey risks: export controls to PRC, Blackwell ramp execution.' },
  ],
  default: [
    { role: 'agent', kind: 'text', text: 'Acknowledged. Working on this task — streaming response.' },
    { role: 'agent', kind: 'text', text: '\n\nHere is a sample structured response for this skill. In production this would come from the agent\'s remote endpoint via JSON-RPC.' },
  ]
};

function TestConsoleEmbedded({ agent }) {
  const [skillId, setSkillId] = useStateT(agent.skills[0]?.id);
  const skill = agent.skills.find(s => s.id === skillId) || agent.skills[0];
  const [input, setInput] = useStateT(skill?.examples?.[0] || 'Hello');
  const [authProfile, setAuthProfile] = useStateT('dev');
  const [showRaw, setShowRaw] = useStateT(false);
  const [running, setRunning] = useStateT(false);
  const [messages, setMessages] = useStateT([]);
  const [taskState, setTaskState] = useStateT(null); // submitted | working | completed
  const logRef = useRefT(null);

  useEffectT(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  useEffectT(() => {
    setInput(skill?.examples?.[0] || 'Hello');
  }, [skillId]);

  const send = () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setTaskState('submitted');
    const userMsg = { role: 'user', kind: 'text', text: input };
    setMessages(m => [...m, userMsg]);

    setTimeout(() => setTaskState('working'), 350);

    const responses = SAMPLE_RESPONSES[agent.id] || SAMPLE_RESPONSES.default;
    let i = 0;
    const tick = () => {
      if (i >= responses.length) {
        setRunning(false); setTaskState('completed');
        return;
      }
      const item = responses[i];
      setMessages(m => [...m, item]);
      i++;
      setTimeout(tick, 700 + Math.random() * 600);
    };
    setTimeout(tick, 600);
  };

  const reset = () => { setMessages([]); setTaskState(null); };

  const rpcRequest = {
    jsonrpc: '2.0', id: 'tc-' + Math.floor(Math.random() * 1e6),
    method: agent.capabilities.streaming ? 'message/stream' : 'message/send',
    params: { message: { role: 'user', parts: [{ kind: 'text', text: input }] }, skill: skillId }
  };

  return (
    <div className="tc">
      <div className="tc-controls">
        <div className="tc-control">
          <div className="tiny">Endpoint</div>
          <div className="tc-endpoint mono">{agent.supportedInterfaces[0].url}</div>
        </div>
        <div className="tc-control" style={{ minWidth: 200 }}>
          <div className="tiny">Skill</div>
          <select className="select" value={skillId} onChange={e => setSkillId(e.target.value)}>
            {agent.skills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
        </div>
        <div className="tc-control" style={{ minWidth: 180 }}>
          <div className="tiny">Auth profile</div>
          <select className="select" value={authProfile} onChange={e => setAuthProfile(e.target.value)}>
            <option value="dev">dev (secret_ref:dev-key)</option>
            <option value="staging">staging</option>
            <option value="production">production (admin only)</option>
          </select>
        </div>
        <button className="btn btn-sm" style={{ marginTop: 18 }} onClick={reset} disabled={messages.length === 0}>
          <Icon name="refresh" size={12}/>Reset
        </button>
      </div>

      <div className="tc-grid">
        <div className="tc-pane">
          <div className="tc-pane-head">
            <span className="tiny">Conversation</span>
            <div className="tc-state">
              {taskState && <>
                <ValidationDot status={taskState === 'completed' ? 'passed' : taskState === 'working' ? 'warning' : 'unknown'} />
                <span className="muted mono" style={{ fontSize: 11 }}>{taskState}</span>
              </>}
              {running && <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '1.5px solid var(--line-strong)', borderTopColor: 'var(--signal)', borderRadius: '50%' }}></span>}
            </div>
          </div>
          <div className="tc-log" ref={logRef}>
            {messages.length === 0 && (
              <div className="tc-empty">
                <div className="tiny">No requests sent yet</div>
                <p className="muted" style={{ fontSize: 13, maxWidth: 280, textAlign: 'center', marginTop: 6 }}>
                  Pick a skill and send a sample message to confirm the agent responds.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={'tc-msg ' + m.role + ' slide-up'}>
                <div className="tc-msg-meta">
                  <span className="badge badge-sm">{m.role}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>{m.kind}</span>
                </div>
                <div className="tc-msg-body">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="tc-input-row">
            <textarea className="textarea" rows={2} placeholder="Type a message..."
                      value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}/>
            <button className="btn btn-primary" onClick={send} disabled={running || !input.trim()}>
              <Icon name="send" size={13}/>Send
            </button>
          </div>
          <div className="tc-hint muted">
            <kbd>⌘</kbd><kbd>↵</kbd> to send · credentials are auto-redacted in logs
          </div>
        </div>

        <div className="tc-pane">
          <div className="tc-pane-head">
            <span className="tiny">Raw transport</span>
            <div className="seg seg-sm">
              <button className={!showRaw ? 'on' : ''} onClick={() => setShowRaw(false)}>Request</button>
              <button className={showRaw ? 'on' : ''} onClick={() => setShowRaw(true)}>Response</button>
            </div>
          </div>
          {!showRaw ? (
            <window.HighlightedJSON obj={rpcRequest} style={{ flex: 1, minHeight: 0, border: 0, borderRadius: 0 }} />
          ) : (
            <window.HighlightedJSON obj={messages.length === 0 ? { status: 'no response yet' } : {
              jsonrpc: '2.0', id: rpcRequest.id,
              result: {
                kind: 'task',
                id: 'task_x9k2',
                status: { state: taskState || 'completed' },
                history: messages.map(m => ({
                  role: m.role,
                  parts: [{ kind: m.kind, text: m.text }]
                }))
              }
            }} style={{ flex: 1, minHeight: 0, border: 0, borderRadius: 0 }} />
          )}
        </div>
      </div>
    </div>
  );
}

function TestConsoleView({ route, setRoute }) {
  const [agentId, setAgentId] = useStateT('svc_weatherwise');
  const agent = window.AGENTS.find(a => a.id === agentId);
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
          <select className="select" style={{ width: 280 }} value={agentId} onChange={e => setAgentId(e.target.value)}>
            {window.AGENTS.map(a => <option key={a.id} value={a.id}>{a.name} — {a.provider.organization}</option>)}
          </select>
        </div>
      </div>
      <TestConsoleEmbedded agent={agent} />
    </div>
  );
}

Object.assign(window, { TestConsoleEmbedded, TestConsoleView });
