"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@/components/shared/icon";
import { api, type RegistryAgent, type Skill } from "@/lib/api";
import { HighlightedJSON } from "@/lib/json-view";

function ValidationDot({ status, size = 6 }: { status?: string; size?: number }) {
  const color = status === "passed" ? "var(--ok)" : status === "warning" ? "var(--warn)" : status === "failed" ? "var(--err)" : "var(--text-3)";
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function TestConsole({ agentId, agents }: { agentId: string; agents: RegistryAgent[] }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillId, setSkillId] = useState("");
  const [input, setInput] = useState("Hello");
  const [showRaw, setShowRaw] = useState(false);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [lastResponse, setLastResponse] = useState<unknown>(null);
  const [lastRequest, setLastRequest] = useState<unknown>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!agentId) return;
    api.listSkills(agentId).then(res => {
      setSkills(res.skills);
      setSkillId(res.skills[0]?.external_skill_id ?? res.skills[0]?.id ?? "");
    }).catch(() => setSkills([]));
  }, [agentId]);

  const send = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setMessages(m => [...m, { role: "user", text: input }]);
    try {
      const res = await api.sendTestRequest({ service_id: agentId, skill_id: skillId || undefined, message: input });
      setLastRequest(res.raw_request);
      setLastResponse(res.raw_response);
      const agentMsgs = (res.messages as unknown[]).map((m) => {
        const msg = m as Record<string, unknown>;
        return { role: (msg.role as string) ?? "agent", text: typeof msg.text === "string" ? msg.text : JSON.stringify(msg) };
      });
      setMessages(m => [...m, ...agentMsgs]);
    } catch (err) {
      setMessages(m => [...m, { role: "error", text: err instanceof Error ? err.message : "Request failed" }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="tc">
      <div className="tc-controls">
        <div className="tc-control">
          <div className="tiny">Agent</div>
          <select className="select" style={{ width: 260 }} value={agentId} onChange={e => { /* parent handles */ }}>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.provider.organization ?? "Unknown"}</option>)}
          </select>
        </div>
        {skills.length > 0 && (
          <div className="tc-control" style={{ minWidth: 200 }}>
            <div className="tiny">Skill</div>
            <select className="select" value={skillId} onChange={e => setSkillId(e.target.value)}>
              {skills.map(s => <option key={s.id} value={s.external_skill_id ?? s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <button className="btn btn-sm" style={{ marginTop: 18 }} onClick={() => { setMessages([]); setLastResponse(null); setLastRequest(null); }} disabled={messages.length === 0}>
          <Icon name="refresh" size={12} />Reset
        </button>
      </div>

      <div className="tc-grid">
        <div className="tc-pane">
          <div className="tc-pane-head">
            <span className="tiny">Conversation</span>
            {running && <span className="spin" style={{ display: "inline-block", width: 12, height: 12, border: "1.5px solid var(--line-strong)", borderTopColor: "var(--signal)", borderRadius: "50%" }}></span>}
          </div>
          <div className="tc-log" ref={logRef}>
            {messages.length === 0 && (
              <div className="tc-empty">
                <div className="tiny">No requests sent yet</div>
                <p className="muted" style={{ fontSize: 13, maxWidth: 280, textAlign: "center", marginTop: 6 }}>Pick an agent and skill, then send a message to test it.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={"tc-msg " + m.role + " slide-up"}>
                <div className="tc-msg-meta">
                  <span className="badge badge-sm">{m.role}</span>
                </div>
                <div className="tc-msg-body">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="tc-input-row">
            <textarea className="textarea" rows={2} placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
            <button className="btn btn-primary" onClick={send} disabled={running || !input.trim()}>
              <Icon name="send" size={13} />Send
            </button>
          </div>
          <div className="tc-hint muted"><kbd>Ctrl</kbd><kbd>Enter</kbd> to send</div>
        </div>

        <div className="tc-pane">
          <div className="tc-pane-head">
            <span className="tiny">Raw transport</span>
            <div className="seg seg-sm">
              <button className={!showRaw ? "on" : ""} onClick={() => setShowRaw(false)}>Request</button>
              <button className={showRaw ? "on" : ""} onClick={() => setShowRaw(true)}>Response</button>
            </div>
          </div>
          <HighlightedJSON obj={showRaw ? (lastResponse ?? { status: "no response yet" }) : (lastRequest ?? { status: "no request sent" })} style={{ flex: 1, minHeight: 0, border: 0, borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}

export default function ConsolePage() {
  const [agents, setAgents] = useState<RegistryAgent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.discoverAgents()
      .then(res => {
        setAgents(res.agents);
        if (res.agents.length > 0) setAgentId(res.agents[0].id);
      })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty" style={{ padding: 60 }}><Icon name="activity" size={28} className="muted" /><h3>Loading agents…</h3></div>;
  if (agents.length === 0) return <div className="empty" style={{ padding: 60 }}><Icon name="search" size={28} className="muted" /><h3>No agents available</h3><p className="muted">Register an agent first, then return to the test console.</p></div>;

  return (
    <div className="tc-page">
      <div className="tc-page-head">
        <div>
          <div className="tiny">Test console</div>
          <h1>Send a sample A2A request</h1>
          <p className="muted" style={{ maxWidth: 560 }}>Pick any registered agent and send a message through Pier&apos;s controlled test runner. Credentials are read from the secret store and never exposed.</p>
        </div>
      </div>
      <TestConsole agentId={agentId} agents={agents} />
    </div>
  );
}
